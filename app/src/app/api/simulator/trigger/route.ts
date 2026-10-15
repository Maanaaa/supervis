import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Alert } from '@/models/Alert';
import { Server } from '@/models/Server';
import { emitSocket } from '@/lib/socket';
import type { AlertSeverity } from '@/types/alert';

export type SimulatorActionType =
  'cpu' | 'disk' | 'nginx' | 'server_down' | 'server_up' | 'reset' | 'custom';

interface SimulatorRequestBody {
  type?: SimulatorActionType;
  serverId?: string;
  serverName?: string;
  title?: string;
  message?: string;
  severity?: AlertSeverity;
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'API Simulateur de Pannes & Outil de Validation',
    availableActions: ['cpu', 'disk', 'nginx', 'server_down', 'server_up', 'reset', 'custom'],
    usage: {
      method: 'POST',
      endpoint: '/api/simulator/trigger',
      body: {
        type: 'cpu | disk | nginx | server_down | server_up | reset | custom',
        serverName: 'optionnel',
        serverId: 'optionnel',
        title: 'optionnel',
        message: 'optionnel',
        severity: 'INFO | WARNING | CRITICAL (optionnel)',
      },
    },
  });
}

export async function POST(request: Request) {
  try {
    await connectDB();

    let body: SimulatorRequestBody = {};
    try {
      body = await request.json();
    } catch {
      // Body vide par défaut
    }

    const type = (body.type?.toLowerCase() || 'cpu') as SimulatorActionType;

    switch (type) {
      case 'cpu': {
        const serverName = body.serverName?.trim() || 'srv-prod-api';
        const title = body.title?.trim() || 'Charge CPU 98%';
        const message =
          body.message?.trim() ||
          'Surcharge processeur critique (> 95% depuis 3 min) sur le thread principal.';
        const severity: AlertSeverity = body.severity || 'CRITICAL';

        // Recherche d'un serveur existant avec ce nom ou association
        const existingServer = await Server.findOne({ name: serverName });

        const alert = await Alert.create({
          serverName,
          serverId: body.serverId || existingServer?._id || undefined,
          title,
          message,
          severity,
          status: 'OPEN',
        });

        emitSocket('alert:new', alert.toJSON());

        return NextResponse.json(
          {
            success: true,
            action: 'cpu',
            message: `Panne CPU simulée avec succès sur ${serverName}.`,
            alert,
          },
          { status: 201 }
        );
      }

      case 'disk': {
        const serverName = body.serverName?.trim() || 'srv-database-01';
        const title = body.title?.trim() || 'Disque saturé à 96%';
        const message =
          body.message?.trim() ||
          'Partition racine / saturée : 1.2 Go disponible sur 50 Go. Seuil critique dépassé.';
        const severity: AlertSeverity = body.severity || 'WARNING';

        const existingServer = await Server.findOne({ name: serverName });

        const alert = await Alert.create({
          serverName,
          serverId: body.serverId || existingServer?._id || undefined,
          title,
          message,
          severity,
          status: 'OPEN',
        });

        emitSocket('alert:new', alert.toJSON());

        return NextResponse.json(
          {
            success: true,
            action: 'disk',
            message: `Alerte disque simulée avec succès sur ${serverName}.`,
            alert,
          },
          { status: 201 }
        );
      }

      case 'nginx': {
        const serverName = body.serverName?.trim() || 'srv-lb-edge';
        const title = body.title?.trim() || 'Nginx unresponsive';
        const message =
          body.message?.trim() ||
          'Le reverse proxy Nginx ne répond plus sur le port 80/443 (502 Bad Gateway).';
        const severity: AlertSeverity = body.severity || 'CRITICAL';

        const existingServer = await Server.findOne({ name: serverName });

        const alert = await Alert.create({
          serverName,
          serverId: body.serverId || existingServer?._id || undefined,
          title,
          message,
          severity,
          status: 'OPEN',
        });

        emitSocket('alert:new', alert.toJSON());

        return NextResponse.json(
          {
            success: true,
            action: 'nginx',
            message: `Panne Nginx simulée avec succès sur ${serverName}.`,
            alert,
          },
          { status: 201 }
        );
      }

      case 'server_down': {
        let targetServer = null;

        if (body.serverId) {
          targetServer = await Server.findById(body.serverId);
        } else if (body.serverName) {
          targetServer = await Server.findOne({ name: body.serverName });
        } else {
          // Prendre un serveur existant UP ou n'importe quel serveur
          targetServer =
            (await Server.findOne({ status: 'UP' })) ||
            (await Server.findOne().sort({ createdAt: 1 }));
        }

        // Si aucun serveur n'existe en base, on en crée un automatiquement pour la démo
        if (!targetServer) {
          targetServer = await Server.create({
            name: body.serverName || 'srv-demo-auth',
            host: 'auth.internal',
            port: 8080,
            healthUrl: '/health',
            description: 'Serveur de démo généré pour la simulation',
            status: 'UP',
            latencyMs: 14,
            lastCheckAt: new Date(),
          });
        }

        const now = new Date();
        const updatedServer = await Server.findByIdAndUpdate(
          targetServer._id,
          {
            $set: {
              status: 'DOWN',
              latencyMs: 3000,
              lastCheckAt: now,
            },
          },
          { new: true }
        );

        const alert = await Alert.create({
          serverId: targetServer._id,
          serverName: targetServer.name,
          title: `Serveur ${targetServer.name} injoignable`,
          message: `Échec du health check sur http://${targetServer.host}:${targetServer.port}${
            targetServer.healthUrl || '/health'
          } : Délai d'attente dépassé (Timeout 3000ms)`,
          severity: 'CRITICAL',
          status: 'OPEN',
        });

        if (updatedServer) {
          emitSocket('server:status_change', updatedServer.toJSON());
        }
        emitSocket('alert:new', alert.toJSON());

        return NextResponse.json(
          {
            success: true,
            action: 'server_down',
            message: `Serveur ${targetServer.name} basculé en DOWN et alerte créée.`,
            server: updatedServer,
            alert,
          },
          { status: 200 }
        );
      }

      case 'server_up': {
        let targetServer = null;
        if (body.serverId) {
          targetServer = await Server.findById(body.serverId);
        } else if (body.serverName) {
          targetServer = await Server.findOne({ name: body.serverName });
        } else {
          targetServer = (await Server.findOne({ status: 'DOWN' })) || (await Server.findOne());
        }

        if (!targetServer) {
          return NextResponse.json(
            { success: false, error: 'Aucun serveur trouvé à basculer en UP.' },
            { status: 404 }
          );
        }

        const updatedServer = await Server.findByIdAndUpdate(
          targetServer._id,
          {
            $set: {
              status: 'UP',
              latencyMs: Math.floor(Math.random() * 20) + 5,
              lastCheckAt: new Date(),
            },
          },
          { new: true }
        );

        if (updatedServer) {
          emitSocket('server:status_change', updatedServer.toJSON());
        }

        return NextResponse.json({
          success: true,
          action: 'server_up',
          message: `Serveur ${targetServer.name} rétabli en UP.`,
          server: updatedServer,
        });
      }

      case 'reset': {
        // 1. Rétablir tous les serveurs DOWN en UP
        const downServers = await Server.find({ status: 'DOWN' });
        const updatedServers = [];

        for (const server of downServers) {
          const updated = await Server.findByIdAndUpdate(
            server._id,
            {
              $set: {
                status: 'UP',
                latencyMs: Math.floor(Math.random() * 20) + 8,
                lastCheckAt: new Date(),
              },
            },
            { new: true }
          );
          if (updated) {
            emitSocket('server:status_change', updated.toJSON());
            updatedServers.push(updated);
          }
        }

        // 2. Résoudre les alertes actives
        const activeAlerts = await Alert.find({ status: { $in: ['OPEN', 'ACK'] } });
        const resolvedAlerts = [];

        for (const alert of activeAlerts) {
          const resolved = await Alert.findByIdAndUpdate(
            alert._id,
            {
              $set: {
                status: 'RESOLVED',
                assignedTo: alert.assignedTo || 'Simulateur',
                resolvedAt: new Date(),
                resolutionComment:
                  'Incident résolu automatiquement par la réinitialisation du simulateur.',
              },
            },
            { new: true }
          );
          if (resolved) {
            emitSocket('alert:updated', resolved.toJSON());
            resolvedAlerts.push(resolved);
          }
        }

        return NextResponse.json({
          success: true,
          action: 'reset',
          message: 'Réinitialisation complète effectuée.',
          serversRestoredCount: updatedServers.length,
          alertsResolvedCount: resolvedAlerts.length,
        });
      }

      case 'custom': {
        const { serverName, title, message, severity = 'WARNING', serverId } = body;

        if (!serverName?.trim() || !title?.trim() || !message?.trim()) {
          return NextResponse.json(
            {
              success: false,
              error:
                'Les champs serverName, title et message sont requis pour une simulation personnalisée.',
            },
            { status: 400 }
          );
        }

        const alert = await Alert.create({
          serverName: serverName.trim(),
          title: title.trim(),
          message: message.trim(),
          severity,
          status: 'OPEN',
          serverId: serverId || undefined,
        });

        emitSocket('alert:new', alert.toJSON());

        return NextResponse.json(
          {
            success: true,
            action: 'custom',
            message: 'Alerte personnalisée injectée avec succès.',
            alert,
          },
          { status: 201 }
        );
      }

      default:
        return NextResponse.json(
          {
            success: false,
            error: `Type de simulation inconnu : "${String(type)}". Valeurs acceptées : cpu, disk, nginx, server_down, server_up, reset, custom`,
          },
          { status: 400 }
        );
    }
  } catch (error: unknown) {
    console.error('[API Simulator POST] Erreur :', error);
    const message = error instanceof Error ? error.message : 'Erreur interne du serveur';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
