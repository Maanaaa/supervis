import {
  buildHealthUrl,
  pingServer,
  startPoller,
  stopPoller,
  isPollerRunning,
  DEFAULT_TIMEOUT_MS,
  DEFAULT_CYCLE_INTERVAL_MS,
} from '@/lib/poller';

describe('Tests Unitaires — Moteur de Sonde Poller (src/lib/poller.ts)', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    stopPoller();
    jest.clearAllMocks();
  });

  describe('buildHealthUrl', () => {
    it('doit construire une URL standard avec port et chemin par défaut', () => {
      const url = buildHealthUrl({ host: '192.168.1.10', port: 8080 });
      expect(url).toBe('http://192.168.1.10:8080/health');
    });

    it("doit gérer le chemin spécifique sans slash d'attaque", () => {
      const url = buildHealthUrl({ host: 'api.local', port: 3000, healthUrl: 'status' });
      expect(url).toBe('http://api.local:3000/status');
    });

    it('doit ignorer le port 80 en http standard', () => {
      const url = buildHealthUrl({ host: 'web.local', port: 80, healthUrl: '/ping' });
      expect(url).toBe('http://web.local/ping');
    });

    it('doit utiliser le protocole https pour le port 443', () => {
      const url = buildHealthUrl({ host: 'secure.local', port: 443, healthUrl: '/check' });
      expect(url).toBe('https://secure.local/check');
    });

    it("doit renvoyer directement l'URL si healthUrl est une URL absolue", () => {
      const url = buildHealthUrl({
        host: 'ignored.local',
        port: 80,
        healthUrl: 'https://status.cloud.provider/v1/health',
      });
      expect(url).toBe('https://status.cloud.provider/v1/health');
    });

    it('doit gérer un hôte contenant déjà un préfixe http', () => {
      const url = buildHealthUrl({
        host: 'http://custom.app:9000',
        healthUrl: '/healthz',
      });
      expect(url).toBe('http://custom.app:9000/healthz');
    });
  });

  describe('pingServer', () => {
    it('doit retourner isUp=true et mesurer la latence en cas de statut 200 OK', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        status: 200,
        statusText: 'OK',
        ok: true,
      } as Response);

      const result = await pingServer('http://127.0.0.1:3000/health', 1000);

      expect(result.isUp).toBe(true);
      expect(result.statusCode).toBe(200);
      expect(result.latencyMs).toBeGreaterThanOrEqual(1);
      expect(result.error).toBeUndefined();
    });

    it('doit retourner isUp=false et une erreur explicite en cas de code HTTP 503', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        status: 503,
        statusText: 'Service Unavailable',
        ok: false,
      } as Response);

      const result = await pingServer('http://127.0.0.1:3000/health', 1000);

      expect(result.isUp).toBe(false);
      expect(result.statusCode).toBe(503);
      expect(result.error).toContain('Statut HTTP 503');
    });

    it('doit retourner isUp=false et une alerte de timeout si AbortError est levée', async () => {
      const abortError = new Error('The operation was aborted');
      abortError.name = 'AbortError';
      global.fetch = jest.fn().mockRejectedValue(abortError);

      const result = await pingServer('http://127.0.0.1:3000/health', 3000);

      expect(result.isUp).toBe(false);
      expect(result.error).toContain("Délai d'attente dépassé (Timeout 3000ms)");
    });

    it('doit retourner isUp=false et le message en cas de refus de connexion réseau', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('connect ECONNREFUSED 127.0.0.1:80'));

      const result = await pingServer('http://127.0.0.1:80/health', 1000);

      expect(result.isUp).toBe(false);
      expect(result.error).toBe('connect ECONNREFUSED 127.0.0.1:80');
    });
  });

  describe('Contrôle du cycle (startPoller, stopPoller, isPollerRunning)', () => {
    it('doit démarrer, signaler l’activité et arrêter la boucle périodique', () => {
      expect(isPollerRunning()).toBe(false);

      const timer = startPoller(10000, 1000);
      expect(timer).toBeDefined();
      expect(isPollerRunning()).toBe(true);

      stopPoller();
      expect(isPollerRunning()).toBe(false);
    });

    it('doit exposer les constantes par défaut de 5 minutes et 3 secondes', () => {
      expect(DEFAULT_CYCLE_INTERVAL_MS).toBe(300000);
      expect(DEFAULT_TIMEOUT_MS).toBe(3000);
    });
  });
});
