import { MongoMemoryServer } from 'mongodb-memory-server';
import { connectDB, disconnectDB } from '@/lib/db';
import { Server } from '@/models/Server';
import { Alert } from '@/models/Alert';
import { User } from '@/models/User';
import { GET as getServers, POST as postServer } from '../../src/app/api/servers/route';
import { GET as getServerById, DELETE as deleteServer } from '../../src/app/api/servers/[id]/route';
import { GET as getUsers, POST as postUser } from '../../src/app/api/users/route';

describe('Functional Tests — API Routes Serveurs & Utilisateurs (/api/servers, /api/users)', () => {
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
    await User.deleteMany({});
  });

  describe('POST & GET /api/servers', () => {
    it('doit créer un serveur avec succès et le retrouver dans la liste', async () => {
      const createReq = new Request('http://localhost:3000/api/servers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Nginx Prod 01',
          host: '10.0.0.12',
          port: 8080,
          healthUrl: '/health',
          description: 'Frontend web cluster',
        }),
      });

      const createRes = await postServer(createReq);
      expect(createRes.status).toBe(201);
      const createBody = await createRes.json();
      expect(createBody.server.name).toBe('Nginx Prod 01');
      expect(createBody.server.status).toBe('UNKNOWN');

      // Récupération liste
      const listRes = await getServers();
      expect(listRes.status).toBe(200);
      const listBody = await listRes.json();
      expect(listBody.count).toBe(1);
      expect(listBody.servers[0].host).toBe('10.0.0.12');
    });

    it('doit rejeter la création si le nom ou l’hôte est manquant', async () => {
      const req = new Request('http://localhost:3000/api/servers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ host: '10.0.0.1' }),
      });

      const res = await postServer(req);
      expect(res.status).toBe(400);
    });
  });

  describe('GET & DELETE /api/servers/[id]', () => {
    it('doit renvoyer la fiche serveur avec l’historique complet des alertes associées', async () => {
      const server = await Server.create({
        name: 'Database Master',
        host: '10.0.0.50',
        port: 5432,
        status: 'UP',
      });

      // Création d'alertes liées à ce serveur
      await Alert.create([
        {
          serverId: server._id,
          serverName: server.name,
          title: 'Alerte passée 1',
          message: 'Détail 1',
          severity: 'WARNING',
          status: 'RESOLVED',
        },
        {
          serverId: server._id,
          serverName: server.name,
          title: 'Alerte en cours',
          message: 'Détail 2',
          severity: 'CRITICAL',
          status: 'OPEN',
        },
      ]);

      const req = new Request(`http://localhost:3000/api/servers/${server._id}`);
      const res = await getServerById(req, { params: { id: server._id.toString() } });
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.server.name).toBe('Database Master');
      expect(body.alerts).toHaveLength(2);
    });

    it('doit supprimer un serveur existant', async () => {
      const server = await Server.create({
        name: 'Serveur à supprimer',
        host: '1.2.3.4',
      });

      const req = new Request(`http://localhost:3000/api/servers/${server._id}`, {
        method: 'DELETE',
      });
      const res = await deleteServer(req, { params: { id: server._id.toString() } });
      expect(res.status).toBe(200);

      const check = await Server.findById(server._id);
      expect(check).toBeNull();
    });
  });

  describe('GET & POST /api/users (Annuaire Techniciens & Protection ADR-0008)', () => {
    it('doit refuser la création libre (403) et permettre la consultation de l’annuaire', async () => {
      const createReq = new Request('http://localhost:3000/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Sarah L.',
          email: 'sarah@supervis.local',
          phone: '+33600000000',
          role: 'ASTREINTE',
          isOnDuty: true,
        }),
      });

      const createRes = await postUser();
      expect(createRes.status).toBe(403);

      await User.create({
        name: 'Sarah L.',
        email: 'sarah@supervis.local',
        phone: '+33600000000',
        role: 'ASTREINTE',
        isOnDuty: true,
      });

      const listRes = await getUsers();
      expect(listRes.status).toBe(200);
      const listBody = await listRes.json();
      expect(listBody.count).toBe(1);
      expect(listBody.users[0].name).toBe('Sarah L.');
      expect(listBody.users[0].isOnDuty).toBe(true);
    });
  });
});
