'use client';

import React, { useState, useEffect } from 'react';
import type { IAlert, AlertSeverity } from '@/types/alert';
import type { IServer } from '@/types/server';
import { useSocket } from '@/hooks/useSocket';
import { useOperator } from '@/hooks/useOperator';
import { AlertCard } from './AlertCard';
import { MetricBanner } from '../layout/MetricBanner';
import { SimulationPanel } from './SimulationPanel';

interface AlertListProps {
  initialAlerts: IAlert[];
  initialServers?: IServer[];
}

export function AlertList({ initialAlerts, initialServers = [] }: AlertListProps) {
  const [alerts, setAlerts] = useState<IAlert[]>(initialAlerts);
  const [servers, setServers] = useState<IServer[]>(initialServers);
  const [activeFilter, setActiveFilter] = useState<'ALL' | AlertSeverity | 'MINE'>('ALL');

  const { socket } = useSocket();
  const { operator, operatorsList } = useOperator();

  // Écoute des événements Socket.IO
  useEffect(() => {
    if (!socket) return;

    // 1. Nouvelle alerte en temps réel
    const handleAlertNew = (newAlert: IAlert) => {
      setAlerts((prev) => {
        // Éviter les doublons
        if (prev.some((a) => a._id === newAlert._id)) {
          return prev;
        }
        return [newAlert, ...prev];
      });
    };

    // 2. Mise à jour d'alerte (ACK, TRANSFER, RESOLVE)
    const handleAlertUpdated = (updatedAlert: IAlert) => {
      setAlerts((prev) => {
        // Si résolue, on la retire de la vue active
        if (updatedAlert.status === 'RESOLVED') {
          return prev.filter((a) => a._id !== updatedAlert._id);
        }

        // Sinon on remplace l'élément dans la liste
        return prev.map((a) => (a._id === updatedAlert._id ? updatedAlert : a));
      });
    };

    // 3. Changement de statut serveur
    const handleServerStatusChange = (updatedServer: IServer) => {
      setServers((prev) => {
        const index = prev.findIndex((s) => s._id === updatedServer._id);
        if (index >= 0) {
          const clone = [...prev];
          clone[index] = updatedServer;
          return clone;
        }
        return [...prev, updatedServer];
      });
    };

    socket.on('alert:new', handleAlertNew);
    socket.on('alert:updated', handleAlertUpdated);
    socket.on('server:status_change', handleServerStatusChange);

    return () => {
      socket.off('alert:new', handleAlertNew);
      socket.off('alert:updated', handleAlertUpdated);
      socket.off('server:status_change', handleServerStatusChange);
    };
  }, [socket]);

  // Filtrage des alertes
  const filteredAlerts = alerts.filter((alert) => {
    if (activeFilter === 'ALL') return true;
    if (activeFilter === 'MINE') return alert.assignedTo === operator;
    return alert.severity === activeFilter;
  });

  return (
    <div id="alert-list-container">
      {/* Panneau de simulation et de chaos testing */}
      <SimulationPanel />

      {/* Bannière de compteurs réactifs */}
      <MetricBanner alerts={alerts} servers={servers} />

      {/* Barre de filtres et d'état */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            id="filter-all"
            className={`btn btn-sm ${activeFilter === 'ALL' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveFilter('ALL')}
          >
            Toutes ({alerts.length})
          </button>
          <button
            id="filter-critical"
            className={`btn btn-sm ${activeFilter === 'CRITICAL' ? 'btn-danger' : 'btn-secondary'}`}
            onClick={() => setActiveFilter('CRITICAL')}
          >
            🔴 Critiques ({alerts.filter((a) => a.severity === 'CRITICAL').length})
          </button>
          <button
            id="filter-warning"
            className={`btn btn-sm ${activeFilter === 'WARNING' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveFilter('WARNING')}
          >
            🟠 Avertissements ({alerts.filter((a) => a.severity === 'WARNING').length})
          </button>
          <button
            id="filter-mine"
            className={`btn btn-sm ${activeFilter === 'MINE' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveFilter('MINE')}
          >
            👤 Mes tickets ({alerts.filter((a) => a.assignedTo === operator).length})
          </button>
        </div>

        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          {filteredAlerts.length} incident{filteredAlerts.length > 1 ? 's' : ''} affiché
          {filteredAlerts.length > 1 ? 's' : ''}
        </div>
      </div>

      {/* Liste des alertes actives */}
      {filteredAlerts.length > 0 ? (
        <div id="alerts-grid">
          {filteredAlerts.map((alert) => (
            <AlertCard
              key={alert._id}
              alert={alert}
              currentOperator={operator}
              operatorsList={operatorsList}
              onAlertUpdated={(updated) => {
                setAlerts((prev) => {
                  if (updated.status === 'RESOLVED') {
                    return prev.filter((a) => a._id !== updated._id);
                  }
                  return prev.map((a) => (a._id === updated._id ? updated : a));
                });
              }}
            />
          ))}
        </div>
      ) : (
        /* État vide rassurant */
        <div
          id="alerts-empty-state"
          style={{
            textAlign: 'center',
            padding: '4rem 2rem',
            backgroundColor: 'var(--bg-card)',
            border: '1px dashed var(--border-color)',
            borderRadius: 'var(--radius-lg)',
          }}
        >
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🎉</div>
          <h3
            style={{
              fontSize: '1.25rem',
              fontWeight: 600,
              marginBottom: '0.5rem',
              color: '#ffffff',
            }}
          >
            Aucun incident en cours
          </h3>
          <p
            style={{
              color: 'var(--text-secondary)',
              maxWidth: '450px',
              margin: '0 auto',
              fontSize: '0.9rem',
            }}
          >
            Tous les systèmes surveillés fonctionnent normalement. Les nouvelles alertes
            apparaîtront ici instantanément dès leur détection.
          </p>
        </div>
      )}
    </div>
  );
}
