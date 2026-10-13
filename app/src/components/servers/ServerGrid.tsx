'use client';

import React, { useState, useEffect } from 'react';
import type { IServer } from '@/types/server';
import { useSocket } from '@/hooks/useSocket';
import { ServerCard } from './ServerCard';
import { AddServerForm } from './AddServerForm';

interface ServerGridProps {
  initialServers: IServer[];
}

export function ServerGrid({ initialServers }: ServerGridProps) {
  const [servers, setServers] = useState<IServer[]>(initialServers);
  const [showAddForm, setShowAddForm] = useState(false);
  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return;

    const handleStatusChange = (updatedServer: IServer) => {
      setServers((prev) => {
        const index = prev.findIndex((s) => s._id === updatedServer._id);
        if (index >= 0) {
          const clone = [...prev];
          clone[index] = updatedServer;
          return clone;
        }
        return [updatedServer, ...prev];
      });
    };

    const handleServerDeleted = ({ serverId }: { serverId: string }) => {
      setServers((prev) => prev.filter((s) => s._id !== serverId));
    };

    socket.on('server:status_change', handleStatusChange);
    socket.on('server:deleted', handleServerDeleted);

    return () => {
      socket.off('server:status_change', handleStatusChange);
      socket.off('server:deleted', handleServerDeleted);
    };
  }, [socket]);

  return (
    <div id="servers-view-container">
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#ffffff' }}>
            Parc de Machines Surveillées
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Vérification de disponibilité HTTP toutes les 5 minutes avec alerte immédiate.
          </p>
        </div>

        <button
          id="btn-toggle-add-server"
          className="btn btn-primary"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          {showAddForm ? '✕ Fermer le formulaire' : '➕ Ajouter un serveur'}
        </button>
      </div>

      {showAddForm && (
        <AddServerForm
          onServerAdded={(newServer) => {
            setServers((prev) => [newServer, ...prev]);
            setShowAddForm(false);
          }}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      {servers.length > 0 ? (
        <div
          id="servers-grid-cards"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '1.25rem',
          }}
        >
          {servers.map((server) => (
            <ServerCard
              key={server._id}
              server={server}
              onDeleted={(id) => setServers((prev) => prev.filter((s) => s._id !== id))}
            />
          ))}
        </div>
      ) : (
        <div
          id="servers-empty-state"
          style={{
            textAlign: 'center',
            padding: '4rem 2rem',
            backgroundColor: 'var(--bg-card)',
            border: '1px dashed var(--border-color)',
            borderRadius: 'var(--radius-lg)',
          }}
        >
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🌐</div>
          <h3
            style={{
              fontSize: '1.25rem',
              fontWeight: 600,
              marginBottom: '0.5rem',
              color: '#ffffff',
            }}
          >
            Aucun serveur enregistré pour le moment
          </h3>
          <p
            style={{
              color: 'var(--text-secondary)',
              maxWidth: '450px',
              margin: '0 auto 1.5rem auto',
              fontSize: '0.9rem',
            }}
          >
            Ajoutez votre premier serveur pour lancer la surveillance périodique automatique.
          </p>
          <button className="btn btn-primary" onClick={() => setShowAddForm(true)}>
            ➕ Ajouter un premier serveur
          </button>
        </div>
      )}
    </div>
  );
}
