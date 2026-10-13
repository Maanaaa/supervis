'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import type { IServer } from '@/types/server';
import { formatRelativeTime } from '@/lib/utils';

interface ServerCardProps {
  server: IServer;
  onDeleted?: (id: string) => void;
}

export function ServerCard({ server, onDeleted }: ServerCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Supprimer définitivement le serveur "${server.name}" de la surveillance ?`)) {
      return;
    }

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/servers/${server._id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        onDeleted?.(server._id);
      }
    } catch {
      // Ignorer
    } finally {
      setIsDeleting(false);
    }
  };

  const isUp = server.status === 'UP';
  const isDown = server.status === 'DOWN';

  return (
    <div
      id={`server-card-${server._id}`}
      style={{
        backgroundColor: 'var(--bg-card)',
        border: `1px solid ${
          isDown
            ? 'var(--accent-critical-border)'
            : isUp
              ? 'var(--border-color)'
              : 'var(--border-color)'
        }`,
        borderRadius: 'var(--radius-md)',
        padding: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        transition: 'transform var(--transition-fast), border-color var(--transition-fast)',
      }}
    >
      <div>
        {/* En-tête : Nom & Badge Statut */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '0.75rem',
          }}
        >
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff' }}>{server.name}</h3>
          <span
            className={`badge ${
              isUp ? 'badge-success' : isDown ? 'badge-critical' : 'badge-muted'
            }`}
          >
            <span
              className={`pulse-dot ${
                isUp ? 'pulse-dot-success' : isDown ? 'pulse-dot-critical' : ''
              }`}
            />
            {server.status}
          </span>
        </div>

        {/* Coordonnées réseau */}
        <div
          style={{
            fontSize: '0.85rem',
            color: 'var(--text-secondary)',
            marginBottom: '0.5rem',
            fontFamily: 'monospace',
          }}
        >
          🌐 {server.host}:{server.port}
        </div>

        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
          URL Healthcheck :{' '}
          <code style={{ color: 'var(--accent-info)' }}>{server.healthUrl || '/health'}</code>
        </div>

        {server.description && (
          <p
            style={{
              fontSize: '0.85rem',
              color: 'var(--text-secondary)',
              marginBottom: '1rem',
              fontStyle: 'italic',
            }}
          >
            {server.description}
          </p>
        )}
      </div>

      {/* Métriques & Actions */}
      <div style={{ paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.8rem',
            color: 'var(--text-muted)',
            marginBottom: '0.85rem',
          }}
        >
          <span>
            Latence :{' '}
            <strong style={{ color: isUp ? 'var(--accent-success)' : 'var(--text-muted)' }}>
              {server.latencyMs !== undefined ? `${server.latencyMs} ms` : '—'}
            </strong>
          </span>
          <span>Dernier check : {formatRelativeTime(server.lastCheckAt)}</span>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'space-between' }}>
          <Link
            id={`link-server-detail-${server._id}`}
            href={`/servers/${server._id}`}
            className="btn btn-secondary btn-sm"
            style={{ flex: 1, textAlign: 'center' }}
          >
            📋 Historique des tickets
          </Link>
          <button
            id={`btn-delete-server-${server._id}`}
            className="btn btn-secondary btn-sm"
            onClick={handleDelete}
            disabled={isDeleting}
            title="Supprimer le serveur"
            style={{ color: 'var(--accent-critical)' }}
          >
            🗑️
          </button>
        </div>
      </div>
    </div>
  );
}
