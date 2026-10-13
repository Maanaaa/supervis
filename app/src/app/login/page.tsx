'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!identifier.trim()) {
      setError('Veuillez saisir votre identifiant (nom ou email).');
      return;
    }
    if (!password) {
      setError('Veuillez saisir votre mot de passe.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: identifier.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || 'Identifiants invalides.');
        setIsLoading(false);
        return;
      }

      // Mémorisation locale pour mise à jour synchrone de l'opérateur dans l'UI
      if (data.user?.name) {
        try {
          localStorage.setItem('supervis_operator', data.user.name);
        } catch {
          // LocalStorage inaccessible (mode navigation privée stricte)
        }
      }

      // Redirection après connexion réussie
      window.location.href = callbackUrl;
    } catch (err) {
      console.error('Erreur réseau lors de la connexion :', err);
      setError('Impossible de joindre le serveur. Veuillez vérifier la connexion.');
      setIsLoading(false);
    }
  };

  const handleQuickFill = (name: string) => {
    setIdentifier(name);
    setPassword('admin');
    setError(null);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        background: 'radial-gradient(ellipse at top, #1e1b4b 0%, #090d16 70%)',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '440px',
          background: 'var(--bg-glass)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-lg), var(--shadow-glow)',
          padding: '2.5rem 2rem',
        }}
      >
        {/* En-tête de la modale */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '48px',
              height: '48px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--accent-primary-glow)',
              border: '1px solid var(--border-color)',
              marginBottom: '1rem',
              color: 'var(--accent-primary)',
            }}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <h1
            style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
              marginBottom: '0.5rem',
            }}
          >
            Console d&apos;Astreinte
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Identification requise pour la prise en charge des incidents (ADR-0008)
          </p>
        </div>

        {/* Message d'erreur */}
        {error && (
          <div
            role="alert"
            style={{
              marginBottom: '1.5rem',
              padding: '0.75rem 1rem',
              background: 'var(--accent-critical-bg)',
              border: '1px solid var(--accent-critical-border)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--accent-critical)',
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Formulaire de connexion */}
        <form
          onSubmit={handleLogin}
          style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
        >
          <div>
            <label
              htmlFor="identifier"
              style={{
                display: 'block',
                fontSize: '0.8125rem',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                marginBottom: '0.375rem',
              }}
            >
              Identifiant (Nom ou Email)
            </label>
            <input
              id="identifier"
              name="identifier"
              type="text"
              autoComplete="username"
              required
              autoFocus
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="ex: Théo ou theo@supervis.local"
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-primary)',
                fontSize: '0.9375rem',
                outline: 'none',
                transition: 'border-color var(--transition-fast)',
              }}
            />
          </div>

          <div>
            <label
              htmlFor="password"
              style={{
                display: 'block',
                fontSize: '0.8125rem',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                marginBottom: '0.375rem',
              }}
            >
              Mot de passe
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-primary)',
                fontSize: '0.9375rem',
                outline: 'none',
                transition: 'border-color var(--transition-fast)',
              }}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            id="btn-login"
            style={{
              width: '100%',
              padding: '0.875rem',
              marginTop: '0.5rem',
              background: 'var(--accent-primary)',
              color: '#ffffff',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.9375rem',
              fontWeight: 600,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.7 : 1,
              boxShadow: 'var(--shadow-glow)',
              transition: 'background var(--transition-fast), transform var(--transition-fast)',
            }}
          >
            {isLoading ? 'Connexion en cours...' : 'Se connecter à l’astreinte'}
          </button>
        </form>

        {/* Aide et raccourcis de démonstration (ADR-0008) */}
        <div
          style={{
            marginTop: '2rem',
            paddingTop: '1.5rem',
            borderTop: '1px solid var(--border-subtle)',
            fontSize: '0.8125rem',
            color: 'var(--text-muted)',
          }}
        >
          <div style={{ marginBottom: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
            Comptes d&apos;astreinte configurés (mot de passe :{' '}
            <code style={{ color: 'var(--accent-warning)' }}>admin</code>) :
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => handleQuickFill('Théo')}
              style={{
                padding: '0.375rem 0.75rem',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-primary)',
                fontSize: '0.75rem',
                cursor: 'pointer',
              }}
            >
              Théo (Admin)
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('Sarah')}
              style={{
                padding: '0.375rem 0.75rem',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-primary)',
                fontSize: '0.75rem',
                cursor: 'pointer',
              }}
            >
              Sarah (Astreinte)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
