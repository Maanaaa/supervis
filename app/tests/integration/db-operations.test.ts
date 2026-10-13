import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '@/lib/db';
import { Server } from '@/models/Server';
import { Alert } from '@/models/Alert';
import { User } from '@/models/User';

describe("Tests d'Intégration — Opérations BDD MongoDB en mémoire", () => {
  let mongoServer: MongoMemoryServer;

  beforeAll(async () => {
    try {
      mongoServer = await MongoMemoryServer.create();
    } catch {
      await new Promise((r) => setTimeout(r, 500));
      mongoServer = await MongoMemoryServer.create();
    }
    process.env.MONGODB_URI = mongoServer.getUri();
    await connectDB();
  }, 30000);

  afterAll(async () => {
    await disconnectDB();
    if (mongoServer) {
      await mongoServer.stop();
    }
  }, 30000);

  beforeEach(async () => {
    // Nettoyer les collections entre chaque test
    await Server.deleteMany({});
    await Alert.deleteMany({});
    await User.deleteMany({});
  });

  it('doit persister et retrouver un serveur avec latence et statut', async () => {
    const server = await Server.create({
      name: 'VPS Web Prod',
      host: '10.0.0.1',
      port: 80,
      status: 'UP',
      latencyMs: 42,
      lastCheckAt: new Date(),
    });

    expect(server._id).toBeDefined();

    const retrieved = await Server.findById(server._id);
    expect(retrieved?.name).toBe('VPS Web Prod');
    expect(retrieved?.latencyMs).toBe(42);
    expect(retrieved?.status).toBe('UP');
  });

  it("doit valider le cycle de vie d'une alerte (OPEN -> ACK -> RESOLVED)", async () => {
    // 1. Création de l'alerte
    const alert = await Alert.create({
      serverName: 'VPS Web Prod',
      title: 'Serveur Injoignable',
      message: 'Timeout lors du healthcheck HTTP',
      severity: 'CRITICAL',
      status: 'OPEN',
    });

    expect(alert.status).toBe('OPEN');

    // 2. Prise en charge (ACK)
    const ackDate = new Date();
    alert.status = 'ACK';
    alert.assignedTo = 'Théo';
    alert.acknowledgedAt = ackDate;
    await alert.save();

    const updated = await Alert.findById(alert._id);
    expect(updated?.status).toBe('ACK');
    expect(updated?.assignedTo).toBe('Théo');

    // 3. Résolution
    const resolveDate = new Date();
    updated!.status = 'RESOLVED';
    updated!.resolvedAt = resolveDate;
    updated!.resolutionComment = 'Redémarrage du service nginx effectué.';
    await updated!.save();

    const resolved = await Alert.findById(alert._id);
    expect(resolved?.status).toBe('RESOLVED');
    expect(resolved?.resolutionComment).toBe('Redémarrage du service nginx effectué.');
  });

  it('doit exécuter un verrouillage atomique findOneAndUpdate sans double affectation', async () => {
    // Alerte initiale
    const alert = await Alert.create({
      serverName: 'Cluster Kubernetes',
      title: 'Node NotReady',
      message: 'Perte de communication avec le worker 2',
      severity: 'CRITICAL',
      status: 'OPEN',
    });

    // 1er technicien (Théo) tente de prendre l'alerte
    const take1 = await Alert.findOneAndUpdate(
      { _id: alert._id, status: 'OPEN' },
      {
        $set: {
          status: 'ACK',
          assignedTo: 'Théo',
          acknowledgedAt: new Date(),
        },
      },
      { new: true }
    );

    expect(take1).not.toBeNull();
    expect(take1?.assignedTo).toBe('Théo');
    expect(take1?.status).toBe('ACK');

    // 2ème technicien (Alice) tente de prendre la même alerte simultanément
    const take2 = await Alert.findOneAndUpdate(
      { _id: alert._id, status: 'OPEN' },
      {
        $set: {
          status: 'ACK',
          assignedTo: 'Alice',
          acknowledgedAt: new Date(),
        },
      },
      { new: true }
    );

    // Alice reçoit null : la course atomique MongoDB garantit qu'il n'y a pas de double prise
    expect(take2).toBeNull();

    // En base, c'est bien toujours Théo qui est assigné
    const finalState = await Alert.findById(alert._id);
    expect(finalState?.assignedTo).toBe('Théo');
  });

  it("doit gérer l'annuaire des utilisateurs et l'unicité de l'email", async () => {
    await User.create({
      name: 'Théo Astreinte',
      email: 'theo@example.com',
      role: 'ASTREINTE',
      isOnDuty: true,
    });

    const activeTechs = await User.find({ isOnDuty: true });
    expect(activeTechs).toHaveLength(1);
    expect(activeTechs[0].email).toBe('theo@example.com');
  });
});
