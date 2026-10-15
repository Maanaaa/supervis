import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import { Alert } from '@/models/Alert';
import { emitSocket } from '@/lib/socket';
import { AlertSeverity } from '@/types/alert';

export async function GET(request: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get('status');

    let query = {};
    if (statusParam === 'all') {
      query = {};
    } else if (statusParam === 'RESOLVED') {
      query = { status: 'RESOLVED' };
    } else if (statusParam === 'OPEN') {
      query = { status: 'OPEN' };
    } else if (statusParam === 'ACK') {
      query = { status: 'ACK' };
    } else {
      // Par défaut : les alertes actives pour le dashboard d'astreinte
      query = { status: { $in: ['OPEN', 'ACK'] } };
    }

    const alerts = await Alert.find(query).sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      count: alerts.length,
      alerts,
    });
  } catch (error: unknown) {
    console.error('[API Alerts GET] Erreur :', error);
    const message = error instanceof Error ? error.message : 'Erreur interne du serveur';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await connectDB();

    let body: {
      serverName?: string;
      title?: string;
      message?: string;
      severity?: AlertSeverity;
      serverId?: string;
    };

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Corps de requête JSON invalide.' },
        { status: 400 }
      );
    }

    const { serverName, title, message, severity = 'WARNING', serverId } = body;

    if (!serverName || typeof serverName !== 'string' || serverName.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Le champ serverName est obligatoire.' },
        { status: 400 }
      );
    }

    if (!title || typeof title !== 'string' || title.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Le champ title est obligatoire.' },
        { status: 400 }
      );
    }

    if (!message || typeof message !== 'string' || message.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Le champ message est obligatoire.' },
        { status: 400 }
      );
    }

    const validSeverities: AlertSeverity[] = ['INFO', 'WARNING', 'CRITICAL'];
    if (!validSeverities.includes(severity)) {
      return NextResponse.json(
        {
          success: false,
          error: `Sévérité invalide. Valeurs acceptées : ${validSeverities.join(', ')}`,
        },
        { status: 400 }
      );
    }

    if (serverId && !mongoose.Types.ObjectId.isValid(serverId)) {
      return NextResponse.json(
        { success: false, error: 'Identifiant serverId invalide.' },
        { status: 400 }
      );
    }

    const alert = await Alert.create({
      serverName: serverName.trim(),
      title: title.trim(),
      message: message.trim(),
      severity,
      status: 'OPEN',
      serverId: serverId || undefined,
    });

    // Émission instantanée via Socket.IO
    emitSocket('alert:new', alert.toJSON());

    return NextResponse.json(
      {
        success: true,
        alert,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error('[API Alerts POST] Erreur :', error);
    const message = error instanceof Error ? error.message : 'Erreur interne du serveur';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
