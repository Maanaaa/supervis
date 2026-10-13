import http from 'http';
import { AddressInfo } from 'net';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { connectDB, disconnectDB } from '@/lib/db';
import { Server } from '@/models/Server';
import { Alert } from '@/models/Alert';
import { setIO } from '@/lib/socket';
import { runPollerCycle, stopPoller } from '@/lib/poller';
import type { Server as SocketIOServer } from 'socket.io';

describe('Tests d’Intégration — Sonde Périodique et Alerting Temps Réel (Ticket #3)', () => {
  let mongoServer: MongoMemoryServer;
  let testHttpServer: http.Server;
  let testHttpPort: number;

  const emittedEvents: Array<{ event: string; data: unknown }> = [];

  // Faux serveur Socket.IO pour capturer les émissions
  const mockIO = {
    emit: jest.fn((event: string, data: unknown) => {
      emittedEvents.push({ event, data });
    }),
  } as unknown as SocketIOServer;

  beforeAll(async () => {
    // 1. Initialisation MongoDB en mémoire
    mongoServer = await MongoMemoryServer.create();
    process.env.MONGODB_URI = mongoServer.getUri();
    await connectDB();

    // 2. Configuration du singleton Socket.IO mocké
    setIO(mockIO);

    // 3. Mini-serveur HTTP pour simuler des serveurs surveillés
    testHttpServer = http.createServer((req, res) => {
      if (req.url === '/health-ok') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok' }));
      } else if (req.url === '/health-fail') {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Crash critique de la base de données' }));
      } else {
        res.writeHead(404);
        res.end();
      }
    });

    await new Promise<void>((resolve) => {
      testHttpServer.listen(0, '127.0.0.1', () => {
        const address = testHttpServer.address() as AddressInfo;
        testHttpPort = address.port;
        resolve();
      });
    });
  }, 30000);

  afterAll(async () => {
    stopPoller();
    await new Promise<void>((resolve) => testHttpServer.close(() => resolve()));
    await disconnectDB();
    await mongoServer.stop();
  }, 30000);

  beforeEach(async () => {
    await Server.deleteMany({});
    await Alert.deleteMany({});
    emittedEvents.length = 0;
    jest.clearAllMocks();
  });

  it('doit tester séquentiellement les serveurs, mettre à jour les statuts et émettre les alertes', async () => {
    // 1. Enregistrement d'un serveur fonctionnel et d'un serveur défaillant
    const serverUp = await Server.create({
      name: 'Frontend Web Nginx',
      host: '127.0.0.1',
      port: testHttpPort,
      healthUrl: '/health-ok',
      status: 'UNKNOWN',
    });

    const serverDown = await Server.create({
      name: 'API Backend Node',
      host: '127.0.0.1',
      port: testHttpPort,
      healthUrl: '/health-fail',
      status: 'UNKNOWN',
    });

    // 2. Exécution du cycle de sonde
    const results = await runPollerCycle(2000);

    expect(results).toHaveLength(2);

    // 3. Vérification du serveur UP
    const updatedUp = await Server.findById(serverUp._id);
    expect(updatedUp?.status).toBe('UP');
    expect(updatedUp?.latencyMs).toBeGreaterThanOrEqual(1);
    expect(updatedUp?.lastCheckAt).toBeInstanceOf(Date);

    // 4. Vérification du serveur DOWN
    const updatedDown = await Server.findById(serverDown._id);
    expect(updatedDown?.status).toBe('DOWN');
    expect(updatedDown?.lastCheckAt).toBeInstanceOf(Date);

    // 5. Vérification de la création immédiate d'une alerte CRITICAL en base
    const alert = await Alert.findOne({ serverId: serverDown._id });
    expect(alert).not.toBeNull();
    expect(alert?.severity).toBe('CRITICAL');
    expect(alert?.status).toBe('OPEN');
    expect(alert?.serverName).toBe('API Backend Node');
    expect(alert?.title).toBe('Serveur API Backend Node injoignable');
    expect(alert?.message).toContain('Statut HTTP 500');

    // 6. Vérification des événements Socket.IO émis
    const alertNewEvents = emittedEvents.filter((e) => e.event === 'alert:new');
    expect(alertNewEvents.length).toBeGreaterThanOrEqual(1);

    const statusChangeEvents = emittedEvents.filter((e) => e.event === 'server:status_change');
    expect(statusChangeEvents.length).toBeGreaterThanOrEqual(2);
  });

  it('doit lever une alerte critique en cas de port fermé / connexion refusée', async () => {
    // Port arbitraire inutilisé pour provoquer ECONNREFUSED
    const serverUnreachable = await Server.create({
      name: 'Serveur Déconnecté',
      host: '127.0.0.1',
      port: 59999,
      healthUrl: '/health',
      status: 'UNKNOWN',
    });

    const results = await runPollerCycle(1500);

    expect(results).toHaveLength(1);
    expect(results[0].isUp).toBe(false);

    const alert = await Alert.findOne({ serverId: serverUnreachable._id });
    expect(alert).not.toBeNull();
    expect(alert?.severity).toBe('CRITICAL');
    expect(alert?.status).toBe('OPEN');
    expect(alert?.message).toMatch(/ECONNREFUSED|Erreur réseau/i);
  });

  it('doit continuer le cycle sans planter si la liste des serveurs est vide', async () => {
    const results = await runPollerCycle(1000);
    expect(results).toEqual([]);
    expect(emittedEvents).toHaveLength(0);
  });
});
