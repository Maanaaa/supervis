import http from 'http';
import { AddressInfo } from 'net';
import { Server as SocketIOServer } from 'socket.io';
import { io as ClientIO, Socket as ClientSocket } from 'socket.io-client';

describe('E2E Test — Connexion & Événements Socket.IO', () => {
  let server: http.Server;
  let io: SocketIOServer;
  let clientSocket: ClientSocket;
  let port: number;

  beforeAll((done) => {
    // Crée un serveur HTTP et Socket.IO sur un port éphémère (0)
    server = http.createServer();
    io = new SocketIOServer(server);

    server.listen(0, () => {
      port = (server.address() as AddressInfo).port;
      done();
    });
  });

  afterAll((done) => {
    if (clientSocket && clientSocket.connected) {
      clientSocket.disconnect();
    }
    io.close(() => {
      server.close(() => {
        done();
      });
    });
  });

  test('Un client Socket.IO doit se connecter et recevoir une alerte temps réel', (done) => {
    clientSocket = ClientIO(`http://localhost:${port}`, {
      transports: ['websocket'],
    });

    const mockAlert = {
      _id: 'alert-123',
      serverName: 'srv-web-paris-01',
      title: 'Disque plein',
      severity: 'CRITICAL',
      status: 'OPEN',
    };

    clientSocket.on('connect', () => {
      expect(clientSocket.connected).toBe(true);

      // Le serveur émet une alerte dès que le client est connecté
      io.emit('alert:new', mockAlert);
    });

    clientSocket.on('alert:new', (receivedData) => {
      expect(receivedData).toEqual(mockAlert);
      expect(receivedData.severity).toBe('CRITICAL');
      done();
    });
  });
});
