import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { cookies } from 'next/headers';
import { connectDB } from '@/lib/db';
import { Server } from '@/models/Server';
import { Alert } from '@/models/Alert';
import { emitSocket } from '@/lib/socket';
import { verifySessionToken, SESSION_COOKIE_NAME } from '@/lib/session';

async function getAuthenticatedUser(request: Request) {
  let token: string | undefined;
  try {
    const cookieStore = cookies();
    token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  } catch {
    // Hors contexte App Router
  }

  if (!token) {
    const cookieHeader = request.headers.get('cookie');
    if (cookieHeader) {
      const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${SESSION_COOKIE_NAME}=([^;]*)`));
      if (match) token = decodeURIComponent(match[1]);
    }
  }
  return token ? await verifySessionToken(token) : null;
}

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    const { id } = params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Identifiant de serveur invalide.' },
        { status: 400 }
      );
    }

    const server = await Server.findById(id);
    if (!server) {
      return NextResponse.json({ success: false, error: 'Serveur introuvable.' }, { status: 404 });
    }

    // Récupération de l'historique complet de tous les tickets associés à ce serveur
    const alerts = await Alert.find({
      $or: [{ serverId: id }, { serverName: server.name }],
    }).sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      server,
      alerts,
    });
  } catch (error: unknown) {
    console.error('[API Server [id] GET] Erreur :', error);
    const message = error instanceof Error ? error.message : 'Erreur interne du serveur';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    const { id } = params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Identifiant de serveur invalide.' },
        { status: 400 }
      );
    }

    const user = await getAuthenticatedUser(_request);
    if (user && user.role !== 'ADMIN') {
      return NextResponse.json(
        {
          success: false,
          error: 'Accès refusé : la suppression d’une machine est réservée aux administrateurs.',
        },
        { status: 403 }
      );
    }

    const deleted = await Server.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ success: false, error: 'Serveur introuvable.' }, { status: 404 });
    }

    emitSocket('server:deleted', { serverId: id });

    return NextResponse.json({
      success: true,
      message: 'Serveur supprimé avec succès.',
    });
  } catch (error: unknown) {
    console.error('[API Server [id] DELETE] Erreur :', error);
    const message = error instanceof Error ? error.message : 'Erreur interne du serveur';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
