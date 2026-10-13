'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSocket } from '@/hooks/useSocket';
import { useOperator } from '@/hooks/useOperator';

export function Header() {
  const pathname = usePathname();
  const { isConnected } = useSocket();
  const { operator, sessionUser, logout } = useOperator();

  if (pathname === '/login') {
    return null;
  }

  return (
    <header
      id="main-header"
      style={{
        borderBottom: '1px solid var(--border-color)',
        backgroundColor: 'var(--bg-secondary)',
        backdropFilter: 'blur(12px)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
    >
      <div
        className="container"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '4rem',
        }}
      >
        {/* Brand / Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link
            href="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              fontWeight: 800,
              fontSize: '1.25rem',
              letterSpacing: '-0.02em',
            }}
          >
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)',
                color: '#ffffff',
                boxShadow: '0 0 12px var(--accent-primary-glow)',
              }}
            >
              ⚡
            </span>
            <span>SUPERVIS</span>
            <span
              style={{
                fontSize: '0.7rem',
                padding: '0.15rem 0.45rem',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'rgba(99, 102, 241, 0.15)',
                color: 'var(--accent-primary)',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                fontWeight: 600,
              }}
            >
              ASTREINTE
            </span>
          </Link>
        </div>

        {/* Actions de droite : Statut WebSockets + Profil connecté + Déconnexion */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {/* Indicateur flux temps réel */}
          <div
            id="socket-status-indicator"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.3rem 0.75rem',
              borderRadius: 'var(--radius-full)',
              backgroundColor: isConnected
                ? 'var(--accent-success-bg)'
                : 'rgba(245, 158, 11, 0.15)',
              border: `1px solid ${
                isConnected ? 'var(--accent-success-border)' : 'var(--accent-warning-border)'
              }`,
              fontSize: '0.75rem',
              fontWeight: 600,
              color: isConnected ? 'var(--accent-success)' : 'var(--accent-warning)',
            }}
          >
            <span
              className={`pulse-dot ${isConnected ? 'pulse-dot-success' : 'pulse-dot-warning'}`}
            />
            <span>{isConnected ? 'FLUX TEMPS RÉEL' : 'RECONNEXION...'}</span>
          </div>

          {/* Badge opérateur connecté */}
          <div
            id="operator-profile-badge"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              padding: '0.35rem 0.75rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.8125rem',
            }}
          >
            <div
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: 'var(--accent-primary)',
              }}
            />
            <span style={{ color: 'var(--text-secondary)' }}>Opérateur :</span>
            <strong style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{operator}</strong>
            {sessionUser?.role && (
              <span
                style={{
                  fontSize: '0.6875rem',
                  padding: '0.1rem 0.4rem',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: 'rgba(99, 102, 241, 0.15)',
                  color: 'var(--accent-primary)',
                  fontWeight: 600,
                  border: '1px solid rgba(99, 102, 241, 0.3)',
                }}
              >
                {sessionUser.role}
              </span>
            )}
          </div>

          {/* Bouton Déconnexion */}
          <button
            id="btn-logout"
            onClick={logout}
            title="Se déconnecter"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.35rem 0.75rem',
              background: 'transparent',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-secondary)',
              fontSize: '0.8125rem',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all var(--transition-fast)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--accent-critical)';
              e.currentTarget.style.color = 'var(--accent-critical)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-color)';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span>Déconnexion</span>
          </button>
        </div>
      </div>
    </header>
  );
}
