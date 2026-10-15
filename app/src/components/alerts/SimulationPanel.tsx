'use client';

import React, { useState } from 'react';

interface SimulationFeedback {
  type: 'success' | 'error';
  message: string;
  durationMs?: number;
}

export function SimulationPanel() {
  const [isOpen, setIsOpen] = useState(true);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<SimulationFeedback | null>(null);

  const triggerSimulation = async (type: string, payload: Record<string, unknown> = {}) => {
    setLoadingAction(type);
    setFeedback(null);
    const startTime = performance.now();

    try {
      const response = await fetch('/api/simulator/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, ...payload }),
      });

      const elapsedMs = Math.round(performance.now() - startTime);
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Erreur lors de la simulation');
      }

      setFeedback({
        type: 'success',
        message: data.message || `Action ${type} exécutée avec succès`,
        durationMs: elapsedMs,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Échec de la simulation';
      setFeedback({
        type: 'error',
        message,
        durationMs: Math.round(performance.now() - startTime),
      });
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div
      id="simulation-panel"
      style={{
        backgroundColor: 'var(--bg-card)',
        border: '1px solid rgba(99, 102, 241, 0.35)',
        borderRadius: 'var(--radius-lg)',
        padding: '1.25rem 1.5rem',
        marginBottom: '1.75rem',
        boxShadow: '0 4px 20px rgba(99, 102, 241, 0.08)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* En-tête du panneau avec indicateur Démo */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
          cursor: 'pointer',
        }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '28px',
              height: '28px',
              borderRadius: 'var(--radius-sm)',
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              color: '#ffffff',
              fontSize: '0.9rem',
            }}
          >
            🧪
          </span>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h2
                style={{
                  fontSize: '1rem',
                  fontWeight: 700,
                  color: '#ffffff',
                  letterSpacing: '-0.01em',
                  margin: 0,
                }}
              >
                Simulateur de Pannes & Chaos Testing
              </h2>
              <span
                style={{
                  fontSize: '0.65rem',
                  padding: '0.1rem 0.45rem',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: 'rgba(245, 158, 11, 0.18)',
                  color: 'var(--accent-warning)',
                  border: '1px solid rgba(245, 158, 11, 0.35)',
                  fontWeight: 700,
                }}
              >
                DÉMO LIVE
              </span>
            </div>
            <p
              style={{
                fontSize: '0.8rem',
                color: 'var(--text-secondary)',
                marginTop: '0.15rem',
                marginBottom: 0,
              }}
            >
              Injectez des incidents en temps réel pour valider la réactivité de la sonde et du flux
              Socket.IO (&lt; 100ms).
            </p>
          </div>
        </div>

        <button
          id="btn-toggle-sim-panel"
          type="button"
          aria-label={
            isOpen ? 'Replier le panneau de simulation' : 'Déplier le panneau de simulation'
          }
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            fontSize: '0.85rem',
            cursor: 'pointer',
            padding: '0.25rem 0.5rem',
          }}
        >
          {isOpen ? '▲ Replier' : '▼ Déplier'}
        </button>
      </div>

      {isOpen && (
        <div
          style={{
            marginTop: '1.25rem',
            paddingTop: '1rem',
            borderTop: '1px solid var(--border-color)',
          }}
        >
          {/* Groupe de boutons d'injection */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '0.65rem',
            }}
          >
            {/* Bouton Panne CPU */}
            <button
              id="btn-sim-cpu"
              type="button"
              disabled={loadingAction !== null}
              onClick={(e) => {
                e.stopPropagation();
                triggerSimulation('cpu');
              }}
              className="btn btn-sm btn-danger"
              style={{
                opacity: loadingAction ? 0.7 : 1,
                cursor: loadingAction ? 'not-allowed' : 'pointer',
              }}
            >
              {loadingAction === 'cpu' ? '⚡ Injection...' : '⚡ Déclencher panne CPU'}
            </button>

            {/* Bouton Serveur Injoignable */}
            <button
              id="btn-sim-server-down"
              type="button"
              disabled={loadingAction !== null}
              onClick={(e) => {
                e.stopPropagation();
                triggerSimulation('server_down');
              }}
              className="btn btn-sm"
              style={{
                backgroundColor: '#dc2626',
                color: '#ffffff',
                opacity: loadingAction ? 0.7 : 1,
                cursor: loadingAction ? 'not-allowed' : 'pointer',
              }}
            >
              {loadingAction === 'server_down' ? '🌐 Bascule...' : '🌐 Simuler serveur injoignable'}
            </button>

            {/* Bouton Disque plein */}
            <button
              id="btn-sim-disk"
              type="button"
              disabled={loadingAction !== null}
              onClick={(e) => {
                e.stopPropagation();
                triggerSimulation('disk');
              }}
              className="btn btn-sm btn-secondary"
              style={{
                opacity: loadingAction ? 0.7 : 1,
                cursor: loadingAction ? 'not-allowed' : 'pointer',
              }}
            >
              {loadingAction === 'disk' ? '💾 Injection...' : '💾 Panne Disque saturé'}
            </button>

            {/* Bouton Nginx */}
            <button
              id="btn-sim-nginx"
              type="button"
              disabled={loadingAction !== null}
              onClick={(e) => {
                e.stopPropagation();
                triggerSimulation('nginx');
              }}
              className="btn btn-sm btn-secondary"
              style={{
                opacity: loadingAction ? 0.7 : 1,
                cursor: loadingAction ? 'not-allowed' : 'pointer',
              }}
            >
              {loadingAction === 'nginx' ? '🛑 Injection...' : '🛑 Nginx 502 Bad Gateway'}
            </button>

            {/* Bouton Réinitialiser */}
            <button
              id="btn-sim-reset"
              type="button"
              disabled={loadingAction !== null}
              onClick={(e) => {
                e.stopPropagation();
                triggerSimulation('reset');
              }}
              className="btn btn-sm btn-secondary"
              style={{
                marginLeft: 'auto',
                border: '1px solid var(--accent-success-border)',
                color: 'var(--accent-success)',
                backgroundColor: 'var(--accent-success-bg)',
                opacity: loadingAction ? 0.7 : 1,
                cursor: loadingAction ? 'not-allowed' : 'pointer',
              }}
            >
              {loadingAction === 'reset' ? '🔄 Réinitialisation...' : '🔄 Réinitialiser'}
            </button>
          </div>

          {/* Feedback visuel & Mesure de latence */}
          {feedback && (
            <div
              id="sim-feedback-message"
              style={{
                marginTop: '0.85rem',
                padding: '0.55rem 0.85rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.8125rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '0.75rem',
                backgroundColor:
                  feedback.type === 'success'
                    ? 'var(--accent-success-bg)'
                    : 'var(--accent-critical-bg)',
                border: `1px solid ${
                  feedback.type === 'success'
                    ? 'var(--accent-success-border)'
                    : 'var(--accent-critical-border)'
                }`,
                color:
                  feedback.type === 'success' ? 'var(--accent-success)' : 'var(--accent-critical)',
              }}
            >
              <span>{feedback.message}</span>
              {typeof feedback.durationMs === 'number' && (
                <span
                  id="sim-latency-badge"
                  style={{
                    fontSize: '0.75rem',
                    padding: '0.1rem 0.4rem',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    fontWeight: 600,
                  }}
                >
                  ⚡ Émis en {feedback.durationMs} ms
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
