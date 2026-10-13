import {
  hashPassword,
  verifyPassword,
  createSessionToken,
  verifySessionToken,
  SESSION_COOKIE_NAME,
} from '../../src/lib/auth';
import type { ISessionPayload } from '../../src/types/user';

describe('Unit Tests — Sécurité & Session (Ticket #10, ADR-0008)', () => {
  const dummyPayload: ISessionPayload = {
    userId: '6528f89e1b3d4f1234567890',
    name: 'Théo',
    email: 'theo@supervis.local',
    role: 'ADMIN',
    isOnDuty: true,
  };

  describe('Hachage et Vérification des Mots de Passe (scrypt)', () => {
    it('doit générer un hash salé au format salt:hash', () => {
      const hash = hashPassword('admin');
      expect(hash).toContain(':');
      const [salt, key] = hash.split(':');
      expect(salt.length).toBe(32); // 16 bytes hex
      expect(key.length).toBe(128); // 64 bytes hex
    });

    it('doit générer deux sels différents pour un même mot de passe', () => {
      const hash1 = hashPassword('admin');
      const hash2 = hashPassword('admin');
      expect(hash1).not.toBe(hash2);
    });

    it('doit valider avec succès le bon mot de passe', () => {
      const hash = hashPassword('admin');
      expect(verifyPassword('admin', hash)).toBe(true);
    });

    it('doit rejeter un mot de passe incorrect', () => {
      const hash = hashPassword('admin');
      expect(verifyPassword('mauvais_mot_de_passe', hash)).toBe(false);
      expect(verifyPassword('Admin', hash)).toBe(false);
    });

    it('doit rejeter un format de hash invalide ou altéré sans crasher', () => {
      expect(verifyPassword('admin', 'format_invalide')).toBe(false);
      expect(verifyPassword('admin', '')).toBe(false);
      expect(verifyPassword('admin', 'abc:')).toBe(false);
    });
  });

  describe('Jetons de Session HMAC SHA-256 (Web Standards)', () => {
    it('doit créer un jeton de session signé à 2 segments (payload.signature)', async () => {
      const token = await createSessionToken(dummyPayload);
      expect(token).toBeDefined();
      const parts = token.split('.');
      expect(parts.length).toBe(2);
      expect(parts[0].length).toBeGreaterThan(10);
      expect(parts[1].length).toBeGreaterThan(10);
    });

    it('doit décoder et valider un jeton authentique', async () => {
      const token = await createSessionToken(dummyPayload);
      const decoded = await verifySessionToken(token);
      expect(decoded).not.toBeNull();
      expect(decoded?.userId).toBe(dummyPayload.userId);
      expect(decoded?.name).toBe('Théo');
      expect(decoded?.email).toBe('theo@supervis.local');
      expect(decoded?.role).toBe('ADMIN');
      expect(decoded?.isOnDuty).toBe(true);
      expect(decoded?.exp).toBeGreaterThan(Date.now());
    });

    it('doit rejeter un jeton avec une signature falsifiée', async () => {
      const token = await createSessionToken(dummyPayload);
      const [payloadPart] = token.split('.');
      const fakeToken = `${payloadPart}.signature_totalement_invalide_ou_falsifiee`;
      const result = await verifySessionToken(fakeToken);
      expect(result).toBeNull();
    });

    it('doit rejeter un jeton dont le payload a été altéré', async () => {
      const token = await createSessionToken(dummyPayload);
      const [, signaturePart] = token.split('.');
      // Payload altéré avec un autre rôle
      const alteredPayload = Buffer.from(
        JSON.stringify({ ...dummyPayload, role: 'PIRATE', exp: Date.now() + 10000 })
      ).toString('base64url');
      const fakeToken = `${alteredPayload}.${signaturePart}`;
      const result = await verifySessionToken(fakeToken);
      expect(result).toBeNull();
    });

    it('doit rejeter un jeton vide ou mal formé', async () => {
      expect(await verifySessionToken('')).toBeNull();
      expect(await verifySessionToken('trois.parties.invalides')).toBeNull();
      expect(await verifySessionToken('unseulsegment')).toBeNull();
    });

    it('doit exporter la constante du nom de cookie supervis_session', () => {
      expect(SESSION_COOKIE_NAME).toBe('supervis_session');
    });
  });
});
