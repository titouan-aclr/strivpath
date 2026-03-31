import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { GoalStatus, GoalTargetType } from '@/gql/graphql';
import type { BaseGoal } from './types';
import {
  formatDurationCompact,
  formatTimeAgo,
  calculateIdealProgress,
  getProgressStatus,
  getProgressStatusFromGoal,
  getCurrentYear,
  getCurrentMonth,
  getWeekDates,
  getMonthDates,
  getYearDates,
  formatAverageSessionTime,
  type TimeAgoTranslations,
} from './utils';

const EN_TIME_AGO: TimeAgoTranslations = {
  justNow: 'just now',
  minutesAgo: count => (count === 1 ? '1 minute ago' : `${count} minutes ago`),
  hoursAgo: count => (count === 1 ? '1 hour ago' : `${count} hours ago`),
  daysAgo: count => (count === 1 ? '1 day ago' : `${count} days ago`),
};

const FR_TIME_AGO: TimeAgoTranslations = {
  justNow: 'il y a quelques secondes',
  minutesAgo: count => (count === 1 ? 'il y a 1 minute' : `il y a ${count} minutes`),
  hoursAgo: count => (count === 1 ? 'il y a 1 heure' : `il y a ${count} heures`),
  daysAgo: count => (count === 1 ? 'il y a 1 jour' : `il y a ${count} jours`),
};

describe('formatDurationCompact', () => {
  it('should return 0h for zero seconds', () => {
    expect(formatDurationCompact(0)).toBe('0h');
  });

  it('should format minutes only when less than an hour', () => {
    expect(formatDurationCompact(1800)).toBe('30m');
  });

  it('should format hours only when no remaining minutes', () => {
    expect(formatDurationCompact(7200)).toBe('2h');
  });

  it('should format hours and minutes', () => {
    expect(formatDurationCompact(5400)).toBe('1h 30m');
  });

  it('should handle large values', () => {
    expect(formatDurationCompact(36000)).toBe('10h');
  });

  it('should handle null-ish values', () => {
    expect(formatDurationCompact(NaN)).toBe('0h');
  });
});

describe('formatTimeAgo', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-06-15T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return null for null date', () => {
    expect(formatTimeAgo(null, EN_TIME_AGO)).toBeNull();
  });

  it('should return null for undefined date', () => {
    expect(formatTimeAgo(undefined, EN_TIME_AGO)).toBeNull();
  });

  it('should return "just now" for recent times', () => {
    const date = new Date('2024-06-15T11:59:30Z');
    expect(formatTimeAgo(date, EN_TIME_AGO)).toBe('just now');
  });

  it('should return minutes ago', () => {
    const date = new Date('2024-06-15T11:45:00Z');
    expect(formatTimeAgo(date, EN_TIME_AGO)).toBe('15 minutes ago');
  });

  it('should return singular minute ago', () => {
    const date = new Date('2024-06-15T11:59:00Z');
    expect(formatTimeAgo(date, EN_TIME_AGO)).toBe('1 minute ago');
  });

  it('should return hours ago', () => {
    const date = new Date('2024-06-15T09:00:00Z');
    expect(formatTimeAgo(date, EN_TIME_AGO)).toBe('3 hours ago');
  });

  it('should return singular hour ago', () => {
    const date = new Date('2024-06-15T11:00:00Z');
    expect(formatTimeAgo(date, EN_TIME_AGO)).toBe('1 hour ago');
  });

  it('should return days ago', () => {
    const date = new Date('2024-06-12T12:00:00Z');
    expect(formatTimeAgo(date, EN_TIME_AGO)).toBe('3 days ago');
  });

  it('should return singular day ago', () => {
    const date = new Date('2024-06-14T12:00:00Z');
    expect(formatTimeAgo(date, EN_TIME_AGO)).toBe('1 day ago');
  });

  it('should return formatted date for older dates', () => {
    const date = new Date('2024-05-01T12:00:00Z');
    const result = formatTimeAgo(date, EN_TIME_AGO, 'en');
    expect(result).not.toBeNull();
    expect(result).not.toMatch(/ago|just now/i);
    expect(result).toContain('May');
  });

  it('should format in French locale', () => {
    const date = new Date('2024-06-15T09:00:00Z');
    expect(formatTimeAgo(date, FR_TIME_AGO, 'fr')).toBe('il y a 3 heures');
  });

  it('should handle string dates', () => {
    expect(formatTimeAgo('2024-06-15T11:45:00Z', EN_TIME_AGO)).toBe('15 minutes ago');
  });
});

describe('calculateIdealProgress', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-06-15T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return 0 if current date is before start date', () => {
    const goal: BaseGoal = {
      id: '1',
      title: 'Test Goal',
      targetType: GoalTargetType.Distance,
      targetValue: 100,
      currentValue: 0,
      startDate: new Date('2024-06-20'),
      endDate: new Date('2024-06-30'),
      sportType: null,
      status: GoalStatus.Active,
      progressPercentage: 0,
      daysRemaining: 15,
      isExpired: false,
    };
    expect(calculateIdealProgress(goal)).toBe(0);
  });

  it('should return target value if current date is after end date', () => {
    const goal: BaseGoal = {
      id: '1',
      title: 'Test Goal',
      targetType: GoalTargetType.Distance,
      targetValue: 100,
      currentValue: 50,
      startDate: new Date('2024-06-01'),
      endDate: new Date('2024-06-10'),
      sportType: null,
      status: GoalStatus.Active,
      progressPercentage: 50,
      daysRemaining: null,
      isExpired: true,
    };
    expect(calculateIdealProgress(goal)).toBe(100);
  });

  it('should calculate proportional progress when in the middle of period', () => {
    const goal: BaseGoal = {
      id: '1',
      title: 'Test Goal',
      targetType: GoalTargetType.Distance,
      targetValue: 100,
      currentValue: 25,
      startDate: new Date('2024-06-01'),
      endDate: new Date('2024-06-30'),
      sportType: null,
      status: GoalStatus.Active,
      progressPercentage: 25,
      daysRemaining: 15,
      isExpired: false,
    };
    const idealProgress = calculateIdealProgress(goal);
    expect(idealProgress).toBeGreaterThan(40);
    expect(idealProgress).toBeLessThan(60);
  });
});

describe('getProgressStatus', () => {
  it('should return ahead when current is significantly higher than ideal', () => {
    expect(getProgressStatus(60, 50, 0.1)).toBe('ahead');
  });

  it('should return behind when current is significantly lower than ideal', () => {
    expect(getProgressStatus(40, 50, 0.1)).toBe('behind');
  });

  it('should return onTrack when current is within tolerance', () => {
    expect(getProgressStatus(52, 50, 0.1)).toBe('onTrack');
    expect(getProgressStatus(48, 50, 0.1)).toBe('onTrack');
  });

  it('should return ahead when ideal is 0 and current is positive', () => {
    expect(getProgressStatus(10, 0)).toBe('ahead');
  });

  it('should return onTrack when both are 0', () => {
    expect(getProgressStatus(0, 0)).toBe('onTrack');
  });
});

describe('getProgressStatusFromGoal', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-06-15T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return correct status based on goal progress', () => {
    const aheadGoal: BaseGoal = {
      id: '1',
      title: 'Ahead Goal',
      targetType: GoalTargetType.Distance,
      targetValue: 100,
      currentValue: 80,
      startDate: new Date('2024-06-01'),
      endDate: new Date('2024-06-30'),
      sportType: null,
      status: GoalStatus.Active,
      progressPercentage: 80,
      daysRemaining: 15,
      isExpired: false,
    };
    expect(getProgressStatusFromGoal(aheadGoal)).toBe('ahead');
  });
});

describe('getCurrentYear', () => {
  it('should return current year', () => {
    const currentYear = new Date().getFullYear();
    expect(getCurrentYear()).toBe(currentYear);
  });
});

describe('getCurrentMonth', () => {
  it('should return current month (1-indexed)', () => {
    const currentMonth = new Date().getMonth() + 1;
    expect(getCurrentMonth()).toBe(currentMonth);
  });
});

describe('getWeekDates', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return Monday to Sunday of current week', () => {
    vi.setSystemTime(new Date('2024-06-12T12:00:00Z'));
    const { start, end } = getWeekDates();
    expect(start.getDay()).toBe(1);
    expect(end.getDay()).toBe(0);
  });

  it('should handle Sunday correctly', () => {
    const sunday = new Date('2024-06-16T12:00:00Z');
    vi.setSystemTime(sunday);
    const { start, end } = getWeekDates();

    expect(start.getDay()).toBe(1);
    expect(end.getDay()).toBe(0);
    expect(start.getTime()).toBeLessThanOrEqual(sunday.getTime());
    expect(end.getTime()).toBeGreaterThanOrEqual(sunday.getTime());
  });
});

describe('getMonthDates', () => {
  it('should return first and last day of current month when no args', () => {
    const { start, end } = getMonthDates();
    expect(start.getDate()).toBe(1);
    expect(end.getDate()).toBe(new Date(end.getFullYear(), end.getMonth() + 1, 0).getDate());
  });

  it('should return correct dates for specified month', () => {
    const { start, end } = getMonthDates(2024, 1);
    expect(start.getMonth()).toBe(1);
    expect(start.getDate()).toBe(1);
    expect(end.getMonth()).toBe(1);
    expect(end.getDate()).toBe(29);
  });
});

describe('getYearDates', () => {
  it('should return Jan 1 and Dec 31 of current year when no args', () => {
    const { start, end } = getYearDates();
    const year = new Date().getFullYear();
    expect(start.getFullYear()).toBe(year);
    expect(start.getMonth()).toBe(0);
    expect(start.getDate()).toBe(1);
    expect(end.getMonth()).toBe(11);
    expect(end.getDate()).toBe(31);
  });

  it('should return correct dates for specified year', () => {
    const { start, end } = getYearDates(2023);
    expect(start.getFullYear()).toBe(2023);
    expect(end.getFullYear()).toBe(2023);
  });
});

describe('formatAverageSessionTime', () => {
  it('should return dash for 0 seconds', () => {
    expect(formatAverageSessionTime(0)).toBe('—');
  });

  it('should return dash for NaN', () => {
    expect(formatAverageSessionTime(NaN)).toBe('—');
  });

  it('should format duration compactly', () => {
    expect(formatAverageSessionTime(3600)).toBe('1h');
    expect(formatAverageSessionTime(5400)).toBe('1h 30m');
  });
});
