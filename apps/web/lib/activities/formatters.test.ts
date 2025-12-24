import { describe, it, expect } from 'vitest';
import {
  formatDistance,
  formatDuration,
  formatPace,
  formatElevation,
  formatDate,
  formatTime,
  formatCalories,
  formatAltitudeRange,
  formatWatts,
  formatSplitPace,
} from './formatters';
import { SportType } from '@/gql/graphql';

describe('formatDistance', () => {
  it('should return em dash for null input', () => {
    expect(formatDistance(null)).toBe('—');
  });

  it('should return em dash for undefined input', () => {
    expect(formatDistance(undefined)).toBe('—');
  });

  it('should return em dash for NaN input', () => {
    expect(formatDistance(NaN)).toBe('—');
  });

  it('should format zero meters', () => {
    expect(formatDistance(0)).toBe('0 m');
  });

  it('should format meters less than 1000 as integer', () => {
    expect(formatDistance(500)).toBe('500 m');
    expect(formatDistance(999)).toBe('999 m');
  });

  it('should format meters >= 1000 as km with 2 decimals', () => {
    expect(formatDistance(1000, 'en')).toBe('1.00 km');
    expect(formatDistance(5420, 'en')).toBe('5.42 km');
    expect(formatDistance(10000, 'en')).toBe('10.00 km');
  });

  it('should handle negative values by using absolute value', () => {
    expect(formatDistance(-500)).toBe('500 m');
    expect(formatDistance(-5420, 'en')).toBe('5.42 km');
  });

  it('should format very large values correctly', () => {
    expect(formatDistance(1000000, 'en')).toBe('1,000.00 km');
  });

  it('should respect locale-specific thousand separators', () => {
    expect(formatDistance(1000000, 'en-US')).toBe('1,000.00 km');
    expect(formatDistance(1000000, 'fr-FR')).toContain('1');
  });
});

describe('formatDuration', () => {
  it('should return em dash for null input', () => {
    expect(formatDuration(null)).toBe('—');
  });

  it('should return em dash for undefined input', () => {
    expect(formatDuration(undefined)).toBe('—');
  });

  it('should return em dash for NaN input', () => {
    expect(formatDuration(NaN)).toBe('—');
  });

  it('should return "0s" for zero seconds', () => {
    expect(formatDuration(0)).toBe('0s');
  });

  it('should format seconds less than 60', () => {
    expect(formatDuration(45)).toBe('45s');
    expect(formatDuration(1)).toBe('1s');
    expect(formatDuration(59)).toBe('59s');
  });

  it('should format minutes and seconds (no hours)', () => {
    expect(formatDuration(90)).toBe('1m 30s');
    expect(formatDuration(125)).toBe('2m 5s');
    expect(formatDuration(3599)).toBe('59m 59s');
  });

  it('should format hours, minutes, and seconds', () => {
    expect(formatDuration(3600)).toBe('1h');
    expect(formatDuration(3661)).toBe('1h 1m 1s');
    expect(formatDuration(5025)).toBe('1h 23m 45s');
  });

  it('should handle exact hours', () => {
    expect(formatDuration(3600)).toBe('1h');
    expect(formatDuration(7200)).toBe('2h');
  });

  it('should handle exact minutes', () => {
    expect(formatDuration(60)).toBe('1m');
    expect(formatDuration(120)).toBe('2m');
  });

  it('should handle durations longer than 24 hours', () => {
    expect(formatDuration(86400)).toBe('24h');
    expect(formatDuration(90000)).toBe('25h');
  });

  it('should handle negative values by using absolute value', () => {
    expect(formatDuration(-90)).toBe('1m 30s');
    expect(formatDuration(-3661)).toBe('1h 1m 1s');
  });

  it('should floor fractional seconds', () => {
    expect(formatDuration(90.9)).toBe('1m 30s');
    expect(formatDuration(45.5)).toBe('45s');
  });
});

describe('formatPace', () => {
  it('should return em dash for null distance', () => {
    expect(formatPace(null, 1800, SportType.Run)).toBe('—');
  });

  it('should return em dash for null time', () => {
    expect(formatPace(5000, null, SportType.Run)).toBe('—');
  });

  it('should return em dash for zero distance', () => {
    expect(formatPace(0, 1800, SportType.Run)).toBe('—');
  });

  it('should return em dash for zero time', () => {
    expect(formatPace(5000, 0, SportType.Run)).toBe('—');
  });

  it('should return em dash for NaN distance', () => {
    expect(formatPace(NaN, 1800, SportType.Run)).toBe('—');
  });

  it('should return em dash for NaN time', () => {
    expect(formatPace(5000, NaN, SportType.Run)).toBe('—');
  });

  it('should format running pace in min/km', () => {
    expect(formatPace(5000, 1500, SportType.Run)).toBe('5:00 min/km');
    expect(formatPace(5000, 1620, SportType.Run)).toBe('5:24 min/km');
  });

  it('should format swimming pace in min/km', () => {
    expect(formatPace(1000, 1200, SportType.Swim)).toBe('20:00 min/km');
  });

  it('should format cycling speed in km/h', () => {
    expect(formatPace(20000, 3600, SportType.Ride, 'en')).toBe('20.0 km/h');
    expect(formatPace(30000, 3600, SportType.Ride, 'en')).toBe('30.0 km/h');
  });

  it('should handle very slow pace (>60 min/km)', () => {
    expect(formatPace(1000, 4000, SportType.Run)).toBe('66:40 min/km');
  });

  it('should handle very fast speed (>100 km/h)', () => {
    expect(formatPace(50000, 1500, SportType.Ride, 'en')).toBe('120.0 km/h');
  });

  it('should respect locale for number formatting in speed', () => {
    expect(formatPace(20000, 3600, SportType.Ride, 'en-US')).toBe('20.0 km/h');
    expect(formatPace(20000, 3600, SportType.Ride, 'fr-FR')).toContain('20');
  });

  it('should format pace when sportType is string "Run"', () => {
    expect(formatPace(5000, 1500, 'Run')).toBe('5:00 min/km');
    expect(formatPace(5000, 1620, 'Run')).toBe('5:24 min/km');
  });

  it('should format pace when sportType is string "Swim"', () => {
    expect(formatPace(1000, 1200, 'Swim')).toBe('20:00 min/km');
  });

  it('should format speed when sportType is string "Ride"', () => {
    expect(formatPace(20000, 3600, 'Ride', 'en')).toBe('20.0 km/h');
  });
});

describe('formatElevation', () => {
  it('should return em dash for null input', () => {
    expect(formatElevation(null)).toBe('—');
  });

  it('should return em dash for undefined input', () => {
    expect(formatElevation(undefined)).toBe('—');
  });

  it('should return em dash for NaN input', () => {
    expect(formatElevation(NaN)).toBe('—');
  });

  it('should format zero elevation', () => {
    expect(formatElevation(0)).toBe('0 m');
  });

  it('should format positive values as rounded integer', () => {
    expect(formatElevation(245)).toBe('245 m');
    const result = formatElevation(1024);
    expect(result).toMatch(/1[\s,]024 m/);
  });

  it('should handle negative values by using absolute value', () => {
    expect(formatElevation(-245)).toBe('245 m');
  });

  it('should round decimal values to nearest integer', () => {
    expect(formatElevation(245.4)).toBe('245 m');
    expect(formatElevation(245.6)).toBe('246 m');
  });

  it('should format large values with thousand separators', () => {
    const result = formatElevation(10000);
    expect(result).toMatch(/10[\s,]000 m/);
  });
});

describe('formatDate', () => {
  const testDate = new Date('2025-01-15T00:00:00Z');
  const testISOString = '2025-01-15T00:00:00Z';

  it('should return em dash for null input', () => {
    expect(formatDate(null)).toBe('—');
  });

  it('should return em dash for undefined input', () => {
    expect(formatDate(undefined)).toBe('—');
  });

  it('should return em dash for invalid date string', () => {
    expect(formatDate('invalid-date')).toBe('—');
  });

  it('should format Date objects in short format', () => {
    const result = formatDate(testDate, 'en', 'short');
    expect(result).toMatch(/1\/15\/25|15\/1\/25/);
  });

  it('should format Date objects in medium format', () => {
    const result = formatDate(testDate, 'en', 'medium');
    expect(result).toContain('Jan');
    expect(result).toContain('15');
    expect(result).toContain('2025');
  });

  it('should format Date objects in long format', () => {
    const result = formatDate(testDate, 'en', 'long');
    expect(result).toContain('January');
    expect(result).toContain('15');
    expect(result).toContain('2025');
  });

  it('should format ISO string dates', () => {
    const result = formatDate(testISOString, 'en', 'medium');
    expect(result).toContain('Jan');
    expect(result).toContain('15');
  });

  it('should respect locale for date formatting', () => {
    const enResult = formatDate(testDate, 'en', 'medium');
    const frResult = formatDate(testDate, 'fr-FR', 'medium');
    expect(enResult).not.toBe(frResult);
    expect(enResult).toContain('Jan');
    expect(frResult).toContain('janv');
  });
});

describe('formatTime', () => {
  const testDate = new Date('2025-01-15T00:00:00Z');
  const testISOString = '2025-01-15T00:00:00Z';

  it('should return em dash for null input', () => {
    expect(formatTime(null)).toBe('—');
  });

  it('should return em dash for undefined input', () => {
    expect(formatTime(undefined)).toBe('—');
  });

  it('should return em dash for invalid date string', () => {
    expect(formatTime('invalid-date')).toBe('—');
  });

  it('should format time from Date objects', () => {
    const result = formatTime(testDate, 'en');
    expect(result).toMatch(/\d{1,2}:\d{2}/);
  });

  it('should format time from ISO string', () => {
    const result = formatTime(testISOString, 'en');
    expect(result).toMatch(/\d{1,2}:\d{2}/);
  });

  it('should respect locale for time formatting', () => {
    const result = formatTime(testDate, 'en-US');
    expect(result).toMatch(/\d{1,2}:\d{2}/);
  });
});

describe('formatCalories', () => {
  it('should return em dash for null input', () => {
    expect(formatCalories(null)).toBe('—');
  });

  it('should return em dash for undefined input', () => {
    expect(formatCalories(undefined)).toBe('—');
  });

  it('should return em dash for NaN input', () => {
    expect(formatCalories(NaN)).toBe('—');
  });

  it('should format zero calories', () => {
    expect(formatCalories(0)).toBe('0 kcal');
  });

  it('should format calories as rounded integer', () => {
    expect(formatCalories(245.4)).toBe('245 kcal');
    expect(formatCalories(245.6)).toBe('246 kcal');
    expect(formatCalories(500)).toBe('500 kcal');
  });

  it('should format large values with thousand separators', () => {
    const result = formatCalories(1500);
    expect(result).toMatch(/1[\s,]500 kcal/);
  });
});

describe('formatAltitudeRange', () => {
  it('should return em dash when high is null', () => {
    expect(formatAltitudeRange(null, 100)).toBe('—');
  });

  it('should return em dash when low is null', () => {
    expect(formatAltitudeRange(500, null)).toBe('—');
  });

  it('should return em dash when both are null', () => {
    expect(formatAltitudeRange(null, null)).toBe('—');
  });

  it('should format altitude range correctly', () => {
    expect(formatAltitudeRange(500, 100)).toBe('100 m → 500 m');
  });

  it('should round decimal values', () => {
    expect(formatAltitudeRange(500.6, 100.4)).toBe('100 m → 501 m');
  });

  it('should handle same high and low values', () => {
    expect(formatAltitudeRange(250, 250)).toBe('250 m → 250 m');
  });
});

describe('formatWatts', () => {
  it('should return em dash for null input', () => {
    expect(formatWatts(null)).toBe('—');
  });

  it('should return em dash for undefined input', () => {
    expect(formatWatts(undefined)).toBe('—');
  });

  it('should return em dash for NaN input', () => {
    expect(formatWatts(NaN)).toBe('—');
  });

  it('should format zero watts', () => {
    expect(formatWatts(0)).toBe('0 W');
  });

  it('should format watts as rounded integer', () => {
    expect(formatWatts(245.4)).toBe('245 W');
    expect(formatWatts(245.6)).toBe('246 W');
    expect(formatWatts(180)).toBe('180 W');
  });

  it('should format large wattage values', () => {
    expect(formatWatts(350)).toBe('350 W');
    const result = formatWatts(1000);
    expect(result).toMatch(/1[\s,]000 W/);
  });
});

describe('formatSplitPace', () => {
  it('should format running split pace in min/km', () => {
    const split = { distance: 1000, movingTime: 300 };
    expect(formatSplitPace(split, SportType.Run)).toBe('5:00 min/km');
  });

  it('should format cycling split as speed in km/h', () => {
    const split = { distance: 1000, movingTime: 120 };
    expect(formatSplitPace(split, SportType.Ride, 'en')).toBe('30.0 km/h');
  });

  it('should format swimming split pace in min/km', () => {
    const split = { distance: 100, movingTime: 120 };
    expect(formatSplitPace(split, SportType.Swim)).toBe('20:00 min/km');
  });

  it('should handle varying split distances', () => {
    const split = { distance: 500, movingTime: 150 };
    expect(formatSplitPace(split, SportType.Run)).toBe('5:00 min/km');
  });

  it('should respect locale for speed formatting', () => {
    const split = { distance: 1000, movingTime: 120 };
    const result = formatSplitPace(split, SportType.Ride, 'en-US');
    expect(result).toBe('30.0 km/h');
  });
});
