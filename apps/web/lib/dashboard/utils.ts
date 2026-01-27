import type { DashboardGoal, ProgressStatus } from './types';

export function formatDurationCompact(seconds: number): string {
  if (seconds == null || isNaN(seconds) || seconds === 0) return '0h';

  const absSeconds = Math.abs(Math.floor(seconds));
  const hours = Math.floor(absSeconds / 3600);
  const minutes = Math.floor((absSeconds % 3600) / 60);

  if (hours === 0) {
    return `${minutes}m`;
  }

  if (minutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${minutes}m`;
}

export function formatDurationLong(seconds: number, locale: string = 'en'): string {
  if (seconds == null || isNaN(seconds) || seconds === 0) return '0 hours';

  const absSeconds = Math.abs(Math.floor(seconds));
  const hours = Math.floor(absSeconds / 3600);
  const minutes = Math.floor((absSeconds % 3600) / 60);

  const parts: string[] = [];

  if (hours > 0) {
    const hourUnit = locale.startsWith('fr') ? (hours === 1 ? 'heure' : 'heures') : hours === 1 ? 'hour' : 'hours';
    parts.push(`${hours} ${hourUnit}`);
  }

  if (minutes > 0) {
    const minuteUnit = locale.startsWith('fr')
      ? minutes === 1
        ? 'minute'
        : 'minutes'
      : minutes === 1
        ? 'minute'
        : 'minutes';
    parts.push(`${minutes} ${minuteUnit}`);
  }

  return parts.join(' ') || '0 hours';
}

export function formatTimeAgo(date: Date | string | null | undefined, locale: string = 'en'): string | null {
  if (!date) return null;

  const dateObj = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(dateObj.getTime())) return null;

  const now = new Date();
  const diffMs = now.getTime() - dateObj.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  const isFrench = locale.startsWith('fr');

  if (diffSeconds < 60) {
    return isFrench ? 'il y a quelques secondes' : 'just now';
  }

  if (diffMinutes < 60) {
    if (isFrench) {
      return diffMinutes === 1 ? 'il y a 1 minute' : `il y a ${diffMinutes} minutes`;
    }
    return diffMinutes === 1 ? '1 minute ago' : `${diffMinutes} minutes ago`;
  }

  if (diffHours < 24) {
    if (isFrench) {
      return diffHours === 1 ? 'il y a 1 heure' : `il y a ${diffHours} heures`;
    }
    return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
  }

  if (diffDays < 7) {
    if (isFrench) {
      return diffDays === 1 ? 'il y a 1 jour' : `il y a ${diffDays} jours`;
    }
    return diffDays === 1 ? '1 day ago' : `${diffDays} days ago`;
  }

  return dateObj.toLocaleDateString(locale, {
    month: 'short',
    day: 'numeric',
    year: dateObj.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

export function calculateIdealProgress(goal: DashboardGoal): number {
  const startDate = goal.startDate instanceof Date ? goal.startDate : new Date(goal.startDate);
  const endDate = goal.endDate instanceof Date ? goal.endDate : new Date(goal.endDate);
  const now = new Date();

  if (now < startDate) return 0;
  if (now > endDate) return goal.targetValue;

  const totalDuration = endDate.getTime() - startDate.getTime();
  const elapsedDuration = now.getTime() - startDate.getTime();

  const progressRatio = elapsedDuration / totalDuration;
  return goal.targetValue * progressRatio;
}

export function getProgressStatus(currentValue: number, idealValue: number, tolerance: number = 0.1): ProgressStatus {
  if (idealValue === 0) {
    return currentValue > 0 ? 'ahead' : 'onTrack';
  }

  const ratio = currentValue / idealValue;

  if (ratio >= 1 + tolerance) {
    return 'ahead';
  }

  if (ratio <= 1 - tolerance) {
    return 'behind';
  }

  return 'onTrack';
}

export function getProgressStatusFromGoal(goal: DashboardGoal, tolerance: number = 0.1): ProgressStatus {
  const idealProgress = calculateIdealProgress(goal);
  return getProgressStatus(goal.currentValue, idealProgress, tolerance);
}

export function getDaysRemainingText(daysRemaining: number | null, isExpired: boolean, locale: string = 'en'): string {
  const isFrench = locale.startsWith('fr');

  if (isExpired) {
    return isFrench ? 'Expiré' : 'Expired';
  }

  if (daysRemaining === null) {
    return isFrench ? 'Expiré' : 'Expired';
  }

  if (daysRemaining === 0) {
    return isFrench ? "Se termine aujourd'hui" : 'Ends today';
  }

  if (daysRemaining === 1) {
    return isFrench ? '1 jour restant' : '1 day left';
  }

  return isFrench ? `${daysRemaining} jours restants` : `${daysRemaining} days left`;
}

export function getCurrentYear(): number {
  return new Date().getFullYear();
}

export function getCurrentMonth(): number {
  return new Date().getMonth() + 1;
}

export function getWeekDates(): { start: Date; end: Date } {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

  const start = new Date(now);
  start.setDate(now.getDate() + mondayOffset);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

export function getMonthDates(year?: number, month?: number): { start: Date; end: Date } {
  const now = new Date();
  const targetYear = year ?? now.getFullYear();
  const targetMonth = month ?? now.getMonth();

  const start = new Date(targetYear, targetMonth, 1, 0, 0, 0, 0);
  const end = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59, 999);

  return { start, end };
}

export function getYearDates(year?: number): { start: Date; end: Date } {
  const targetYear = year ?? new Date().getFullYear();

  const start = new Date(targetYear, 0, 1, 0, 0, 0, 0);
  const end = new Date(targetYear, 11, 31, 23, 59, 59, 999);

  return { start, end };
}

export function formatActivityCount(count: number, locale: string = 'en'): string {
  const isFrench = locale.startsWith('fr');

  if (count === 0) {
    return isFrench ? '0 activité' : '0 activities';
  }

  if (count === 1) {
    return isFrench ? '1 activité' : '1 activity';
  }

  return isFrench ? `${count} activités` : `${count} activities`;
}

export function formatAverageSessionTime(seconds: number): string {
  if (seconds === 0 || isNaN(seconds)) {
    return '—';
  }

  return formatDurationCompact(seconds);
}
