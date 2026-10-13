import { Server } from '@/models/Server';
import { Alert } from '@/models/Alert';
import { User } from '@/models/User';

describe('Tests Unitaires — Validation des Schémas Mongoose', () => {
  describe('Modèle Server', () => {
    it('doit valider un serveur avec tous les champs obligatoires', async () => {
      const server = new Server({
        name: 'Serveur Web Principal',
        host: '192.168.1.10',
        port: 443,
      });

      const err = server.validateSync();
      expect(err).toBeUndefined();
      expect(server.status).toBe('UNKNOWN');
      expect(server.healthUrl).toBe('/health');
    });

    it("doit échouer si le nom ou l'hôte est manquant", () => {
      const server = new Server({ port: 80 });
      const err = server.validateSync();

      expect(err).toBeDefined();
      expect(err?.errors.name).toBeDefined();
      expect(err?.errors.host).toBeDefined();
    });

    it('doit refuser un statut de serveur non autorisé', () => {
      const server = new Server({
        name: 'Serveur DB',
        host: '10.0.0.5',
        status: 'INVALID_STATUS',
      });

      const err = server.validateSync();
      expect(err).toBeDefined();
      expect(err?.errors.status).toBeDefined();
    });
  });

  describe('Modèle Alert', () => {
    it('doit valider une alerte avec valeurs valides par défaut', () => {
      const alert = new Alert({
        serverName: 'Serveur Web 01',
        title: 'CPU Élevé',
        message: 'Utilisation CPU supérieure à 90%',
      });

      const err = alert.validateSync();
      expect(err).toBeUndefined();
      expect(alert.status).toBe('OPEN');
      expect(alert.severity).toBe('WARNING');
      expect(alert.transferredFrom).toEqual([]);
    });

    it('doit refuser une sévérité non autorisée', () => {
      const alert = new Alert({
        serverName: 'Serveur DB',
        title: 'Crash',
        message: 'Erreur',
        severity: 'CATASTROPHIC',
      });

      const err = alert.validateSync();
      expect(err).toBeDefined();
      expect(err?.errors.severity).toBeDefined();
    });

    it("doit refuser un statut d'alerte non autorisé", () => {
      const alert = new Alert({
        serverName: 'Serveur DB',
        title: 'Crash',
        message: 'Erreur',
        status: 'PENDING',
      });

      const err = alert.validateSync();
      expect(err).toBeDefined();
      expect(err?.errors.status).toBeDefined();
    });
  });

  describe('Modèle User', () => {
    it("doit valider un utilisateur d'astreinte", () => {
      const user = new User({
        name: 'Théo Astreinte',
        email: 'theo@example.com',
        role: 'ASTREINTE',
        isOnDuty: true,
      });

      const err = user.validateSync();
      expect(err).toBeUndefined();
      expect(user.isOnDuty).toBe(true);
    });

    it('doit refuser un utilisateur sans email', () => {
      const user = new User({
        name: 'Opérateur Anonyme',
      });

      const err = user.validateSync();
      expect(err).toBeDefined();
      expect(err?.errors.email).toBeDefined();
    });
  });
});
