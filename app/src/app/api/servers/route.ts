import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Server } from '@/models/Server';
import { emitSocket } from '@/lib/socket';

export async function GET() {
  try {
    await connectDB();
    const servers = await Server.find().sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      count: servers.length,
      servers,
    });
  } catch (error: unknown) {
    console.error('[API Servers GET] Erreur :', error);
    const message = error instanceof Error ? error.message : 'Erreur interne du serveur';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await connectDB();

    let body: {
      name?: string;
      host?: string;
      port?: number;
      healthUrl?: string;
      description?: string;
    };

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Corps de requête JSON invalide.' },
        { status: 400 }
      );
    }

    const { name, host, port = 80, healthUrl = '/health', description } = body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Le nom du serveur est obligatoire.' },
        { status: 400 }
      );
    }

    if (!host || typeof host !== 'string' || host.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'L’hôte ou IP du serveur est obligatoire.' },
        { status: 400 }
      );
    }

    const numericPort = Number(port);
    if (isNaN(numericPort) || numericPort < 1 || numericPort > 65535) {
      return NextResponse.json(
        { success: false, error: 'Le numéro de port doit être compris entre 1 et 65535.' },
        { status: 400 }
      );
    }

    const server = await Server.create({
      name: name.trim(),
      host: host.trim(),
      port: numericPort,
      healthUrl: healthUrl.trim() || '/health',
      description: description?.trim(),
      status: 'UNKNOWN',
      latencyMs: 0,
    });

    emitSocket('server:status_change', server.toJSON());

    return NextResponse.json(
      {
        success: true,
        server,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error('[API Servers POST] Erreur :', error);
    const message = error instanceof Error ? error.message : 'Erreur interne du serveur';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
