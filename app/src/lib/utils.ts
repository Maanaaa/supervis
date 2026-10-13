/**
 * Formate une date en chaîne lisible avec heure (ex: "13 oct. 08:30:15").
 */
export function formatDateTime(date: Date | string | undefined): string {
  if (!date) return '—';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '—';

  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(d);
}

/**
 * Calcule le temps écoulé relatif (ex: "il y a 4 min", "à l'instant").
 */
export function formatRelativeTime(date: Date | string | undefined): string {
  if (!date) return '—';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '—';

  const diffMs = Date.now() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 10) return "à l'instant";
  if (diffSec < 60) return `il y a ${diffSec}s`;

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `il y a ${diffMin} min`;

  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `il y a ${diffHours}h`;

  const diffDays = Math.floor(diffHours / 24);
  return `il y a ${diffDays}j`;
}

/**
 * Calcule la durée entre deux dates (MTTR — Mean Time To Recover).
 */
export function formatDuration(
  startDate: Date | string | undefined,
  endDate: Date | string | undefined
): string {
  if (!startDate || !endDate) return '—';
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;

  if (isNaN(start.getTime()) || isNaN(end.getTime())) return '—';

  const diffMs = Math.max(0, end.getTime() - start.getTime());
  const totalSeconds = Math.floor(diffMs / 1000);

  if (totalSeconds < 60) {
    return `${totalSeconds}s`;
  }

  const minutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = totalSeconds % 60;

  if (minutes < 60) {
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
}

/**
 * Calcule la moyenne de durée (MTTR moyen) pour une liste d'alertes résolues.
 */
export function calculateMTTR(
  alerts: Array<{ createdAt?: Date | string; resolvedAt?: Date | string }>
): string {
  const validDurations = alerts
    .filter((a) => a.createdAt && a.resolvedAt)
    .map((a) => {
      const start = new Date(a.createdAt!).getTime();
      const end = new Date(a.resolvedAt!).getTime();
      return Math.max(0, end - start);
    });

  if (validDurations.length === 0) return '0s';

  const avgMs = validDurations.reduce((acc, curr) => acc + curr, 0) / validDurations.length;
  const totalSeconds = Math.round(avgMs / 1000);

  if (totalSeconds < 60) return `${totalSeconds}s`;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes < 60) return `${minutes}m ${seconds}s`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m`;
}
