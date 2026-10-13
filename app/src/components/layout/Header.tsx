'use client';

import React from 'react';
import Link from 'next/link';
import { useSocket } from '@/hooks/useSocket';
import { useOperator } from '@/hooks/useOperator';

export function Header() {
  const { isConnected } = useSocket();
  const { operator, changeOperator, operatorsList } = useOperator();

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

        {/* Right actions: Socket indicator & Operator selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          {/* Socket Live Status */}
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

          {/* Current Operator Selector */}
          <div
            id="operator-selector-wrapper"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              padding: '0.3rem 0.75rem',
              borderRadius: 'var(--radius-md)',
            }}
          >
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Technicien :</span>
            <select
              id="active-operator-select"
              value={operator}
              aria-label="Sélectionner le technicien d'astreinte"
              onChange={(e) => changeOperator(e.target.value)}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                color: '#ffffff',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
                padding: '0 0.25rem',
              }}
            >
              {operatorsList.length > 0 ? (
                operatorsList.map((user) => (
                  <option
                    key={user._id}
                    value={user.name}
                    style={{ backgroundColor: 'var(--bg-secondary)', color: '#fff' }}
                  >
                    {user.name} {user.isOnDuty ? '(De garde)' : ''}
                  </option>
                ))
              ) : (
                <>
                  <option
                    value="Théo"
                    style={{ backgroundColor: 'var(--bg-secondary)', color: '#fff' }}
                  >
                    Théo (Astreinte)
                  </option>
                  <option
                    value="Sarah"
                    style={{ backgroundColor: 'var(--bg-secondary)', color: '#fff' }}
                  >
                    Sarah (Astreinte)
                  </option>
                  <option
                    value="Alexandre"
                    style={{ backgroundColor: 'var(--bg-secondary)', color: '#fff' }}
                  >
                    Alexandre (Astreinte)
                  </option>
                </>
              )}
            </select>
          </div>
        </div>
      </div>
    </header>
  );
}
