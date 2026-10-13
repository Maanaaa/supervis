'use client';

import React from 'react';
import './globals.css';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  return (
    <html lang="fr">
      <body
        style={{
          backgroundColor: '#090d16',
          color: '#f8fafc',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          padding: '2rem',
        }}
      >
        <div
          style={{
            backgroundColor: '#141e33',
            border: '1px solid #f43f5e',
            borderRadius: '16px',
            padding: '2.5rem',
            maxWidth: '540px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💥</div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.75rem' }}>
            Erreur Critique Globale
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            Une défaillance a empêché le chargement du layout principal de l&apos;application.
          </p>
          {error.message && (
            <div
              style={{
                backgroundColor: '#0f172a',
                padding: '0.75rem',
                borderRadius: '6px',
                fontSize: '0.8rem',
                color: '#f43f5e',
                fontFamily: 'monospace',
                marginBottom: '1.5rem',
                textAlign: 'left',
              }}
            >
              {error.message}
            </div>
          )}
          <button
            onClick={() => reset()}
            style={{
              backgroundColor: '#6366f1',
              color: '#ffffff',
              border: 'none',
              padding: '0.65rem 1.25rem',
              borderRadius: '6px',
              fontSize: '0.9rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            🔄 Relancer l&apos;application
          </button>
        </div>
      </body>
    </html>
  );
}
