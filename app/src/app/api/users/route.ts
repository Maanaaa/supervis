import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { UserRole } from '@/types/user';

export async function GET() {
  try {
    await connectDB();
    const users = await User.find().sort({ isOnDuty: -1, name: 1 });

    return NextResponse.json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error: unknown) {
    console.error('[API Users GET] Erreur :', error);
    const message = error instanceof Error ? error.message : 'Erreur interne du serveur';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await connectDB();

    let body: {
      name?: string;
      email?: string;
      phone?: string;
      role?: UserRole;
      isOnDuty?: boolean;
    };

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Corps de requête JSON invalide.' },
        { status: 400 }
      );
    }

    const { name, email, phone, role = 'ASTREINTE', isOnDuty = false } = body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Le nom de l’opérateur est obligatoire.' },
        { status: 400 }
      );
    }

    if (!email || typeof email !== 'string' || email.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'L’email est obligatoire.' },
        { status: 400 }
      );
    }

    const existing = await User.findOne({ email: email.trim().toLowerCase() });
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Un utilisateur avec cet email existe déjà.' },
        { status: 409 }
      );
    }

    const user = await User.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone?.trim(),
      role,
      isOnDuty: Boolean(isOnDuty),
    });

    return NextResponse.json({ success: true, user }, { status: 201 });
  } catch (error: unknown) {
    console.error('[API Users POST] Erreur :', error);
    const message = error instanceof Error ? error.message : 'Erreur interne du serveur';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
