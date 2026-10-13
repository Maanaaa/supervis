'use client';

import React, { useState } from 'react';
import type { IAlert } from '@/types/alert';
import type { IUser } from '@/types/user';
import { formatRelativeTime } from '@/lib/utils';

interface AlertCardProps {
  alert: IAlert;
  currentOperator: string;
  operatorsList: IUser[];
  onAlertUpdated?: (updated: IAlert) => void;
}

export function AlertCard({
  alert,
  currentOperator,
  operatorsList,
  onAlertUpdated,
}: AlertCardProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [showResolve, setShowResolve] = useState(false);
  const [targetOperator, setTargetOperator] = useState('');
  const [resolutionComment, setResolutionComment] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const isAssignedToMe = alert.assignedTo === currentOperator;

  // 1. Prise en charge en 1 clic (ACK atomique)
  const handleAcknowledge = async () => {
    setIsSubmitting(true);
    setFeedbackMessage(null);
    try {
      const res = await fetch(`/api/alerts/${alert._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ACK',
          operator: currentOperator,
        }),
      });

      const data = await res.json();
      if (res.ok && data.alert) {
        onAlertUpdated?.(data.alert);
      } else if (res.status === 409) {
        // Concurrence : alerte déjà prise par un collègue
        setFeedbackMessage(data.error || 'Alerte déjà prise par un autre opérateur.');
        if (data.assignedTo) {
          onAlertUpdated?.({
            ...alert,
            status: 'ACK',
            assignedTo: data.assignedTo,
          });
        }
      } else {
        setFeedbackMessage(data.error || 'Erreur lors de la prise de ticket.');
      }
    } catch {
      setFeedbackMessage('Erreur de connexion au serveur.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2. Transfert / Délégation
  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetOperator || targetOperator === currentOperator) return;

    setIsSubmitting(true);
    setFeedbackMessage(null);
    try {
      const res = await fetch(`/api/alerts/${alert._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'TRANSFER',
          currentOperator,
          targetOperator,
        }),
      });

      const data = await res.json();
      if (res.ok && data.alert) {
        setShowTransfer(false);
        onAlertUpdated?.(data.alert);
      } else {
        setFeedbackMessage(data.error || 'Échec du transfert.');
      }
    } catch {
      setFeedbackMessage('Erreur de connexion.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. Résolution
  const handleResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFeedbackMessage(null);
    try {
      const res = await fetch(`/api/alerts/${alert._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'RESOLVE',
          resolutionComment: resolutionComment.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok && data.alert) {
        setShowResolve(false);
        onAlertUpdated?.(data.alert);
      } else {
        setFeedbackMessage(data.error || 'Échec de la résolution.');
      }
    } catch {
      setFeedbackMessage('Erreur de connexion.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSeverityBadge = () => {
    switch (alert.severity) {
      case 'CRITICAL':
        return <span className="badge badge-critical">CRITIQUE</span>;
      case 'WARNING':
        return <span className="badge badge-warning">AVERTISSEMENT</span>;
      default:
        return <span className="badge badge-info">INFO</span>;
    }
  };

  const borderStyle =
    alert.severity === 'CRITICAL'
      ? 'var(--accent-critical-border)'
      : alert.severity === 'WARNING'
        ? 'var(--accent-warning-border)'
        : 'var(--border-color)';

  return (
    <article
      id={`alert-card-${alert._id}`}
      style={{
        backgroundColor: 'var(--bg-card)',
        border: `1px solid ${borderStyle}`,
        borderRadius: 'var(--radius-md)',
        padding: '1.25rem',
        marginBottom: '1rem',
        boxShadow: alert.severity === 'CRITICAL' ? '0 0 15px rgba(244, 63, 94, 0.08)' : 'none',
        transition: 'transform var(--transition-fast), border-color var(--transition-fast)',
      }}
    >
      {/* Haut de carte : Sévérité, Machine source et Horodatage */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
          marginBottom: '0.75rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          {getSeverityBadge()}
          <span
            style={{
              fontWeight: 700,
              color: 'var(--text-primary)',
              fontSize: '0.95rem',
            }}
          >
            🖥️ {alert.serverName}
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.8rem',
            color: 'var(--text-muted)',
          }}
        >
          <span>🕒 {formatRelativeTime(alert.createdAt)}</span>
          {alert.status === 'ACK' && (
            <span
              className="badge"
              style={{
                backgroundColor: 'rgba(99, 102, 241, 0.15)',
                color: 'var(--accent-primary)',
                border: '1px solid rgba(99, 102, 241, 0.3)',
              }}
            >
              EN COURS : {alert.assignedTo}
            </span>
          )}
        </div>
      </div>

      {/* Titre et Message */}
      <h3
        style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.35rem', color: '#ffffff' }}
      >
        {alert.title}
      </h3>
      <p
        style={{
          color: 'var(--text-secondary)',
          fontSize: '0.9rem',
          marginBottom: '1rem',
          lineHeight: 1.5,
        }}
      >
        {alert.message}
      </p>

      {/* Message informatif / retour concurrence */}
      {feedbackMessage && (
        <div
          style={{
            padding: '0.5rem 0.75rem',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'rgba(245, 158, 11, 0.15)',
            border: '1px solid var(--accent-warning-border)',
            color: 'var(--accent-warning)',
            fontSize: '0.85rem',
            marginBottom: '0.85rem',
          }}
        >
          ℹ️ {feedbackMessage}
        </div>
      )}

      {/* Historique des délégations si applicable */}
      {alert.transferredFrom && alert.transferredFrom.length > 0 && (
        <div
          style={{
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
            marginBottom: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
          }}
        >
          <span>🔄 Transféré depuis :</span>
          <span>{alert.transferredFrom.join(' ➔ ')}</span>
        </div>
      )}

      {/* Panneau d'actions selon le statut */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
          paddingTop: '0.75rem',
          borderTop: '1px solid var(--border-subtle)',
        }}
      >
        {alert.status === 'OPEN' ? (
          /* ACTION OPEN -> ACK en 1 clic */
          <button
            id={`btn-ack-${alert._id}`}
            className="btn btn-primary"
            onClick={handleAcknowledge}
            disabled={isSubmitting}
            style={{ fontWeight: 600 }}
          >
            ⚡ {isSubmitting ? 'Prise en charge...' : 'Prendre en charge (1 clic)'}
          </button>
        ) : (
          /* ACTION ACK : Détenteur ou Consultation */
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              width: '100%',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Pris en charge par <strong style={{ color: '#fff' }}>{alert.assignedTo}</strong>
            </div>

            {isAssignedToMe ? (
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  id={`btn-transfer-${alert._id}`}
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    setShowTransfer(!showTransfer);
                    setShowResolve(false);
                  }}
                >
                  🔄 Passer la main
                </button>
                <button
                  id={`btn-resolve-${alert._id}`}
                  className="btn btn-danger btn-sm"
                  onClick={() => {
                    setShowResolve(!showResolve);
                    setShowTransfer(false);
                  }}
                >
                  ✅ Résoudre
                </button>
              </div>
            ) : (
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                🔒 Verrouillé par le technicien détenteur
              </span>
            )}
          </div>
        )}
      </div>

      {/* Formulaire rétractable de Transfert */}
      {showTransfer && isAssignedToMe && (
        <form
          onSubmit={handleTransfer}
          style={{
            marginTop: '1rem',
            padding: '0.75rem',
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-color)',
            display: 'flex',
            gap: '0.5rem',
            alignItems: 'center',
          }}
        >
          <select
            id={`select-transfer-target-${alert._id}`}
            aria-label="Sélectionner le technicien cible pour le transfert"
            value={targetOperator}
            onChange={(e) => setTargetOperator(e.target.value)}
            required
            style={{ flex: 1 }}
          >
            <option value="">Choisir le technicien cible...</option>
            {operatorsList
              .filter((u) => u.name !== currentOperator)
              .map((u) => (
                <option key={u._id} value={u.name}>
                  {u.name} {u.isOnDuty ? '(De garde)' : ''}
                </option>
              ))}
            {/* Fallback noms si annuaire vide */}
            {operatorsList.length === 0 && (
              <>
                <option value="Sarah">Sarah</option>
                <option value="Alexandre">Alexandre</option>
                <option value="Théo">Théo</option>
              </>
            )}
          </select>
          <button
            type="submit"
            className="btn btn-primary btn-sm"
            disabled={isSubmitting || !targetOperator}
          >
            Confirmer le transfert
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setShowTransfer(false)}
          >
            Annuler
          </button>
        </form>
      )}

      {/* Formulaire rétractable de Résolution */}
      {showResolve && isAssignedToMe && (
        <form
          onSubmit={handleResolve}
          style={{
            marginTop: '1rem',
            padding: '0.75rem',
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
          }}
        >
          <textarea
            id={`textarea-resolve-comment-${alert._id}`}
            placeholder="Commentaire de résolution (optionnel, ex: service redémarré, cache vidé...)"
            value={resolutionComment}
            onChange={(e) => setResolutionComment(e.target.value)}
            rows={2}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setShowResolve(false)}
            >
              Annuler
            </button>
            <button type="submit" className="btn btn-danger btn-sm" disabled={isSubmitting}>
              Clôturer l&apos;incident
            </button>
          </div>
        </form>
      )}
    </article>
  );
}
