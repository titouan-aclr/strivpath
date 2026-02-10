import { SportType } from '@/gql/graphql';
import { describe, expect, it } from 'vitest';

import { formatCadence, formatHeartRate, formatPaceFromSeconds, formatSpeed, formatTrend } from './formatters';

describe('formatHeartRate', () => {
  it('formats normal value', () => {
    expect(formatHeartRate(152)).toBe('152 bpm');
  });

  it('returns dash for null', () => {
    expect(formatHeartRate(null)).toBe('—');
  });

  it('returns dash for undefined', () => {
    expect(formatHeartRate(undefined)).toBe('—');
  });

  it('formats zero', () => {
    expect(formatHeartRate(0)).toBe('0 bpm');
  });

  it('rounds decimal values', () => {
    expect(formatHeartRate(152.7)).toBe('153 bpm');
  });
});

describe('formatCadence', () => {
  it('formats running cadence with spm', () => {
    expect(formatCadence(172, SportType.Run)).toBe('172 spm');
  });

  it('formats cycling cadence with rpm', () => {
    expect(formatCadence(85, SportType.Ride)).toBe('85 rpm');
  });

  it('formats swimming cadence with spm', () => {
    expect(formatCadence(32, SportType.Swim)).toBe('32 spm');
  });

  it('returns dash for null', () => {
    expect(formatCadence(null, SportType.Run)).toBe('—');
  });

  it('returns dash for undefined', () => {
    expect(formatCadence(undefined, SportType.Ride)).toBe('—');
  });

  it('rounds decimal values', () => {
    expect(formatCadence(172.6, SportType.Run)).toBe('173 spm');
  });
});

describe('formatSpeed', () => {
  it('converts m/s to km/h', () => {
    expect(formatSpeed(7.92)).toBe('28.5 km/h');
  });

  it('returns dash for null', () => {
    expect(formatSpeed(null)).toBe('—');
  });

  it('returns dash for undefined', () => {
    expect(formatSpeed(undefined)).toBe('—');
  });

  it('formats zero', () => {
    expect(formatSpeed(0)).toBe('0.0 km/h');
  });

  it('respects locale for decimal separator', () => {
    expect(formatSpeed(7.92, 'fr')).toBe('28,5 km/h');
  });
});

describe('formatPaceFromSeconds', () => {
  it('formats running pace', () => {
    expect(formatPaceFromSeconds(330, SportType.Run)).toBe('5:30 min/km');
  });

  it('formats swimming pace per 100m', () => {
    expect(formatPaceFromSeconds(1120, SportType.Swim)).toBe('1:52 /100m');
  });

  it('returns dash for null', () => {
    expect(formatPaceFromSeconds(null, SportType.Run)).toBe('—');
  });

  it('returns dash for undefined', () => {
    expect(formatPaceFromSeconds(undefined, SportType.Swim)).toBe('—');
  });

  it('returns dash for zero', () => {
    expect(formatPaceFromSeconds(0, SportType.Run)).toBe('—');
  });

  it('pads seconds with leading zero', () => {
    expect(formatPaceFromSeconds(305, SportType.Run)).toBe('5:05 min/km');
  });

  it('handles cycling (defaults to min/km)', () => {
    expect(formatPaceFromSeconds(180, SportType.Ride)).toBe('3:00 min/km');
  });
});

describe('formatTrend', () => {
  it('formats positive trend', () => {
    const result = formatTrend(12.5);
    expect(result.value).toBe('+13%');
    expect(result.isPositive).toBe(true);
    expect(result.isNeutral).toBe(false);
  });

  it('formats negative trend', () => {
    const result = formatTrend(-8.2);
    expect(result.value).toBe('-8.2%');
    expect(result.isPositive).toBe(false);
    expect(result.isNeutral).toBe(false);
  });

  it('formats zero as neutral', () => {
    const result = formatTrend(0);
    expect(result.value).toBe('0%');
    expect(result.isPositive).toBe(false);
    expect(result.isNeutral).toBe(true);
  });

  it('returns neutral for null', () => {
    const result = formatTrend(null);
    expect(result.value).toBe('—');
    expect(result.isPositive).toBe(false);
    expect(result.isNeutral).toBe(true);
  });

  it('returns neutral for undefined', () => {
    const result = formatTrend(undefined);
    expect(result.value).toBe('—');
    expect(result.isPositive).toBe(false);
    expect(result.isNeutral).toBe(true);
  });

  it('shows one decimal for small values', () => {
    const result = formatTrend(5.67);
    expect(result.value).toBe('+5.7%');
  });

  it('rounds large values', () => {
    const result = formatTrend(15.67);
    expect(result.value).toBe('+16%');
  });
});
