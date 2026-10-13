import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import { Server } from '@/models/Server';
import { Alert } from '@/models/Alert';
import { emitSocket } from '@/lib/socket';

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
