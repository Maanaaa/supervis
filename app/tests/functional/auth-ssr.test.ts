import React from 'react';
import { NextRequest } from 'next/server';
import { middleware } from '../../src/middleware';
import LoginPage from '../../src/app/login/page';
import { createSessionToken, SESSION_COOKIE_NAME } from '@/lib/auth';

// Mock de next/navigation pour le rendu de LoginPage
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
  useSearchParams: () => ({
    get: (key: string) => (key === 'callbackUrl' ? '/servers' : null),
  }),
  usePathname: () => '/login',
}));

describe('Functional Tests — Login Page & Middleware (Ticket #10, ADR-0008)', () => {
  let validToken: string;

  beforeAll(async () => {
    validToken = await createSessionToken({
      userId: '6528f89e1b3d4f1234567890',
      name: 'Théo',
      email: 'theo@supervis.local',
      role: 'ADMIN',
      isOnDuty: true,
    });
  });

  describe('Composant Page /login', () => {
    it('doit exporter un composant fonctionnel React valide', () => {
      expect(typeof LoginPage).toBe('function');
      const element = React.createElement(LoginPage);
      expect(React.isValidElement(element)).toBe(true);
    });
  });

  describe('Middleware de Protection des Routes', () => {
    it('doit laisser passer les routes publiques sans cookie (/api/health, /api/poller, /login)', async () => {
      const reqHealth = new NextRequest('http://localhost:3000/api/health');
      const resHealth = await middleware(reqHealth);
      expect(resHealth.status).toBe(200);

      const reqLogin = new NextRequest('http://localhost:3000/login');
      const resLogin = await middleware(reqLogin);
      expect(resLogin.status).toBe(200);

      const reqPoller = new NextRequest('http://localhost:3000/api/poller');
      const resPoller = await middleware(reqPoller);
      expect(resPoller.status).toBe(200);
    });

    it('doit rediriger un accès non authentifié sur / vers /login', async () => {
      const req = new NextRequest('http://localhost:3000/');
      const res = await middleware(req);

      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toBe('http://localhost:3000/login');
    });

    it('doit rediriger un accès non authentifié sur /servers vers /login avec callbackUrl', async () => {
      const req = new NextRequest('http://localhost:3000/servers');
      const res = await middleware(req);

      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toContain('/login?callbackUrl=%2Fservers');
    });

    it('doit renvoyer un statut 401 pour un appel API protégé sans cookie', async () => {
      const req = new NextRequest('http://localhost:3000/api/servers');
      const res = await middleware(req);

      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error).toContain('session requise');
    });

    it('doit autoriser l’accès à / si un cookie de session valide est présent', async () => {
      const req = new NextRequest('http://localhost:3000/', {
        headers: {
          cookie: `${SESSION_COOKIE_NAME}=${validToken}`,
        },
      });
      const res = await middleware(req);
      expect(res.status).toBe(200);
    });

    it('doit rediriger vers / si un utilisateur connecté visite /login', async () => {
      const req = new NextRequest('http://localhost:3000/login', {
        headers: {
          cookie: `${SESSION_COOKIE_NAME}=${validToken}`,
        },
      });
      const res = await middleware(req);

      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toBe('http://localhost:3000/');
    });
  });
});
