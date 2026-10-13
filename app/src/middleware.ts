import { NextResponse, type NextRequest } from 'next/server';
import { verifySessionToken, SESSION_COOKIE_NAME } from '@/lib/session';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Routes publiques exemptées de contrôle
  const isPublicRoute =
    pathname === '/login' ||
    pathname.startsWith('/api/auth/') ||
    pathname === '/api/health' ||
    pathname === '/api/poller' ||
    pathname.startsWith('/_next') ||
    pathname.includes('.') || // Fichiers statiques (favicon, robots, css, png...)
    pathname === '/favicon.ico';

  // 2. Récupération et vérification du cookie de session
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? await verifySessionToken(token) : null;

  // 3. Si l'utilisateur est déjà connecté et tente d'accéder à /login => redirection vers l'accueil
  if (pathname === '/login') {
    if (session) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  // 4. Si la route est publique (API auth, health, etc.) => laisser passer
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // 5. Si aucune session valide n'est présente :
  if (!session) {
    // Si c'est une requête API protégée => 401 Unauthorized
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Accès refusé : session requise. Rendez-vous sur /login pour vous authentifier.',
        },
        { status: 401 }
      );
    }

    // Si c'est une page HTML => redirection vers /login avec mémorisation de l'URL cible
    const loginUrl = new URL('/login', request.url);
    if (pathname !== '/') {
      loginUrl.searchParams.set('callbackUrl', pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  // 6. Session valide => autoriser l'accès
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
