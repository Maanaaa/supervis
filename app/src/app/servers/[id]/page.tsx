import Link from 'next/link';
import { notFound } from 'next/navigation';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import { Server } from '@/models/Server';
import { Alert } from '@/models/Alert';
import { formatDateTime, formatRelativeTime, formatDuration } from '@/lib/utils';
import type { IServer } from '@/types/server';
import type { IAlert } from '@/types/alert';

export const dynamic = 'force-dynamic';

interface ServerDetailPageProps {
  params: { id: string };
}

export default async function ServerDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    notFound();
  }

  await connectDB();
  const serverDoc = await Server.findById(id);

  if (!serverDoc) {
    notFound();
  }

  const alertsDocs = await Alert.find({
    $or: [{ serverId: id }, { serverName: serverDoc.name }],
  }).sort({ createdAt: -1 });

  const server: IServer = JSON.parse(JSON.stringify(serverDoc));
  const alerts: IAlert[] = JSON.parse(JSON.stringify(alertsDocs));

  const isUp = server.status === 'UP';
  const isDown = server.status === 'DOWN';

  return (
    <div id="server-detail-view">
      {/* Fil d'Ariane / Retour */}
      <div style={{ marginBottom: '1.5rem' }}>
        <Link
          href="/servers"
          style={{
            fontSize: '0.875rem',
            color: 'var(--accent-primary)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
          }}
        >
          ← Retour au parc de serveurs
        </Link>
      </div>

      {/* Carte Fiche Serveur */}
      <div
        style={{
          backgroundColor: 'var(--bg-card)',
          border: `1px solid ${isDown ? 'var(--accent-critical-border)' : 'var(--border-color)'}`,
          borderRadius: 'var(--radius-lg)',
          padding: '2rem',
          marginBottom: '2.5rem',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
            marginBottom: '1rem',
          }}
        >
          <div>
            <span
              style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}
            >
              Fiche Serveur
            </span>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#ffffff' }}>{server.name}</h1>
          </div>

          <span
            className={`badge ${
              isUp ? 'badge-success' : isDown ? 'badge-critical' : 'badge-muted'
            }`}
            style={{ fontSize: '0.85rem', padding: '0.35rem 0.85rem' }}
          >
            <span
              className={`pulse-dot ${
                isUp ? 'pulse-dot-success' : isDown ? 'pulse-dot-critical' : ''
              }`}
            />
            {server.status}
          </span>
        </div>

        {server.description && (
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '1rem' }}>
            {server.description}
          </p>
        )}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1.25rem',
            paddingTop: '1.25rem',
            borderTop: '1px solid var(--border-subtle)',
          }}
        >
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Coordonnées</span>
            <div
              style={{
                fontSize: '1rem',
                fontWeight: 600,
                color: '#ffffff',
                fontFamily: 'monospace',
              }}
            >
              {server.host}:{server.port}
            </div>
          </div>

          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Health Check</span>
            <div
              style={{
                fontSize: '0.95rem',
                fontWeight: 600,
                color: 'var(--accent-info)',
                fontFamily: 'monospace',
              }}
            >
              {server.healthUrl || '/health'}
            </div>
          </div>

          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Latence mesurée</span>
            <div
              style={{
                fontSize: '1rem',
                fontWeight: 600,
                color: isUp ? 'var(--accent-success)' : 'var(--text-muted)',
              }}
            >
              {server.latencyMs !== undefined ? `${server.latencyMs} ms` : '—'}
            </div>
          </div>

          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Dernier contrôle
            </span>
            <div style={{ fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
              {formatRelativeTime(server.lastCheckAt)}
            </div>
          </div>
        </div>
      </div>

      {/* Historique complet des incidents associés */}
      <div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1.25rem',
          }}
        >
          <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#ffffff' }}>
            Historique des Incidents Liés ({alerts.length})
          </h2>
        </div>

        {alerts.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {alerts.map((alert) => (
              <div
                key={alert._id}
                style={{
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.25rem',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '0.5rem',
                  }}
                >
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <span
                      className={`badge ${
                        alert.severity === 'CRITICAL'
                          ? 'badge-critical'
                          : alert.severity === 'WARNING'
                            ? 'badge-warning'
                            : 'badge-info'
                      }`}
                    >
                      {alert.severity}
                    </span>
                    <span
                      className={`badge ${
                        alert.status === 'RESOLVED'
                          ? 'badge-success'
                          : alert.status === 'ACK'
                            ? 'badge-info'
                            : 'badge-warning'
                      }`}
                    >
                      {alert.status}
                    </span>
                  </div>

                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {formatDateTime(alert.createdAt)}
                  </span>
                </div>

                <h3
                  style={{
                    fontSize: '1.05rem',
                    fontWeight: 600,
                    color: '#ffffff',
                    marginBottom: '0.35rem',
                  }}
                >
                  {alert.title}
                </h3>
                <p
                  style={{
                    color: 'var(--text-secondary)',
                    fontSize: '0.9rem',
                    marginBottom: '0.5rem',
                  }}
                >
                  {alert.message}
                </p>

                {alert.assignedTo && (
                  <div
                    style={{
                      fontSize: '0.8rem',
                      color: 'var(--text-muted)',
                      marginBottom: '0.5rem',
                    }}
                  >
                    Technicien : <strong style={{ color: '#fff' }}>{alert.assignedTo}</strong>
                  </div>
                )}

                {alert.resolutionComment && (
                  <div
                    style={{
                      backgroundColor: 'var(--bg-secondary)',
                      padding: '0.5rem 0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.85rem',
                      color: 'var(--text-primary)',
                      borderLeft: '3px solid var(--accent-success)',
                    }}
                  >
                    💡 Résolution : {alert.resolutionComment} (durée :{' '}
                    {formatDuration(alert.createdAt, alert.resolvedAt)})
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div
            style={{
              padding: '3rem',
              textAlign: 'center',
              backgroundColor: 'var(--bg-card)',
              border: '1px dashed var(--border-color)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-secondary)',
            }}
          >
            ✅ Aucun incident recensé sur cette machine.
          </div>
        )}
      </div>
    </div>
  );
}
