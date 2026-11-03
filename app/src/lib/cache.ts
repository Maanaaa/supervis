interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const memoryCache = new Map<string, CacheEntry<unknown>>();

/**
 * Récupère une entrée du cache mémoire si elle n'a pas expiré.
 */
export function getCached<T>(key: string): T | null {
  const entry = memoryCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    memoryCache.delete(key);
    return null;
  }
  return entry.data as T;
}

/**
 * Enregistre une valeur dans le cache avec un TTL en millisecondes (défaut: 1500ms).
 */
export function setCached<T>(key: string, data: T, ttlMs = 1500): void {
  if (memoryCache.size > 500) {
    const firstKey = memoryCache.keys().next().value;
    if (firstKey) memoryCache.delete(firstKey);
  }
  memoryCache.set(key, { data, expiresAt: Date.now() + ttlMs });
}

/**
 * Invalide les entrées du cache commençant par un préfixe donné (ou tout le cache).
 */
export function invalidateCache(prefix?: string): void {
  if (!prefix) {
    memoryCache.clear();
    return;
  }
  for (const key of Array.from(memoryCache.keys())) {
    if (key.startsWith(prefix)) {
      memoryCache.delete(key);
    }
  }
}
