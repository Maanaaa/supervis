import { connectDB } from '@/lib/db';
import { Alert } from '@/models/Alert';
import { HistoryList } from '@/components/alerts/HistoryList';
import type { IAlert } from '@/types/alert';

export const dynamic = 'force-dynamic';

export default async function HistoryPage() {
  let resolvedAlerts: IAlert[] = [];

  try {
    await connectDB();
    const docs = await Alert.find({ status: 'RESOLVED' }).sort({ resolvedAt: -1, createdAt: -1 });
    resolvedAlerts = JSON.parse(JSON.stringify(docs));
  } catch (error) {
    console.error('[HistoryPage SSR] Erreur lors du chargement de l’historique :', error);
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
          Historique des Incidents &amp; Post-mortem
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem', fontSize: '0.95rem' }}>
          Traçabilité des pannes résolues, temps de rétablissement (MTTR) et commentaires de
          clôture.
        </p>
      </div>

      <HistoryList initialAlerts={resolvedAlerts} />
    </div>
  );
}
