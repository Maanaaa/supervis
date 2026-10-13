import { MongoMemoryServer } from 'mongodb-memory-server';
import { connectDB, disconnectDB } from '@/lib/db';
import { Alert } from '@/models/Alert';
import { GET as getAlerts, POST as postAlert } from '../../src/app/api/alerts/route';
import { GET as getAlertById } from '../../src/app/api/alerts/[id]/route';
import { setIO } from '@/lib/socket';
import type { Server as SocketIOServer } from 'socket.io';

describe('Functional Tests — API Routes Alertes (/api/alerts)', () => {
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
    emittedEvents.length = 0;
    jest.clearAllMocks();
  });

  describe('POST /api/alerts (Ingestion Push Webhook)', () => {
    it('doit ingérer une alerte valide, la créer en statut OPEN et émettre alert:new', async () => {
      const payload = {
        serverName: 'VPS Storage 01',
        title: 'Disque /data saturé à 96%',
        message: 'Espace restant : 1.2 Go sur 50 Go',
        severity: 'CRITICAL',
      };

      const request = new Request('http://localhost:3000/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const response = await postAlert(request);
      expect(response.status).toBe(201);

      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.alert.serverName).toBe('VPS Storage 01');
      expect(body.alert.status).toBe('OPEN');
      expect(body.alert.severity).toBe('CRITICAL');

      const inDb = await Alert.findById(body.alert._id);
      expect(inDb).not.toBeNull();
      expect(inDb?.title).toBe('Disque /data saturé à 96%');

      expect(emittedEvents.some((e) => e.event === 'alert:new')).toBe(true);
    });

    it('doit rejeter un payload sans titre ou sans nom de serveur (400 Bad Request)', async () => {
      const badRequest = new Request('http://localhost:3000/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serverName: 'Test' }),
      });

      const response = await postAlert(badRequest);
      expect(response.status).toBe(400);

      const body = await response.json();
      expect(body.error).toContain('champ title est obligatoire');
    });

    it('doit rejeter une sévérité invalide (400 Bad Request)', async () => {
      const badSeverityRequest = new Request('http://localhost:3000/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serverName: 'Serveur A',
          title: 'Alerte',
          message: 'Message',
          severity: 'FATAL_UNKNOWN',
        }),
      });

      const response = await postAlert(badSeverityRequest);
      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toContain('Sévérité invalide');
    });
  });

  describe('GET /api/alerts (Filtrage & Consultation)', () => {
    beforeEach(async () => {
      await Alert.create([
        {
          serverName: 'Serveur 1',
          title: 'Alerte Active 1',
          message: 'Msg',
          status: 'OPEN',
          severity: 'WARNING',
        },
        {
          serverName: 'Serveur 2',
          title: 'Alerte Active 2',
          message: 'Msg',
          status: 'ACK',
          severity: 'CRITICAL',
          assignedTo: 'Théo',
        },
        {
          serverName: 'Serveur 3',
          title: 'Alerte Clôturée',
          message: 'Msg',
          status: 'RESOLVED',
          severity: 'INFO',
          resolvedAt: new Date(),
        },
      ]);
    });

    it('doit renvoyer uniquement les alertes actives (OPEN et ACK) par défaut', async () => {
      const req = new Request('http://localhost:3000/api/alerts');
      const res = await getAlerts(req);
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.count).toBe(2);
      expect(body.alerts.every((a: { status: string }) => ['OPEN', 'ACK'].includes(a.status))).toBe(
        true
      );
    });

    it('doit renvoyer uniquement les alertes résolues si status=RESOLVED', async () => {
      const req = new Request('http://localhost:3000/api/alerts?status=RESOLVED');
      const res = await getAlerts(req);
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.count).toBe(1);
      expect(body.alerts[0].status).toBe('RESOLVED');
    });

    it('doit renvoyer toutes les alertes si status=all', async () => {
      const req = new Request('http://localhost:3000/api/alerts?status=all');
      const res = await getAlerts(req);
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.count).toBe(3);
    });
  });

  describe('GET /api/alerts/[id]', () => {
    it('doit renvoyer le détail d’une alerte existante', async () => {
      const alert = await Alert.create({
        serverName: 'Web 01',
        title: 'CPU 99%',
        message: 'Surcharge',
        status: 'OPEN',
        severity: 'CRITICAL',
      });

      const req = new Request(`http://localhost:3000/api/alerts/${alert._id}`);
      const res = await getAlertById(req, { params: { id: alert._id.toString() } });
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.alert.title).toBe('CPU 99%');
    });

    it('doit retourner 404 si l’alerte n’existe pas', async () => {
      const nonExistentId = '654321654321654321654321';
      const req = new Request(`http://localhost:3000/api/alerts/${nonExistentId}`);
      const res = await getAlertById(req, { params: { id: nonExistentId } });
      expect(res.status).toBe(404);
    });

    it('doit retourner 400 si l’identifiant est invalide', async () => {
      const req = new Request('http://localhost:3000/api/alerts/bad-id');
      const res = await getAlertById(req, { params: { id: 'bad-id' } });
      expect(res.status).toBe(400);
    });
  });
});
