import React from 'react';

export default function Loading() {
  return (
    <div
      id="global-loading-indicator"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
        animation: 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }}
    >
      {/* Skeleton En-tête de page */}
      <div>
        <div
          style={{
            height: '2rem',
            width: '280px',
            backgroundColor: 'var(--bg-card)',
            borderRadius: 'var(--radius-md)',
            marginBottom: '0.75rem',
            border: '1px solid var(--border-color)',
          }}
        />
        <div
          style={{
            height: '1rem',
            width: '450px',
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-sm)',
          }}
        />
      </div>

      {/* Skeleton Cartes de métriques */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem',
        }}
      >
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            style={{
              height: '90px',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              padding: '1.25rem',
            }}
          />
        ))}
      </div>

      {/* Skeleton Lignes de contenu */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              height: '110px',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
            }}
          />
        ))}
      </div>
    </div>
  );
}
