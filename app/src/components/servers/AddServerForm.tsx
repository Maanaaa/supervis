'use client';

import React, { useState } from 'react';
import type { IServer } from '@/types/server';

interface AddServerFormProps {
  onServerAdded: (server: IServer) => void;
  onCancel?: () => void;
}

export function AddServerForm({ onServerAdded, onCancel }: AddServerFormProps) {
  const [name, setName] = useState('');
  const [host, setHost] = useState('');
  const [port, setPort] = useState(80);
  const [healthUrl, setHealthUrl] = useState('/health');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/servers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          host: host.trim(),
          port: Number(port),
          healthUrl: healthUrl.trim() || '/health',
          description: description.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok && data.server) {
        onServerAdded(data.server);
        setName('');
        setHost('');
        setPort(80);
        setHealthUrl('/health');
        setDescription('');
      } else {
        setErrorMessage(data.error || 'Erreur lors de l’enregistrement du serveur.');
      }
    } catch {
      setErrorMessage('Erreur réseau lors de la communication avec le serveur.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      id="add-server-form"
      onSubmit={handleSubmit}
      style={{
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md)',
        padding: '1.5rem',
        marginBottom: '2rem',
      }}
    >
      <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1rem', color: '#ffffff' }}>
        ➕ Enregistrer une nouvelle machine à surveiller
      </h3>

      {errorMessage && (
        <div
          style={{
            padding: '0.65rem 0.85rem',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'var(--accent-critical-bg)',
            border: '1px solid var(--accent-critical-border)',
            color: 'var(--accent-critical)',
            fontSize: '0.85rem',
            marginBottom: '1rem',
          }}
        >
          ⚠️ {errorMessage}
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem',
          marginBottom: '1rem',
        }}
      >
        <div>
          <label
            style={{
              display: 'block',
              fontSize: '0.8rem',
              color: 'var(--text-secondary)',
              marginBottom: '0.35rem',
            }}
          >
            Nom du serveur *
          </label>
          <input
            id="server-name-input"
            type="text"
            placeholder="Ex: Serveur Web Nginx Prod"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            style={{ width: '100%' }}
          />
        </div>

        <div>
          <label
            style={{
              display: 'block',
              fontSize: '0.8rem',
              color: 'var(--text-secondary)',
              marginBottom: '0.35rem',
            }}
          >
            Hôte ou IP *
          </label>
          <input
            id="server-host-input"
            type="text"
            placeholder="Ex: 192.168.1.10 ou web.domaine.fr"
            value={host}
            onChange={(e) => setHost(e.target.value)}
            required
            style={{ width: '100%' }}
          />
        </div>

        <div>
          <label
            style={{
              display: 'block',
              fontSize: '0.8rem',
              color: 'var(--text-secondary)',
              marginBottom: '0.35rem',
            }}
          >
            Port *
          </label>
          <input
            id="server-port-input"
            type="number"
            min={1}
            max={65535}
            value={port}
            onChange={(e) => setPort(Number(e.target.value))}
            required
            style={{ width: '100%' }}
          />
        </div>

        <div>
          <label
            style={{
              display: 'block',
              fontSize: '0.8rem',
              color: 'var(--text-secondary)',
              marginBottom: '0.35rem',
            }}
          >
            Chemin ou URL de Health Check
          </label>
          <input
            id="server-health-input"
            type="text"
            placeholder="/health"
            value={healthUrl}
            onChange={(e) => setHealthUrl(e.target.value)}
            style={{ width: '100%' }}
          />
        </div>
      </div>

      <div style={{ marginBottom: '1.25rem' }}>
        <label
          style={{
            display: 'block',
            fontSize: '0.8rem',
            color: 'var(--text-secondary)',
            marginBottom: '0.35rem',
          }}
        >
          Description fonctionnelle
        </label>
        <input
          id="server-description-input"
          type="text"
          placeholder="Ex: Cluster de cache Redis pour l'application e-commerce"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          style={{ width: '100%' }}
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
        {onCancel && (
          <button type="button" className="btn btn-secondary" onClick={onCancel}>
            Annuler
          </button>
        )}
        <button
          id="btn-submit-server"
          type="submit"
          className="btn btn-primary"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Enregistrement...' : 'Enregistrer la machine'}
        </button>
      </div>
    </form>
  );
}
