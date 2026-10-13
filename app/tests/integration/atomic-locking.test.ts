import { MongoMemoryServer } from 'mongodb-memory-server';
import { connectDB, disconnectDB } from '@/lib/db';
import { Alert } from '@/models/Alert';
import { PATCH } from '../../src/app/api/alerts/[id]/route';
import { setIO } from '@/lib/socket';
import type { Server as SocketIOServer } from 'socket.io';

describe('Tests d’Intégration — Concurrence Atomique Sub-milliseconde (Ticket #4)', () => {
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

  it('doit garantir qu’une seule requête concurrente remporte la prise de ticket (Race Condition)', async () => {
    // 1. Création de l'alerte initiale OPEN
    const alert = await Alert.create({
      serverName: 'Cluster Kubernetes Prod',
      title: 'Crash Pod Ingress',
      message: 'Erreur 502 Bad Gateway répétée',
      severity: 'CRITICAL',
      status: 'OPEN',
    });

    const alertId = alert._id.toString();

    // 2. 10 techniciens cliquent simultanément sur "Prendre en charge"
    const operators = [
      'Théo',
      'Sarah',
      'Alexandre',
      'Camille',
      'Nicolas',
      'Julie',
      'Romain',
      'Emma',
      'Maxime',
      'Lucas',
    ];

    const promises = operators.map((operator) => {
      const request = new Request(`http://localhost:3000/api/alerts/${alertId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'ACK', operator }),
      });
      return PATCH(request, { params: { id: alertId } });
    });

    const responses = await Promise.all(promises);

    // 3. Exactement 1 requête retourne 200 OK
    const successResponses = responses.filter((r) => r.status === 200);
    expect(successResponses).toHaveLength(1);

    // 4. Les 9 autres requêtes reçoivent 409 Conflict
    const conflictResponses = responses.filter((r) => r.status === 409);
    expect(conflictResponses).toHaveLength(9);

    // 5. Vérification du corps de la réponse victorieuse
    const successBody = await successResponses[0].json();
    expect(successBody.success).toBe(true);
    expect(successBody.alert.status).toBe('ACK');
    expect(operators).toContain(successBody.alert.assignedTo);

    // 6. Vérification en base de données : un seul et unique gagnant enregistré
    const finalAlert = await Alert.findById(alertId);
    expect(finalAlert?.status).toBe('ACK');
    expect(finalAlert?.assignedTo).toBe(successBody.alert.assignedTo);
    expect(finalAlert?.acknowledgedAt).toBeInstanceOf(Date);

    // 7. Un seul événement Socket.IO alert:updated émis pour la prise
    const updatedEvents = emittedEvents.filter((e) => e.event === 'alert:updated');
    expect(updatedEvents).toHaveLength(1);
  });

  it('doit autoriser le transfert par le titulaire et interdire le vol par un tiers', async () => {
    // Alerte prise en charge par Théo
    const alert = await Alert.create({
      serverName: 'Base PostgreSQL',
      title: 'High CPU Usage',
      message: 'CPU > 98% depuis 5 minutes',
      severity: 'WARNING',
      status: 'ACK',
      assignedTo: 'Théo',
      acknowledgedAt: new Date(),
    });

    const alertId = alert._id.toString();

    // 1. Sarah tente de transférer un ticket qui appartient à Théo -> Rejeté 403 Forbidden
    const stealAttempt = new Request(`http://localhost:3000/api/alerts/${alertId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'TRANSFER',
        currentOperator: 'Sarah',
        targetOperator: 'Alexandre',
      }),
    });

    const stealRes = await PATCH(stealAttempt, { params: { id: alertId } });
    expect(stealRes.status).toBe(403);
    const stealBody = await stealRes.json();
    expect(stealBody.error).toContain('Seul le titulaire actuel (Théo) est autorisé');

    // 2. Théo transfère légitimement son ticket à Sarah -> 200 OK
    const legitimateTransfer = new Request(`http://localhost:3000/api/alerts/${alertId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'TRANSFER',
        currentOperator: 'Théo',
        targetOperator: 'Sarah',
      }),
    });

    const transferRes = await PATCH(legitimateTransfer, { params: { id: alertId } });
    expect(transferRes.status).toBe(200);

    const transferBody = await transferRes.json();
    expect(transferBody.alert.assignedTo).toBe('Sarah');
    expect(transferBody.alert.transferredFrom).toContain('Théo');

    // 3. Vérification en BDD
    const inDb = await Alert.findById(alertId);
    expect(inDb?.assignedTo).toBe('Sarah');
    expect(inDb?.transferredFrom).toEqual(['Théo']);
  });

  it('doit clore une alerte avec date de résolution et commentaire optionnel', async () => {
    const alert = await Alert.create({
      serverName: 'Serveur Web Nginx',
      title: 'Erreur 500 récurrente',
      message: 'Worker timeout',
      severity: 'CRITICAL',
      status: 'ACK',
      assignedTo: 'Sarah',
      acknowledgedAt: new Date(),
    });

    const alertId = alert._id.toString();

    const resolveRequest = new Request(`http://localhost:3000/api/alerts/${alertId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'RESOLVE',
        resolutionComment: 'Processus PHP-FPM relancé avec succès.',
      }),
    });

    const res = await PATCH(resolveRequest, { params: { id: alertId } });
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.alert.status).toBe('RESOLVED');
    expect(body.alert.resolutionComment).toBe('Processus PHP-FPM relancé avec succès.');
    expect(body.alert.resolvedAt).toBeDefined();

    // Tentative de re-résolution -> 409 Conflict
    const secondRequest = new Request(`http://localhost:3000/api/alerts/${alertId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'RESOLVE',
      }),
    });
    const secondResolve = await PATCH(secondRequest, { params: { id: alertId } });
    expect(secondResolve.status).toBe(409);
  });
});
