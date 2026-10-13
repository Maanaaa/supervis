import { MongoMemoryServer } from 'mongodb-memory-server';
import { connectDB, disconnectDB } from '@/lib/db';
import { Server } from '@/models/Server';
import { Alert } from '@/models/Alert';
import DashboardPage from '../../src/app/page';
import HistoryPage from '../../src/app/history/page';
import ServersPage from '../../src/app/servers/page';
import ServerDetailPage from '../../src/app/servers/[id]/page';

describe('Functional Tests — Server Components SSR (Ticket #5)', () => {
  let mongoServer: MongoMemoryServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    process.env.MONGODB_URI = mongoServer.getUri();
    await connectDB();
  }, 30000);

  afterAll(async () => {
    await disconnectDB();
    await mongoServer.stop();
  }, 30000);

  beforeEach(async () => {
    await Server.deleteMany({});
    await Alert.deleteMany({});
  });

  it('DashboardPage doit rendre sans crash avec des données', async () => {
    await Server.create({
      name: 'Serveur Test SSR',
      host: '127.0.0.1',
      status: 'UP',
      latencyMs: 12,
    });

    await Alert.create({
      serverName: 'Serveur Test SSR',
      title: 'Alerte Active',
      message: 'Charge CPU élevée',
      severity: 'CRITICAL',
      status: 'OPEN',
    });

    const jsx = await DashboardPage();
    expect(jsx).toBeDefined();
    expect(jsx.type).toBe('div');
  });

  it('HistoryPage doit rendre les alertes résolues', async () => {
    await Alert.create({
      serverName: 'Serveur Test SSR',
      title: 'Alerte Résolue',
      message: 'Panne corrigée',
      severity: 'WARNING',
      status: 'RESOLVED',
      resolvedAt: new Date(),
    });

    const jsx = await HistoryPage();
    expect(jsx).toBeDefined();
    expect(jsx.type).toBe('div');
  });

  it('ServersPage doit rendre la liste des machines', async () => {
    await Server.create({
      name: 'VPS Web 01',
      host: '10.0.0.1',
      status: 'UP',
    });

    const jsx = await ServersPage();
    expect(jsx).toBeDefined();
    expect(jsx.type).toBe('div');
  });

  it('ServerDetailPage doit rendre la fiche serveur et ses alertes liées', async () => {
    const server = await Server.create({
      name: 'Serveur Spécifique',
      host: '192.168.1.50',
      status: 'UP',
    });

    await Alert.create({
      serverId: server._id,
      serverName: server.name,
      title: 'Alerte associée',
      message: 'Détail',
      severity: 'CRITICAL',
      status: 'OPEN',
    });

    const jsx = await ServerDetailPage({ params: { id: server._id.toString() } });
    expect(jsx).toBeDefined();
    expect(jsx.type).toBe('div');
  });
});
