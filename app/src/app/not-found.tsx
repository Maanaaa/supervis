import React from 'react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div
      id="not-found-view"
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
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          padding: '3rem 2rem',
          maxWidth: '520px',
          width: '100%',
        }}
      >
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
        <h2
          style={{ fontSize: '1.75rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.5rem' }}
        >
          Page ou Ressource Introuvable (404)
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
          La ressource demandée (machine ou alerte) n&apos;existe pas ou a été supprimée du système.
        </p>
        <Link href="/" className="btn btn-primary">
          🏠 Revenir au tableau de bord
        </Link>
      </div>
    </div>
  );
}
