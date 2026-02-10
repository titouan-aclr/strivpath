import { SportType } from '@/gql/graphql';

export interface TrendDisplay {
  value: string;
  isPositive: boolean;
  isNeutral: boolean;
}

export function formatHeartRate(bpm: number | null | undefined): string {
  if (bpm == null || isNaN(bpm)) return '—';
  return `${Math.round(bpm)} bpm`;
}

export function formatCadence(value: number | null | undefined, sportType: SportType): string {
  if (value == null || isNaN(value)) return '—';

  const rounded = Math.round(value);
  const unit = sportType === SportType.Ride ? 'rpm' : 'spm';

  return `${rounded} ${unit}`;
}

export function formatSpeed(metersPerSecond: number | null | undefined, locale: string = 'en'): string {
  if (metersPerSecond == null || isNaN(metersPerSecond)) return '—';

  const kmh = metersPerSecond * 3.6;
  return `${kmh.toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} km/h`;
}

export function formatPaceFromSeconds(secondsPerKm: number | null | undefined, sportType: SportType): string {
  if (secondsPerKm == null || isNaN(secondsPerKm) || secondsPerKm === 0) return '—';

  if (sportType === SportType.Swim) {
    const secondsPer100m = secondsPerKm / 10;
    const mins = Math.floor(secondsPer100m / 60);
    const secs = Math.round(secondsPer100m % 60);
    return `${mins}:${secs.toString().padStart(2, '0')} /100m`;
  }

  const mins = Math.floor(secondsPerKm / 60);
  const secs = Math.round(secondsPerKm % 60);
  return `${mins}:${secs.toString().padStart(2, '0')} min/km`;
}

export function formatTrend(percentage: number | null | undefined): TrendDisplay {
  if (percentage == null || isNaN(percentage)) {
    return { value: '—', isPositive: false, isNeutral: true };
  }

  if (percentage === 0) {
    return { value: '0%', isPositive: false, isNeutral: true };
  }

  const sign = percentage > 0 ? '+' : '';
  const rounded = Math.abs(percentage) < 10 ? percentage.toFixed(1) : Math.round(percentage).toString();

  return {
    value: `${sign}${rounded}%`,
    isPositive: percentage > 0,
    isNeutral: false,
  };
}
