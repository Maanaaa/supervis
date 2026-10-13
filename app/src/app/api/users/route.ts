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

export async function POST() {
  return NextResponse.json(
    {
      success: false,
      error:
        "La création libre de compte opérateur est formellement désactivée (ADR-0008). Les comptes d'astreinte sont pré-configurés.",
    },
    { status: 403 }
  );
}
