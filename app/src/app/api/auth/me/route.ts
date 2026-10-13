import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySessionToken, SESSION_COOKIE_NAME } from '@/lib/auth';

export async function GET() {
  const cookieStore = cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return NextResponse.json(
      { success: false, user: null, error: 'Non authentifié.' },
      { status: 401 }
    );
  }

  const session = await verifySessionToken(token);

  if (!session) {
    return NextResponse.json(
      { success: false, user: null, error: 'Session invalide ou expirée.' },
      { status: 401 }
    );
  }

  return NextResponse.json({
    success: true,
    user: {
      userId: session.userId,
      name: session.name,
      email: session.email,
      role: session.role,
      isOnDuty: session.isOnDuty,
    },
  });
}
