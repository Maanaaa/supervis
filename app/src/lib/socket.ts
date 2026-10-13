import { Server as SocketIOServer } from 'socket.io';

// Déclaration globale pour persister l'instance io à travers le serveur
declare global {
  // eslint-disable-next-line no-var
  var __io: SocketIOServer | undefined;
}

export function setIO(io: SocketIOServer): void {
  global.__io = io;
}

export function getIO(): SocketIOServer {
  if (!global.__io) {
    throw new Error(
      "Socket.IO n'est pas encore initialisé. Vérifiez que server.js a bien démarré."
    );
  }
  return global.__io;
}

export function emitSocket(event: string, payload: unknown): void {
  try {
    if (global.__io) {
      global.__io.emit(event, payload);
    }
  } catch {
    // Silencieux si Socket.IO n'est pas instancié (ex: contexte de test unitaire)
  }
}
