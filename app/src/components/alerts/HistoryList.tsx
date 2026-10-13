'use client';

import React, { useState } from 'react';
import type { IAlert } from '@/types/alert';
import { formatDateTime, formatDuration, calculateMTTR } from '@/lib/utils';

interface HistoryListProps {
  initialAlerts: IAlert[];
}

export function HistoryList({ initialAlerts }: HistoryListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');

  const filteredAlerts = initialAlerts.filter((alert) => {
    const matchesSearch =
      alert.serverName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (alert.assignedTo && alert.assignedTo.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesSeverity = selectedSeverity === 'ALL' || alert.severity === selectedSeverity;

    return matchesSearch && matchesSeverity;
  });

  const avgMTTR = calculateMTTR(initialAlerts);

  return (
    <div id="history-view-container">
      {/* En-tête & Métriques MTTR */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem',
        }}
      >
        <div
          style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '1.25rem',
          }}
        >
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Total Incidents Résolus
          </span>
          <div
            style={{
              fontSize: '2rem',
              fontWeight: 800,
              marginTop: '0.5rem',
              color: 'var(--text-primary)',
            }}
          >
            {initialAlerts.length}
          </div>
        </div>

        <div
          style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '1.25rem',
          }}
        >
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Temps Moyen de Rétablissement (MTTR)
          </span>
          <div
            style={{
              fontSize: '2rem',
              fontWeight: 800,
              marginTop: '0.5rem',
              color: 'var(--accent-success)',
            }}
          >
            {avgMTTR}
          </div>
        </div>
      </div>

      {/* Barre de recherche et de filtres */}
      <div
        style={{
          display: 'flex',
          gap: '1rem',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', gap: '0.75rem', flex: 1, minWidth: '280px' }}>
          <input
            id="history-search-input"
            type="text"
            placeholder="Rechercher par serveur, titre ou technicien..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', maxWidth: '400px' }}
          />

          <select
            id="history-severity-filter"
            aria-label="Filtrer par niveau de sévérité"
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
          >
            <option value="ALL">Toutes sévérités</option>
            <option value="CRITICAL">Critiques</option>
            <option value="WARNING">Avertissements</option>
            <option value="INFO">Informations</option>
          </select>
        </div>

        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          {filteredAlerts.length} archive{filteredAlerts.length > 1 ? 's' : ''}
        </div>
      </div>

      {/* Liste / Tableau des incidents archivés */}
      {filteredAlerts.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filteredAlerts.map((alert) => {
            const duration = formatDuration(alert.createdAt, alert.resolvedAt);

            return (
              <div
                key={alert._id}
                id={`history-item-${alert._id}`}
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
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '0.75rem',
                    marginBottom: '0.5rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
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
                    <strong style={{ color: '#fff' }}>🖥️ {alert.serverName}</strong>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      fontSize: '0.8rem',
                    }}
                  >
                    <span style={{ color: 'var(--accent-success)', fontWeight: 600 }}>
                      ⏱️ Rétabli en {duration}
                    </span>
                    <span style={{ color: 'var(--text-muted)' }}>
                      Intervenant :{' '}
                      <strong style={{ color: '#fff' }}>{alert.assignedTo || 'Non assigné'}</strong>
                    </span>
                  </div>
                </div>

                <h4
                  style={{
                    fontSize: '1rem',
                    fontWeight: 600,
                    color: '#ffffff',
                    marginBottom: '0.35rem',
                  }}
                >
                  {alert.title}
                </h4>
                <p
                  style={{
                    color: 'var(--text-secondary)',
                    fontSize: '0.875rem',
                    marginBottom: '0.75rem',
                  }}
                >
                  {alert.message}
                </p>

                {/* Bloc commentaire de clôture post-mortem */}
                <div
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.65rem 0.85rem',
                    fontSize: '0.85rem',
                    borderLeft: '3px solid var(--accent-success)',
                  }}
                >
                  <div
                    style={{
                      color: 'var(--text-muted)',
                      fontSize: '0.75rem',
                      marginBottom: '0.2rem',
                    }}
                  >
                    📝 Post-mortem / Commentaire de résolution :
                  </div>
                  <div
                    style={{
                      color: alert.resolutionComment ? 'var(--text-primary)' : 'var(--text-muted)',
                      fontStyle: alert.resolutionComment ? 'normal' : 'italic',
                    }}
                  >
                    {alert.resolutionComment || 'Aucun commentaire consigné.'}
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    gap: '1.5rem',
                    fontSize: '0.75rem',
                    color: 'var(--text-muted)',
                    marginTop: '0.75rem',
                  }}
                >
                  <span>Début : {formatDateTime(alert.createdAt)}</span>
                  <span>Clôture : {formatDateTime(alert.resolvedAt)}</span>
                  {alert.transferredFrom && alert.transferredFrom.length > 0 && (
                    <span>Chaîne de transfert : {alert.transferredFrom.join(' ➔ ')}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div
          id="history-empty-state"
          style={{
            textAlign: 'center',
            padding: '4rem 2rem',
            backgroundColor: 'var(--bg-card)',
            border: '1px dashed var(--border-color)',
            borderRadius: 'var(--radius-lg)',
          }}
        >
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📜</div>
          <h3
            style={{
              fontSize: '1.25rem',
              fontWeight: 600,
              marginBottom: '0.5rem',
              color: '#ffffff',
            }}
          >
            Aucun incident dans l&apos;historique
          </h3>
          <p
            style={{
              color: 'var(--text-secondary)',
              maxWidth: '450px',
              margin: '0 auto',
              fontSize: '0.9rem',
            }}
          >
            Les tickets d&apos;astreinte résolus alimenteront automatiquement cet onglet pour le
            suivi de la qualité de service (SLA) et l&apos;analyse post-mortem.
          </p>
        </div>
      )}
    </div>
  );
}
