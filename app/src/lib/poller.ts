import { Server, IServerDocument } from '@/models/Server';
import { Alert } from '@/models/Alert';
import { connectDB } from '@/lib/db';
import { getIO } from '@/lib/socket';

export const DEFAULT_TIMEOUT_MS = 3000;
export const DEFAULT_CYCLE_INTERVAL_MS = 300000; // 5 minutes

export interface HealthCheckResult {
  serverId: string;
  serverName: string;
  isUp: boolean;
  statusCode?: number;
  latencyMs: number;
  error?: string;
  url: string;
}

/**
 * Construit l'URL complète de health check pour un serveur donné.
 */
export function buildHealthUrl(server: {
  host: string;
  port?: number;
  healthUrl?: string;
}): string {
  const rawHealth = server.healthUrl?.trim() || '/health';

  // Si l'URL de santé est déjà absolue
  if (/^https?:\/\//i.test(rawHealth)) {
    return rawHealth;
  }

  const rawHost = server.host.trim();
  const rawPort = server.port;

  // Si l'hôte inclut déjà un schéma (http:// ou https://)
  if (/^https?:\/\//i.test(rawHost)) {
    try {
      const parsed = new URL(rawHost);
      if (rawPort && !parsed.port) {
        parsed.port = String(rawPort);
      }
      const cleanPath = rawHealth.startsWith('/') ? rawHealth : `/${rawHealth}`;
      return `${parsed.origin}${cleanPath}`;
    } catch {
      // Fallback si URL invalide
    }
  }

  const protocol = rawPort === 443 ? 'https' : 'http';
  const portSuffix = rawPort && rawPort !== 80 && rawPort !== 443 ? `:${rawPort}` : '';
  const cleanPath = rawHealth.startsWith('/') ? rawHealth : `/${rawHealth}`;

  return `${protocol}://${rawHost}${portSuffix}${cleanPath}`;
}

/**
 * Exécute un test HTTP GET sur l'URL cible avec un timeout strict (3 000 ms par défaut).
 */
export async function pingServer(
  url: string,
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<{ isUp: boolean; latencyMs: number; statusCode?: number; error?: string }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const startTime = Date.now();

  try {
    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Supervis-Poller/1.0',
        Accept: '*/*',
      },
    });

    const latencyMs = Math.max(1, Date.now() - startTime);
    const isUp = response.status >= 200 && response.status < 400;

    return {
      isUp,
      latencyMs,
      statusCode: response.status,
      error: isUp
        ? undefined
        : `Statut HTTP ${response.status} (${response.statusText || 'Erreur'})`,
    };
  } catch (err: unknown) {
    const latencyMs = Math.max(1, Date.now() - startTime);
    let errorMessage = 'Erreur réseau inconnue';

    if (err instanceof Error) {
      if (err.name === 'AbortError') {
        errorMessage = `Délai d'attente dépassé (Timeout ${timeoutMs}ms)`;
      } else {
        errorMessage = err.message;
      }
    }

    return {
      isUp: false,
      latencyMs,
      error: errorMessage,
    };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Helper sécurisé pour émettre des événements Socket.IO si l'instance est disponible.
 */
function emitSocket(event: string, payload: unknown): void {
  try {
    const io = getIO();
    if (io) {
      io.emit(event, payload);
    }
  } catch {
    // Silencieux si Socket.IO n'est pas instancié (ex: contexte de test unitaire)
  }
}

/**
 * Teste un serveur individuel, met à jour son état en base et génère une alerte immédiate si KO.
 */
export async function checkSingleServer(
  server: IServerDocument,
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<HealthCheckResult> {
  const targetUrl = buildHealthUrl(server);
  const check = await pingServer(targetUrl, timeoutMs);
  const now = new Date();
  const previousStatus = server.status;

  if (check.isUp) {
    const updatedServer = await Server.findByIdAndUpdate(
      server._id,
      {
        $set: {
          status: 'UP',
          latencyMs: check.latencyMs,
          lastCheckAt: now,
        },
      },
      { new: true }
    );

    // Émission si le statut a changé vers UP
    if (previousStatus !== 'UP' && updatedServer) {
      emitSocket('server:status_change', updatedServer.toJSON());
    }

    return {
      serverId: server._id.toString(),
      serverName: server.name,
      isUp: true,
      statusCode: check.statusCode,
      latencyMs: check.latencyMs,
      url: targetUrl,
    };
  } else {
    // Échec (Timeout, 5xx, Inaccessible) : Alerte immédiate dès le 1er échec
    const updatedServer = await Server.findByIdAndUpdate(
      server._id,
      {
        $set: {
          status: 'DOWN',
          latencyMs: check.latencyMs,
          lastCheckAt: now,
        },
      },
      { new: true }
    );

    const failureReason = check.error || 'Serveur injoignable';

    // Déduplication anti-flood : ne pas créer de doublon si une alerte est déjà active (OPEN ou ACK)
    const existingActiveAlert = await Alert.findOne({
      serverId: server._id,
      status: { $in: ['OPEN', 'ACK'] },
    });

    if (!existingActiveAlert) {
      // Création immédiate de l'alerte CRITICAL en base MongoDB
      const alert = await Alert.create({
        serverId: server._id,
        serverName: server.name,
        title: `Serveur ${server.name} injoignable`,
        message: `Échec du health check sur ${targetUrl} : ${failureReason}`,
        severity: 'CRITICAL',
        status: 'OPEN',
      });

      // Émission Socket.IO instantanée
      emitSocket('alert:new', alert.toJSON());
    }

    if (updatedServer) {
      emitSocket('server:status_change', updatedServer.toJSON());
    }

    return {
      serverId: server._id.toString(),
      serverName: server.name,
      isUp: false,
      statusCode: check.statusCode,
      latencyMs: check.latencyMs,
      error: failureReason,
      url: targetUrl,
    };
  }
}

/**
 * Exécute un cycle complet de sonde de manière séquentielle pas-à-pas sur tous les serveurs enregistrés.
 */
export async function runPollerCycle(
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<HealthCheckResult[]> {
  await connectDB();
  const servers = await Server.find().sort({ createdAt: 1 });
  const results: HealthCheckResult[] = [];

  // Exécution séquentielle pas-à-pas : test du serveur N puis passage au suivant N+1
  for (const server of servers) {
    try {
      const result = await checkSingleServer(server, timeoutMs);
      results.push(result);
    } catch (err: unknown) {
      console.error(
        `[Poller] Erreur inattendue lors de la vérification de ${server.name} (${server._id}):`,
        err
      );
    }
  }

  return results;
}

let pollerIntervalId: NodeJS.Timeout | null = null;
let isCycleRunning = false;

/**
 * Lance la boucle périodique de surveillance (toutes les 5 minutes par défaut).
 */
export function startPoller(
  intervalMs: number = DEFAULT_CYCLE_INTERVAL_MS,
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): NodeJS.Timeout {
  if (pollerIntervalId) {
    clearInterval(pollerIntervalId);
  }

  const pollerTick = async () => {
    if (isCycleRunning) {
      console.warn('[Poller] Le cycle précédent est toujours en cours. Saut de cette itération.');
      return;
    }
    isCycleRunning = true;
    try {
      await runPollerCycle(timeoutMs);
    } catch (err: unknown) {
      console.error('[Poller] Erreur critique lors du cycle de surveillance:', err);
    } finally {
      isCycleRunning = false;
    }
  };

  pollerIntervalId = setInterval(pollerTick, intervalMs);
  if (pollerIntervalId.unref) {
    pollerIntervalId.unref();
  }

  return pollerIntervalId;
}

/**
 * Arrête la boucle périodique de surveillance.
 */
export function stopPoller(): void {
  if (pollerIntervalId) {
    clearInterval(pollerIntervalId);
    pollerIntervalId = null;
  }
  isCycleRunning = false;
}

/**
 * Indique si la boucle périodique est actuellement active.
 */
export function isPollerRunning(): boolean {
  return pollerIntervalId !== null;
}
