import { connectDB } from '@/lib/db';
import { Alert } from '@/models/Alert';
import { Server } from '@/models/Server';
import { AlertList } from '@/components/alerts/AlertList';
import type { IAlert } from '@/types/alert';
import type { IServer } from '@/types/server';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  let initialAlerts: IAlert[] = [];
  let initialServers: IServer[] = [];

  try {
    await connectDB();
    const alertsDocs = await Alert.find({ status: { $in: ['OPEN', 'ACK'] } }).sort({
      createdAt: -1,
    });
    const serversDocs = await Server.find().sort({ createdAt: -1 });

    initialAlerts = JSON.parse(JSON.stringify(alertsDocs));
    initialServers = JSON.parse(JSON.stringify(serversDocs));
  } catch (error) {
    console.error('[DashboardPage SSR] Erreur lors du chargement initial :', error);
  }

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1
          style={{
            fontSize: '1.875rem',
            fontWeight: 800,
            letterSpacing: '-0.025em',
            color: '#ffffff',
          }}
        >
          Tableau de Bord d&apos;Astreinte
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem', fontSize: '0.95rem' }}>
          Supervision temps réel, traitement des incidents et coordination d&apos;astreinte sans
          collision.
        </p>
      </div>

      <AlertList initialAlerts={initialAlerts} initialServers={initialServers} />
    </div>
  );
}
