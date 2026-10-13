'use client';

import { useState, useEffect, useCallback } from 'react';
import type { IUser, ISessionPayload } from '@/types/user';

const STORAGE_KEY = 'supervis_current_operator';
const DEFAULT_OPERATOR = 'Théo';

export function useOperator() {
  const [operator, setOperator] = useState<string>(DEFAULT_OPERATOR);
  const [sessionUser, setSessionUser] = useState<ISessionPayload | null>(null);
  const [operatorsList, setOperatorsList] = useState<IUser[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialisation depuis localStorage (pour affichage immédiat sans saut de rendu)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && saved.trim()) {
        setOperator(saved.trim());
      }
    } catch {
      // Ignorer si localStorage indisponible
    }
  }, []);

  // Synchronisation avec la session active (/api/auth/me)
  useEffect(() => {
    let isMounted = true;

    async function fetchMe() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.user) {
            setSessionUser(data.user);
            setOperator(data.user.name);
            try {
              localStorage.setItem(STORAGE_KEY, data.user.name);
            } catch {
              // Ignorer
            }
          }
        }
      } catch {
        // Mode hors ligne
      }
    }

    fetchMe();

    return () => {
      isMounted = false;
    };
  }, []);

  // Chargement de l'annuaire des techniciens (pour la passation / transfert d'alertes)
  useEffect(() => {
    let isMounted = true;

    async function fetchUsers() {
      try {
        const res = await fetch('/api/users');
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.users) {
            setOperatorsList(data.users);
          }
        }
      } catch {
        // Mode hors ligne / silence
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    fetchUsers();

    return () => {
      isMounted = false;
    };
  }, []);

  const changeOperator = (newOperator: string) => {
    const cleanName = newOperator.trim();
    if (cleanName) {
      setOperator(cleanName);
      try {
        localStorage.setItem(STORAGE_KEY, cleanName);
      } catch {
        // Ignorer
      }
    }
  };

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // Ignorer
    }
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignorer
    }
    window.location.href = '/login';
  }, []);

  return {
    operator,
    sessionUser,
    changeOperator,
    logout,
    operatorsList,
    isLoading,
  };
}
