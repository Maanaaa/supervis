import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { verifyPassword, createSessionToken, SESSION_COOKIE_NAME } from '@/lib/auth';
import { seedDefaultOperators } from '@/lib/seed';

export async function POST(request: Request) {
  try {
    await connectDB();

    let body: { identifier?: string; password?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Corps de requête JSON invalide.' },
        { status: 400 }
      );
    }

    const { identifier, password } = body;

    if (!identifier || typeof identifier !== 'string' || identifier.trim() === '') {
      return NextResponse.json(
        { success: false, error: "L'identifiant (nom ou email) est requis." },
        { status: 400 }
      );
    }

    if (!password || typeof password !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Le mot de passe est requis.' },
        { status: 400 }
      );
    }

    const trimmed = identifier.trim();
    const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    const findOperator = () =>
      User.findOne({
        $or: [
          { email: trimmed.toLowerCase() },
          { name: { $regex: new RegExp(`^${escaped}$`, 'i') } },
        ],
      }).select('+password');

    let user = await findOperator();

    // Si la collection est vide ou l'utilisateur n'existe pas encore, amorcer les opérateurs
    if (!user) {
      await seedDefaultOperators();
      user = await findOperator();
    }

    if (!user || !user.password) {
      return NextResponse.json(
        { success: false, error: 'Identifiant ou mot de passe incorrect.' },
        { status: 401 }
      );
    }

    const isMatch = verifyPassword(password, user.password);
    if (!isMatch) {
      return NextResponse.json(
        { success: false, error: 'Identifiant ou mot de passe incorrect.' },
        { status: 401 }
      );
    }

    const payload = {
      userId: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      isOnDuty: user.isOnDuty,
    };

    const token = await createSessionToken(payload);

    const response = NextResponse.json({
      success: true,
      message: 'Authentification réussie.',
      user: payload,
    });

    response.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 jours
    });

    return response;
  } catch (error: unknown) {
    console.error('[API Auth Login] Erreur :', error);
    const message = error instanceof Error ? error.message : 'Erreur interne du serveur';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
