const http = require('http');
const { parse } = require('url');
const fs = require('fs');
const path = require('path');
const next = require('next');
const { Server: SocketIOServer } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

// Nettoyage automatique des résidus de build de production lors du lancement en développement
if (dev && fs.existsSync(path.join(__dirname, '.next', 'BUILD_ID'))) {
  try {
    fs.rmSync(path.join(__dirname, '.next'), { recursive: true, force: true });
    console.log('> Cache de production .next nettoyé pour un démarrage de développement propre.');
  } catch (e) {
    console.warn('> Avertissement nettoyage .next :', e.message);
  }
}

async function setupDatabase() {
  if (process.env.MONGODB_URI) {
    return process.env.MONGODB_URI;
  }

  const net = require('net');
  const isLocalMongoUp = await new Promise((resolve) => {
    const s = new net.Socket();
    s.setTimeout(500);
    s.once('connect', () => {
      s.destroy();
      resolve(true);
    });
    s.once('timeout', () => {
      s.destroy();
      resolve(false);
    });
    s.once('error', () => {
      resolve(false);
    });
    s.connect(27017, '127.0.0.1');
  });

  if (isLocalMongoUp) {
    process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/supervis';
    console.log(`> Démon MongoDB local détecté sur le port 27017.`);
    return process.env.MONGODB_URI;
  }

  if (dev) {
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongod = await MongoMemoryServer.create();
      const uri = mongod.getUri();
      process.env.MONGODB_URI = uri;
      console.log(`> Aucun démon MongoDB local détecté sur 27017.`);
      console.log(`> Instance MongoDB en mémoire démarrée automatiquement : ${uri}`);

      // Amorçage initial en dev pour une expérience plug & play immédiate
      const mongoose = require('mongoose');
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 3000 });
      const db = mongoose.connection.db;

      const serversCount = await db.collection('servers').countDocuments();
      if (serversCount === 0) {
        await db.collection('servers').insertMany([
          {
            name: 'web-prod-01',
            ip: '192.168.1.10',
            healthCheckUrl: 'http://192.168.1.10/health',
            status: 'UP',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            name: 'api-gateway-01',
            ip: '192.168.1.11',
            healthCheckUrl: 'http://192.168.1.11/health',
            status: 'WARNING',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            name: 'db-primary-sql',
            ip: '192.168.1.20',
            healthCheckUrl: 'http://192.168.1.20/health',
            status: 'UP',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            name: 'redis-cache-01',
            ip: '192.168.1.30',
            healthCheckUrl: 'http://192.168.1.30/health',
            status: 'UP',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ]);
      }

      const usersCount = await db.collection('users').countDocuments();
      if (usersCount === 0) {
        await db.collection('users').insertMany([
          {
            name: 'Théo',
            email: 'theo@supervis.local',
            role: 'ADMIN',
            isOnDuty: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            name: 'Sarah',
            email: 'sarah@supervis.local',
            role: 'ASTREINTE',
            isOnDuty: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            name: 'Alexandre',
            email: 'alex@supervis.local',
            role: 'ASTREINTE',
            isOnDuty: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ]);
      }

      const alertsCount = await db.collection('alerts').countDocuments();
      if (alertsCount === 0) {
        const now = new Date();
        await db.collection('alerts').insertMany([
          {
            serverName: 'api-gateway-01',
            title: 'Latence API anormalement élevée (> 1200ms)',
            message: 'Le p95 de latence dépasse le seuil garanti de 500ms.',
            severity: 'WARNING',
            status: 'OPEN',
            createdAt: now,
            updatedAt: now,
          },
          {
            serverName: 'redis-cache-01',
            title: 'Perte de connectivité Redis Sentinel',
            message: 'Bascule automatique sur nœud secondaire suite à keepalive timeout.',
            severity: 'CRITICAL',
            status: 'RESOLVED',
            assignedTo: 'Théo',
            assignedAt: new Date(now.getTime() - 40 * 60 * 1000),
            resolvedAt: new Date(now.getTime() - 10 * 60 * 1000),
            resolutionComment: 'Failover Sentinel validé. Cluster opérationnel.',
            createdAt: new Date(now.getTime() - 45 * 60 * 1000),
            updatedAt: new Date(now.getTime() - 10 * 60 * 1000),
          },
        ]);
      }
      console.log(`> Données de démonstration initialisées (serveurs, techniciens, historique).`);
      return uri;
    } catch (err) {
      console.warn(`> Initialisation fallback MongoMemoryServer :`, err.message);
    }
  }

  process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/supervis';
  return process.env.MONGODB_URI;
}

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

setupDatabase().then(() => {
  return app.prepare();
}).then(() => {
  const server = http.createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  const io = new SocketIOServer(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PATCH'],
    },
  });

  // Stockage global de l'instance pour le singleton lib/socket.ts
  global.__io = io;

  io.on('connection', (socket) => {
    console.log(`[Socket.IO] Client connecté : ${socket.id}`);

    socket.on('disconnect', () => {
      console.log(`[Socket.IO] Client déconnecté : ${socket.id}`);
    });
  });

  server.listen(port, () => {
    console.log(`> Serveur de supervision prêt sur http://${hostname}:${port}`);
    console.log(`> Environnement : ${dev ? 'Développement' : 'Production'}`);

    // Démarrage de la sonde périodique de surveillance (cycle 5 minutes)
    const POLLER_INTERVAL_MS = parseInt(process.env.POLLER_INTERVAL_MS || '300000', 10);

    const initPoller = async () => {
      try {
        const { startPoller } = await import('./src/lib/poller.ts');
        startPoller(POLLER_INTERVAL_MS);
        console.log(`> Sonde de surveillance démarrée (Cycle : ${POLLER_INTERVAL_MS / 1000}s)`);
      } catch {
        // Fallback via déclenchement HTTP interne sur l'API Next.js
        console.log(`> Sonde de surveillance initialisée via endpoint interne (Cycle : ${POLLER_INTERVAL_MS / 1000}s)`);
        const pollerTimer = setInterval(async () => {
          try {
            await fetch(`http://${hostname}:${port}/api/poller`, { method: 'POST' });
          } catch {
            // Ignorer si le serveur est en cours de redémarrage
          }
        }, POLLER_INTERVAL_MS);
        if (pollerTimer.unref) pollerTimer.unref();
      }
    };

    initPoller();
  });
});
