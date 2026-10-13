import { getIO, setIO } from '../../src/lib/socket';
import { Server as SocketIOServer } from 'socket.io';
import http from 'http';

describe('Unit Test — Singleton Socket.IO (lib/socket.ts)', () => {
  beforeEach(() => {
    // Réinitialise l'instance globale avant chaque test
    global.__io = undefined;
  });

  test("getIO() doit lever une erreur explicite si Socket.IO n'est pas initialisé", () => {
    expect(() => getIO()).toThrow(
      "Socket.IO n'est pas encore initialisé. Vérifiez que server.js a bien démarré."
    );
  });

  test("setIO() doit enregistrer l'instance et getIO() doit la restituer", () => {
    const dummyServer = http.createServer();
    const dummyIO = new SocketIOServer(dummyServer);

    setIO(dummyIO);

    expect(getIO()).toBe(dummyIO);
    dummyServer.close();
  });
});
