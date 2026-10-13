import { MongoMemoryServer } from 'mongodb-memory-server';
import { connectDB, disconnectDB } from '@/lib/db';
import { User } from '@/models/User';
import { seedDefaultOperators } from '@/lib/seed';
import { POST as postLogin } from '../../src/app/api/auth/login/route';
import { POST as postLogout } from '../../src/app/api/auth/logout/route';
import { POST as postUser } from '../../src/app/api/users/route';
import { SESSION_COOKIE_NAME, verifyPassword } from '@/lib/auth';

describe('Integration Tests — Auth Endpoints & Seeding (Ticket #10, ADR-0008)', () => {
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
    await User.deleteMany({});
  });

  describe('Amorçage Idempotent (seedDefaultOperators)', () => {
    it('doit créer les 2 opérateurs par défaut avec le mot de passe admin haché', async () => {
      await seedDefaultOperators();

      const theo = await User.findOne({ email: 'theo@supervis.local' }).select('+password');
      expect(theo).not.toBeNull();
      expect(theo?.name).toBe('Théo');
      expect(theo?.role).toBe('ADMIN');
      expect(theo?.isOnDuty).toBe(true);
      expect(theo?.password).toBeDefined();
      expect(verifyPassword('admin', theo!.password!)).toBe(true);

      const sarah = await User.findOne({ email: 'sarah@supervis.local' }).select('+password');
      expect(sarah).not.toBeNull();
      expect(sarah?.name).toBe('Sarah');
      expect(sarah?.role).toBe('ASTREINTE');
      expect(sarah?.isOnDuty).toBe(true);
      expect(sarah?.password).toBeDefined();
      expect(verifyPassword('admin', sarah!.password!)).toBe(true);
    });

    it('doit être idempotent sans créer de doublons lors d’exécutions successives', async () => {
      await seedDefaultOperators();
      await seedDefaultOperators();

      const count = await User.countDocuments();
      expect(count).toBe(2);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await seedDefaultOperators();
    });

    it('doit connecter Théo avec son prénom et mot de passe admin', async () => {
      const req = new Request('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: 'Théo', password: 'admin' }),
      });

      const res = await postLogin(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.user.name).toBe('Théo');
      expect(json.user.role).toBe('ADMIN');

      // Vérification du cookie posé
      const cookieHeader = res.headers.get('set-cookie');
      expect(cookieHeader).toBeDefined();
      expect(cookieHeader).toContain(SESSION_COOKIE_NAME);
      expect(cookieHeader).toContain('HttpOnly');
    });

    it('doit connecter Sarah avec son email et mot de passe admin', async () => {
      const req = new Request('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: 'sarah@supervis.local', password: 'admin' }),
      });

      const res = await postLogin(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.user.name).toBe('Sarah');
      expect(json.user.role).toBe('ASTREINTE');
    });

    it('doit rejeter un mot de passe erroné avec un code 401', async () => {
      const req = new Request('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: 'Théo', password: 'faux_mot_de_passe' }),
      });

      const res = await postLogin(req);
      const json = await res.json();

      expect(res.status).toBe(401);
      expect(json.success).toBe(false);
      expect(json.error).toContain('incorrect');
    });

    it('doit rejeter un utilisateur inexistant avec un code 401', async () => {
      const req = new Request('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: 'inconnu@supervis.local', password: 'admin' }),
      });

      const res = await postLogin(req);
      const json = await res.json();

      expect(res.status).toBe(401);
      expect(json.success).toBe(false);
    });

    it('doit renvoyer 400 si identifiant ou mot de passe est absent', async () => {
      const reqMissingPass = new Request('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: 'Théo' }),
      });
      const res1 = await postLogin(reqMissingPass);
      expect(res1.status).toBe(400);

      const reqMissingId = new Request('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: 'admin' }),
      });
      const res2 = await postLogin(reqMissingId);
      expect(res2.status).toBe(400);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('doit réinitialiser le cookie de session avec maxAge=0', async () => {
      const res = await postLogout();
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);

      const cookieHeader = res.headers.get('set-cookie');
      expect(cookieHeader).toBeDefined();
      expect(cookieHeader).toContain(SESSION_COOKIE_NAME);
      expect(cookieHeader).toContain('Max-Age=0');
    });
  });

  describe('Interdiction d’inscription libre (POST /api/users)', () => {
    it('doit formellement refuser toute tentative de création libre de compte (403 Forbidden)', async () => {
      const res = await postUser();
      const json = await res.json();

      expect(res.status).toBe(403);
      expect(json.success).toBe(false);
      expect(json.error).toContain('désactivée');
    });
  });
});
