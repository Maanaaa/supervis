import { GET } from '../../src/app/api/health/route';

describe('Functional Test — Route API Health (/api/health)', () => {
  test('GET /api/health doit retourner un statut 200 avec status: ok et uptime', async () => {
    const response = await GET();
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body).toHaveProperty('status', 'ok');
    expect(body).toHaveProperty('service', 'supervis-backend');
    expect(body).toHaveProperty('timestamp');
    expect(body).toHaveProperty('uptime');
    expect(typeof body.uptime).toBe('number');
  });
});
