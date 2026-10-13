'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorBoundary({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('[Next.js App Router ErrorBoundary] Exception capturée :', error);
  }, [error]);

  return (
    <div
      id="app-error-boundary"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        textAlign: 'center',
        padding: '2rem',
      }}
    >
      <div
        style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--accent-critical-border)',
          borderRadius: 'var(--radius-lg)',
          padding: '2.5rem',
          maxWidth: '560px',
          width: '100%',
          boxShadow: '0 0 30px rgba(244, 63, 94, 0.1)',
        }}
      >
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>

        <h2
          style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.75rem' }}
        >
          Incident d&apos;Affichage Détecté
        </h2>

        <p
          style={{
            color: 'var(--text-secondary)',
            fontSize: '0.95rem',
            marginBottom: '1.5rem',
            lineHeight: 1.5,
          }}
        >
          Une erreur inattendue est survenue lors du rendu de cette vue. L&apos;incident a été
          consigné dans la console applicative.
        </p>

        {error.message && (
          <div
            style={{
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.75rem',
              fontFamily: 'monospace',
              fontSize: '0.8rem',
              color: 'var(--accent-critical)',
              marginBottom: '1.5rem',
              textAlign: 'left',
              wordBreak: 'break-word',
            }}
          >
            {error.message}
          </div>
        )}

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
          <button id="btn-error-retry" className="btn btn-primary" onClick={() => reset()}>
            🔄 Réessayer le chargement
          </button>
          <Link href="/" className="btn btn-secondary">
            🏠 Retour au Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
