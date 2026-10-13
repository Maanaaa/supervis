import { connectDB, disconnectDB } from '@/lib/db';

describe('Tests Unitaires — Singleton de Connexion MongoDB (db.ts)', () => {
  const originalUri = process.env.MONGODB_URI;

  afterEach(async () => {
    process.env.MONGODB_URI = originalUri;
    await disconnectDB();
  });

  it("doit lever une exception explicite si MONGODB_URI n'est pas configuré", async () => {
    delete process.env.MONGODB_URI;

    await expect(connectDB()).rejects.toThrow(
      "La variable d'environnement MONGODB_URI est requise pour se connecter à la base de données."
    );
  });
});
