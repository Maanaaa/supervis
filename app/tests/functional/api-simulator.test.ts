import { MongoMemoryServer } from 'mongodb-memory-server';
import { connectDB, disconnectDB } from '@/lib/db';
import { Alert } from '@/models/Alert';
import { Server } from '@/models/Server';
import {
  GET as getSimulator,
  POST as postSimulator,
} from '../../src/app/api/simulator/trigger/route';
import { setIO } from '@/lib/socket';
import type { Server as SocketIOServer } from 'socket.io';

describe('Functional Tests — API Route Simulateur de Pannes (/api/simulator/trigger)', () => {
  let mongoServer: MongoMemoryServer;
  const emittedEvents: Array<{ event: string; data: unknown }> = [];

  const mockIO = {
    emit: jest.fn((event: string, data: unknown) => {
      emittedEvents.push({ event, data });
    }),
  } as unknown as SocketIOServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    process.env.MONGODB_URI = mongoServer.getUri();
    await connectDB();
    setIO(mockIO);
  }, 30000);

  afterAll(async () => {
    await disconnectDB();
    await mongoServer.stop();
  }, 30000);

  beforeEach(async () => {
    await Alert.deleteMany({});
    await Server.deleteMany({});
    emittedEvents.length = 0;
    jest.clearAllMocks();
  });

  describe('GET /api/simulator/trigger', () => {
    it('doit renvoyer la documentation et la liste des actions disponibles', async () => {
      const response = await getSimulator();
      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.availableActions).toContain('cpu');
      expect(body.availableActions).toContain('server_down');
      expect(body.availableActions).toContain('reset');
    });
  });

  describe('POST /api/simulator/trigger — Simulation CPU', () => {
    it('doit déclencher une panne CPU 98% et émettre alert:new', async () => {
      const request = new Request('http://localhost:3000/api/simulator/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'cpu' }),
      });

      const response = await postSimulator(request);
      expect(response.status).toBe(201);

      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.action).toBe('cpu');
      expect(body.alert.title).toBe('Charge CPU 98%');
      expect(body.alert.severity).toBe('CRITICAL');
      expect(body.alert.status).toBe('OPEN');

      const dbAlert = await Alert.findById(body.alert._id);
      expect(dbAlert).not.toBeNull();
      expect(emittedEvents.some((e) => e.event === 'alert:new')).toBe(true);
    });
  });

  describe('POST /api/simulator/trigger — Simulation Disque et Nginx', () => {
    it('doit injecter une alerte de saturation disque', async () => {
      const request = new Request('http://localhost:3000/api/simulator/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'disk' }),
      });

      const response = await postSimulator(request);
      expect(response.status).toBe(201);

      const body = await response.json();
      expect(body.alert.title).toContain('Disque saturé');
      expect(emittedEvents.some((e) => e.event === 'alert:new')).toBe(true);
    });

    it('doit injecter une panne Nginx 502', async () => {
      const request = new Request('http://localhost:3000/api/simulator/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'nginx' }),
      });

      const response = await postSimulator(request);
      expect(response.status).toBe(201);

      const body = await response.json();
      expect(body.alert.title).toContain('Nginx unresponsive');
      expect(body.alert.severity).toBe('CRITICAL');
      expect(emittedEvents.some((e) => e.event === 'alert:new')).toBe(true);
    });
  });

  describe('POST /api/simulator/trigger — Simulation Serveur DOWN & UP', () => {
    it('doit basculer un serveur en DOWN, émettre server:status_change et créer une alerte critique', async () => {
      const server = await Server.create({
        name: 'srv-app-worker',
        host: 'worker.internal',
        port: 3001,
        healthUrl: '/health',
        status: 'UP',
      });

      const request = new Request('http://localhost:3000/api/simulator/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'server_down', serverId: server._id.toString() }),
      });

      const response = await postSimulator(request);
      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.action).toBe('server_down');
      expect(body.server.status).toBe('DOWN');
      expect(body.alert.title).toContain('srv-app-worker injoignable');
      expect(body.alert.severity).toBe('CRITICAL');

      expect(emittedEvents.some((e) => e.event === 'server:status_change')).toBe(true);
      expect(emittedEvents.some((e) => e.event === 'alert:new')).toBe(true);
    });

    it('doit basculer un serveur de DOWN vers UP', async () => {
      const server = await Server.create({
        name: 'srv-app-down',
        host: 'down.internal',
        port: 3002,
        status: 'DOWN',
      });

      const request = new Request('http://localhost:3000/api/simulator/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'server_up', serverId: server._id.toString() }),
      });

      const response = await postSimulator(request);
      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body.server.status).toBe('UP');
      expect(emittedEvents.some((e) => e.event === 'server:status_change')).toBe(true);
    });
  });

  describe('POST /api/simulator/trigger — Réinitialisation (Reset)', () => {
    it('doit restaurer les serveurs DOWN en UP et clore les alertes actives', async () => {
      await Server.create({
        name: 'srv-crashed',
        host: 'crash.internal',
        port: 80,
        status: 'DOWN',
      });

      await Alert.create({
        serverName: 'srv-crashed',
        title: 'Crash',
        message: 'Panne sévère',
        status: 'OPEN',
        severity: 'CRITICAL',
      });

      const request = new Request('http://localhost:3000/api/simulator/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'reset' }),
      });

      const response = await postSimulator(request);
      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.serversRestoredCount).toBe(1);
      expect(body.alertsResolvedCount).toBe(1);

      const updatedServer = await Server.findOne({ name: 'srv-crashed' });
      expect(updatedServer?.status).toBe('UP');

      const updatedAlert = await Alert.findOne({ title: 'Crash' });
      expect(updatedAlert?.status).toBe('RESOLVED');

      expect(emittedEvents.some((e) => e.event === 'server:status_change')).toBe(true);
      expect(emittedEvents.some((e) => e.event === 'alert:updated')).toBe(true);
    });
  });

  describe('POST /api/simulator/trigger — Simulation Personnalisée (Custom) & Validation', () => {
    it('doit créer une alerte personnalisée avec succès', async () => {
      const request = new Request('http://localhost:3000/api/simulator/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'custom',
          serverName: 'custom-srv',
          title: 'Custom Incident',
          message: 'Détail incident',
          severity: 'INFO',
        }),
      });

      const response = await postSimulator(request);
      expect(response.status).toBe(201);

      const body = await response.json();
      expect(body.alert.title).toBe('Custom Incident');
      expect(body.alert.severity).toBe('INFO');
    });

    it('doit renvoyer une erreur 400 pour un type d’action inconnu', async () => {
      const request = new Request('http://localhost:3000/api/simulator/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'unsupported_type' }),
      });

      const response = await postSimulator(request);
      expect(response.status).toBe(400);

      const body = await response.json();
      expect(body.error).toContain('Type de simulation inconnu');
    });
  });
});
