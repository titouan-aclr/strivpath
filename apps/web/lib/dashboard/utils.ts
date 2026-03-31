import type { BaseGoal, ProgressStatus } from './types';

export interface TimeAgoTranslations {
  justNow: string;
  minutesAgo: (count: number) => string;
  hoursAgo: (count: number) => string;
  daysAgo: (count: number) => string;
}

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

export function formatTimeAgo(
  date: Date | string | null | undefined,
  translations: TimeAgoTranslations,
  locale: string = 'en',
): string | null {
  if (!date) return null;

  const dateObj = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(dateObj.getTime())) return null;

  const now = new Date();
  const diffMs = now.getTime() - dateObj.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) return translations.justNow;
  if (diffMinutes < 60) return translations.minutesAgo(diffMinutes);
  if (diffHours < 24) return translations.hoursAgo(diffHours);
  if (diffDays < 7) return translations.daysAgo(diffDays);

  return dateObj.toLocaleDateString(locale, {
    month: 'short',
    day: 'numeric',
    year: dateObj.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

export function calculateIdealProgress(goal: BaseGoal): number {
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

export function getProgressStatusFromGoal(goal: BaseGoal, tolerance: number = 0.1): ProgressStatus {
  const idealProgress = calculateIdealProgress(goal);
  return getProgressStatus(goal.currentValue, idealProgress, tolerance);
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

export function formatAverageSessionTime(seconds: number): string {
  if (seconds === 0 || isNaN(seconds)) {
    return '—';
  }

  return formatDurationCompact(seconds);
}
