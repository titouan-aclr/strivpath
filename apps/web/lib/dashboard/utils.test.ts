import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { GoalStatus, GoalTargetType } from '@/gql/graphql';
import type { BaseGoal } from './types';
import {
  formatDurationCompact,
  formatDurationLong,
  formatTimeAgo,
  calculateIdealProgress,
  getProgressStatus,
  getProgressStatusFromGoal,
  getDaysRemainingText,
  getCurrentYear,
  getCurrentMonth,
  getWeekDates,
  getMonthDates,
  getYearDates,
  formatActivityCount,
  formatAverageSessionTime,
} from './utils';

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

describe('formatDurationLong', () => {
  it('should return 0 hours for zero seconds in English', () => {
    expect(formatDurationLong(0, 'en')).toBe('0 hours');
  });

  it('should format singular hour correctly', () => {
    expect(formatDurationLong(3600, 'en')).toBe('1 hour');
  });

  it('should format plural hours correctly', () => {
    expect(formatDurationLong(7200, 'en')).toBe('2 hours');
  });

  it('should format singular minute correctly', () => {
    expect(formatDurationLong(60, 'en')).toBe('1 minute');
  });

  it('should format hours and minutes together', () => {
    expect(formatDurationLong(5460, 'en')).toBe('1 hour 31 minutes');
  });

  it('should format in French locale', () => {
    expect(formatDurationLong(7200, 'fr')).toBe('2 heures');
    expect(formatDurationLong(3600, 'fr')).toBe('1 heure');
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
    expect(formatTimeAgo(null)).toBeNull();
  });

  it('should return null for undefined date', () => {
    expect(formatTimeAgo(undefined)).toBeNull();
  });

  it('should return "just now" for recent times', () => {
    const date = new Date('2024-06-15T11:59:30Z');
    expect(formatTimeAgo(date, 'en')).toBe('just now');
  });

  it('should return minutes ago', () => {
    const date = new Date('2024-06-15T11:45:00Z');
    expect(formatTimeAgo(date, 'en')).toBe('15 minutes ago');
  });

  it('should return singular minute ago', () => {
    const date = new Date('2024-06-15T11:59:00Z');
    expect(formatTimeAgo(date, 'en')).toBe('1 minute ago');
  });

  it('should return hours ago', () => {
    const date = new Date('2024-06-15T09:00:00Z');
    expect(formatTimeAgo(date, 'en')).toBe('3 hours ago');
  });

  it('should return singular hour ago', () => {
    const date = new Date('2024-06-15T11:00:00Z');
    expect(formatTimeAgo(date, 'en')).toBe('1 hour ago');
  });

  it('should return days ago', () => {
    const date = new Date('2024-06-12T12:00:00Z');
    expect(formatTimeAgo(date, 'en')).toBe('3 days ago');
  });

  it('should return singular day ago', () => {
    const date = new Date('2024-06-14T12:00:00Z');
    expect(formatTimeAgo(date, 'en')).toBe('1 day ago');
  });

  it('should return formatted date for older dates', () => {
    const date = new Date('2024-05-01T12:00:00Z');
    const result = formatTimeAgo(date, 'en');
    expect(result).toContain('May');
    expect(result).toContain('1');
  });

  it('should format in French locale', () => {
    const date = new Date('2024-06-15T09:00:00Z');
    expect(formatTimeAgo(date, 'fr')).toBe('il y a 3 heures');
  });

  it('should handle string dates', () => {
    expect(formatTimeAgo('2024-06-15T11:45:00Z', 'en')).toBe('15 minutes ago');
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

describe('getDaysRemainingText', () => {
  it('should return "Expired" for expired goals in English', () => {
    expect(getDaysRemainingText(null, true, 'en')).toBe('Expired');
  });

  it('should return "Expiré" for expired goals in French', () => {
    expect(getDaysRemainingText(null, true, 'fr')).toBe('Expiré');
  });

  it('should return "Ends today" for 0 days remaining', () => {
    expect(getDaysRemainingText(0, false, 'en')).toBe('Ends today');
  });

  it('should return "Se termine aujourd\'hui" for 0 days in French', () => {
    expect(getDaysRemainingText(0, false, 'fr')).toBe("Se termine aujourd'hui");
  });

  it('should return singular form for 1 day remaining', () => {
    expect(getDaysRemainingText(1, false, 'en')).toBe('1 day left');
    expect(getDaysRemainingText(1, false, 'fr')).toBe('1 jour restant');
  });

  it('should return plural form for multiple days', () => {
    expect(getDaysRemainingText(5, false, 'en')).toBe('5 days left');
    expect(getDaysRemainingText(5, false, 'fr')).toBe('5 jours restants');
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
    vi.setSystemTime(new Date('2024-06-16T12:00:00Z'));
    const { start, end } = getWeekDates();
    expect(start.getDay()).toBe(1);
    expect(start.getDate()).toBe(10);
    expect(end.getDate()).toBe(16);
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

describe('formatActivityCount', () => {
  it('should return singular form for 0 activities in English', () => {
    expect(formatActivityCount(0, 'en')).toBe('0 activities');
  });

  it('should return singular form for 1 activity', () => {
    expect(formatActivityCount(1, 'en')).toBe('1 activity');
  });

  it('should return plural form for multiple activities', () => {
    expect(formatActivityCount(5, 'en')).toBe('5 activities');
  });

  it('should format in French locale', () => {
    expect(formatActivityCount(0, 'fr')).toBe('0 activité');
    expect(formatActivityCount(1, 'fr')).toBe('1 activité');
    expect(formatActivityCount(5, 'fr')).toBe('5 activités');
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
