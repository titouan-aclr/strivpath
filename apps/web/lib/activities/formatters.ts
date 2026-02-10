import { SportType } from '@/gql/graphql';

export function formatDistance(meters: number | null | undefined, locale: string = 'en'): string {
  if (meters == null || isNaN(meters)) return '—';

  const absMeters = Math.abs(meters);

  if (absMeters >= 1000) {
    const km = absMeters / 1000;
    return `${km.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} km`;
  }

  return `${Math.round(absMeters).toLocaleString(locale)} m`;
}

export function formatDurationFull(seconds: number | null | undefined): string {
  if (seconds == null || isNaN(seconds)) return '—';

  const absSeconds = Math.abs(Math.floor(seconds));

  if (absSeconds === 0) return '0s';

  const hours = Math.floor(absSeconds / 3600);
  const minutes = Math.floor((absSeconds % 3600) / 60);
  const secs = absSeconds % 60;

  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

  return parts.join(' ');
}

export function formatPace(
  distanceMeters: number | null | undefined,
  timeSeconds: number | null | undefined,
  sportType: SportType | string,
  locale: string = 'en',
): string {
  if (
    distanceMeters == null ||
    timeSeconds == null ||
    distanceMeters === 0 ||
    timeSeconds === 0 ||
    isNaN(distanceMeters) ||
    isNaN(timeSeconds)
  ) {
    return '—';
  }

  const typeStr = typeof sportType === 'string' ? sportType : String(sportType);
  const isRunOrSwim = typeStr === 'Run' || typeStr === 'RUN' || typeStr === 'Swim' || typeStr === 'SWIM';

  if (isRunOrSwim) {
    const distanceInKm = distanceMeters / 1000;
    const paceMinutes = timeSeconds / 60 / distanceInKm;
    const mins = Math.floor(paceMinutes);
    const secs = Math.round((paceMinutes - mins) * 60);
    return `${mins}:${secs.toString().padStart(2, '0')} min/km`;
  }

  const distanceInKm = distanceMeters / 1000;
  const timeInHours = timeSeconds / 3600;
  const speed = distanceInKm / timeInHours;
  return `${speed.toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} km/h`;
}

export function formatElevation(meters: number | null | undefined): string {
  if (meters == null || isNaN(meters)) return '—';

  const rounded = Math.round(Math.abs(meters));
  return `${rounded.toLocaleString()} m`;
}

export function formatDate(
  date: Date | string | null | undefined,
  locale: string = 'en',
  format: 'short' | 'medium' | 'long' = 'medium',
): string {
  if (date == null) return '—';

  const dateObj = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) return '—';

  const formatMap = {
    short: { year: '2-digit', month: 'numeric', day: 'numeric' },
    medium: { year: 'numeric', month: 'short', day: 'numeric' },
    long: { year: 'numeric', month: 'long', day: 'numeric' },
  } as const;

  return new Intl.DateTimeFormat(locale, formatMap[format] as Intl.DateTimeFormatOptions).format(dateObj);
}

export function formatTime(date: Date | string | null | undefined, locale: string = 'en'): string {
  if (date == null) return '—';

  const dateObj = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) return '—';

  return new Intl.DateTimeFormat(locale, {
    hour: '2-digit',
    minute: '2-digit',
  }).format(dateObj);
}

export function formatCalories(calories: number | null | undefined): string {
  if (calories == null || isNaN(calories)) return '—';
  return `${Math.round(calories).toLocaleString()} kcal`;
}

export function formatAltitudeRange(high: number | null | undefined, low: number | null | undefined): string {
  if (high == null || low == null) return '—';
  return `${Math.round(low)} m → ${Math.round(high)} m`;
}

export function formatWatts(watts: number | null | undefined): string {
  if (watts == null || isNaN(watts)) return '—';
  return `${Math.round(watts).toLocaleString()} W`;
}

export function formatSplitPace(
  split: { distance: number; movingTime: number },
  sportType: SportType | string,
  locale: string = 'en',
): string {
  return formatPace(split.distance, split.movingTime, sportType, locale);
}
