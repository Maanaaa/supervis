const http = require('http');
const next = require('next');
const { Server: SocketIOServer } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

// Fallback local pour développement si non défini
if (!process.env.MONGODB_URI && dev) {
  process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/supervis';
}

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = http.createServer((req, res) => {
    handle(req, res);
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
