'use client';

import { useState, useEffect } from 'react';
import type { IUser } from '@/types/user';

const STORAGE_KEY = 'supervis_current_operator';
const DEFAULT_OPERATOR = 'Théo';

export function useOperator() {
  const [operator, setOperator] = useState<string>(DEFAULT_OPERATOR);
  const [operatorsList, setOperatorsList] = useState<IUser[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialisation depuis localStorage
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

  // Chargement de l'annuaire des techniciens
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

  return {
    operator,
    changeOperator,
    operatorsList,
    isLoading,
  };
}
