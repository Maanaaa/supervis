import { formatDateTime, formatRelativeTime, formatDuration, calculateMTTR } from '@/lib/utils';

describe('Tests Unitaires — Utilitaires Front-End (src/lib/utils.ts)', () => {
  describe('formatDateTime', () => {
    it('doit formater proprement une date valide', () => {
      const date = new Date('2026-10-12T14:30:00.000Z');
      const formatted = formatDateTime(date);
      expect(formatted).not.toBe('—');
      expect(formatted.length).toBeGreaterThan(5);
    });

    it('doit renvoyer — pour une date indéfinie ou invalide', () => {
      expect(formatDateTime(undefined)).toBe('—');
      expect(formatDateTime('invalid-date')).toBe('—');
    });
  });

  describe('formatRelativeTime', () => {
    it('doit renvoyer "à l\'instant" pour une date récente', () => {
      const now = new Date();
      expect(formatRelativeTime(now)).toBe("à l'instant");
    });

    it('doit calculer les minutes écoulées', () => {
      const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
      expect(formatRelativeTime(fiveMinAgo)).toBe('il y a 5 min');
    });

    it('doit renvoyer — si la date est manquante', () => {
      expect(formatRelativeTime(undefined)).toBe('—');
    });
  });

  describe('formatDuration', () => {
    it('doit formater les durées en secondes', () => {
      const start = new Date(1000000);
      const end = new Date(1045000); // +45s
      expect(formatDuration(start, end)).toBe('45s');
    });

    it('doit formater les durées en minutes et secondes', () => {
      const start = new Date(1000000);
      const end = new Date(1245000); // +4m 5s
      expect(formatDuration(start, end)).toBe('4m 5s');
    });

    it('doit formater les durées supérieures à 1 heure', () => {
      const start = new Date(1000000);
      const end = new Date(1000000 + 3600000 * 2 + 60000 * 15); // +2h 15m
      expect(formatDuration(start, end)).toBe('2h 15m');
    });
  });

  describe('calculateMTTR', () => {
    it('doit renvoyer 0s si aucune alerte résolue', () => {
      expect(calculateMTTR([])).toBe('0s');
    });

    it('doit calculer le MTTR moyen correctement', () => {
      const alerts = [
        {
          createdAt: new Date(1000000),
          resolvedAt: new Date(1060000), // 60s
        },
        {
          createdAt: new Date(2000000),
          resolvedAt: new Date(2120000), // 120s
        },
      ];
      // Moyenne = (60 + 120) / 2 = 90s = 1m 30s
      expect(calculateMTTR(alerts)).toBe('1m 30s');
    });
  });
});
