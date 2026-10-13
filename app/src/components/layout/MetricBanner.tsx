'use client';

import React from 'react';
import type { IAlert } from '@/types/alert';
import type { IServer } from '@/types/server';

interface MetricBannerProps {
  alerts: IAlert[];
  servers?: IServer[];
}

export function MetricBanner({ alerts, servers = [] }: MetricBannerProps) {
  const criticalCount = alerts.filter(
    (a) => a.severity === 'CRITICAL' && (a.status === 'OPEN' || a.status === 'ACK')
  ).length;

  const warningCount = alerts.filter(
    (a) => a.severity === 'WARNING' && (a.status === 'OPEN' || a.status === 'ACK')
  ).length;

  const ackCount = alerts.filter((a) => a.status === 'ACK').length;

  const upServersCount = servers.filter((s) => s.status === 'UP').length;
  const totalServers = servers.length;

  return (
    <div
      id="metric-banner"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem',
      }}
    >
      {/* Carte Critiques */}
      <div
        id="metric-card-critical"
        style={{
          backgroundColor: 'var(--bg-card)',
          border: `1px solid ${
            criticalCount > 0 ? 'var(--accent-critical-border)' : 'var(--border-color)'
          }`,
          borderRadius: 'var(--radius-md)',
          padding: '1.25rem',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
            Incidents Critiques
          </span>
          {criticalCount > 0 && <span className="pulse-dot pulse-dot-critical" />}
        </div>
        <div
          style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}
        >
          <span
            style={{
              fontSize: '2rem',
              fontWeight: 800,
              color: criticalCount > 0 ? 'var(--accent-critical)' : 'var(--text-primary)',
            }}
          >
            {criticalCount}
          </span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            en attente d&apos;action
          </span>
        </div>
      </div>

      {/* Carte Avertissements */}
      <div
        id="metric-card-warning"
        style={{
          backgroundColor: 'var(--bg-card)',
          border: `1px solid ${
            warningCount > 0 ? 'var(--accent-warning-border)' : 'var(--border-color)'
          }`,
          borderRadius: 'var(--radius-md)',
          padding: '1.25rem',
        }}
      >
        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
          Avertissements
        </span>
        <div
          style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}
        >
          <span
            style={{
              fontSize: '2rem',
              fontWeight: 800,
              color: warningCount > 0 ? 'var(--accent-warning)' : 'var(--text-primary)',
            }}
          >
            {warningCount}
          </span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>attention requise</span>
        </div>
      </div>

      {/* Carte Pris en charge */}
      <div
        id="metric-card-ack"
        style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          padding: '1.25rem',
        }}
      >
        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
          En Cours de Traitement (ACK)
        </span>
        <div
          style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}
        >
          <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent-info)' }}>
            {ackCount}
          </span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>astreinte active</span>
        </div>
      </div>

      {/* Carte Disponibilité Serveurs */}
      <div
        id="metric-card-servers"
        style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          padding: '1.25rem',
        }}
      >
        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
          Disponibilité du Parc
        </span>
        <div
          style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}
        >
          <span
            style={{
              fontSize: '2rem',
              fontWeight: 800,
              color:
                totalServers === 0
                  ? 'var(--text-primary)'
                  : upServersCount === totalServers
                    ? 'var(--accent-success)'
                    : 'var(--accent-critical)',
            }}
          >
            {totalServers > 0 ? `${upServersCount}/${totalServers}` : '0'}
          </span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            serveurs opérationnels
          </span>
        </div>
      </div>
    </div>
  );
}
