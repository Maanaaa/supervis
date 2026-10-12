import { MongoMemoryServer } from 'mongodb-memory-server';
import { connectDB, disconnectDB } from '@/lib/db';
import { GET, POST } from '../../src/app/api/poller/route';
import { stopPoller } from '@/lib/poller';

describe('Functional Test — Route API Poller (/api/poller)', () => {
  let mongoServer: MongoMemoryServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    process.env.MONGODB_URI = mongoServer.getUri();
    await connectDB();
  }, 30000);

  afterAll(async () => {
    stopPoller();
    await disconnectDB();
    await mongoServer.stop();
  }, 30000);

  it('GET /api/poller doit renvoyer status: ok et l’état du poller', async () => {
    const res = await GET();
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.status).toBe('ok');
    expect(typeof body.pollerActive).toBe('boolean');
  });

  it('POST /api/poller doit déclencher un cycle et renvoyer le résultat', async () => {
    const req = new Request('http://localhost:3000/api/poller', {
      method: 'POST',
      body: JSON.stringify({ timeoutMs: 1000 }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.count).toBe(0);
    expect(Array.isArray(body.results)).toBe(true);
  });
});
