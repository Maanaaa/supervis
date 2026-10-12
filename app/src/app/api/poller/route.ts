import { NextResponse } from 'next/server';
import { runPollerCycle, isPollerRunning } from '@/lib/poller';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    pollerActive: isPollerRunning(),
  });
}

export async function POST(request: Request) {
  try {
    let timeoutMs: number | undefined;
    try {
      const body = await request.json();
      if (typeof body.timeoutMs === 'number') {
        timeoutMs = body.timeoutMs;
      }
    } catch {
      // Body vide ou non JSON, utilisation de la valeur par défaut
    }

    const results = await runPollerCycle(timeoutMs);

    return NextResponse.json({
      success: true,
      count: results.length,
      results,
    });
  } catch (error: unknown) {
    console.error('[API Poller] Erreur lors de la sonde manuelle :', error);
    const message = error instanceof Error ? error.message : 'Erreur interne de la sonde';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
