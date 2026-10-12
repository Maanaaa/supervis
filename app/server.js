const http = require('http');
const next = require('next');
const { Server: SocketIOServer } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

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
  });
});
