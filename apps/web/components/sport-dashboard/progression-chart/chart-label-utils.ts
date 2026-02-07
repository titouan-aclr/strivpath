import { IntervalType, ProgressionMetric, type SportType } from '@/gql/graphql';
import { formatDurationCompact } from '@/lib/dashboard/utils';
import { formatPaceFromSeconds, formatSpeed } from '@/lib/sports/formatters';

export function getIntervalLabel(index: number, intervalType: IntervalType, locale: string = 'en'): string {
  switch (intervalType) {
    case IntervalType.Week:
      return `W${index}`;
    case IntervalType.Month: {
      const date = new Date(2024, index, 1);
      return new Intl.DateTimeFormat(locale, { month: 'short' }).format(date);
    }
    default:
      return String(index);
  }
}

export function formatProgressionValue(
  value: number | null | undefined,
  metric: ProgressionMetric,
  locale: string,
  sportType: SportType,
): string {
  if (value == null || isNaN(value)) return '—';

  switch (metric) {
    case ProgressionMetric.Distance:
      return `${(value / 1000).toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} km`;
    case ProgressionMetric.Duration:
      return formatDurationCompact(value);
    case ProgressionMetric.Pace:
      return formatPaceFromSeconds(value, sportType);
    case ProgressionMetric.Speed:
      return formatSpeed(value, locale);
    case ProgressionMetric.Sessions:
      return `${Math.round(value)}`;
    case ProgressionMetric.Elevation:
      return `${Math.round(value)} m`;
    default:
      return String(value);
  }
}

export function formatProgressionYAxis(value: number, metric: ProgressionMetric): string {
  switch (metric) {
    case ProgressionMetric.Distance:
      return (value / 1000).toFixed(0);
    case ProgressionMetric.Duration: {
      const hours = Math.floor(value / 3600);
      const minutes = Math.floor((value % 3600) / 60);
      return hours > 0 ? `${hours}h` : `${minutes}m`;
    }
    case ProgressionMetric.Pace: {
      const mins = Math.floor(value / 60);
      const secs = Math.round(value % 60);
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    case ProgressionMetric.Speed:
      return (value * 3.6).toFixed(0);
    case ProgressionMetric.Sessions:
      return Math.round(value).toString();
    case ProgressionMetric.Elevation:
      return Math.round(value).toString();
    default:
      return String(value);
  }
}
