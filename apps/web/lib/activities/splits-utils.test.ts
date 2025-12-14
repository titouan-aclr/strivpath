import { describe, it, expect } from 'vitest';
import { prepareSplitsForChart, calculateAveragePace, formatPaceValue } from './splits-utils';
import { SportType } from '@/gql/graphql';
import type { Split } from './types';

describe('prepareSplitsForChart', () => {
  const mockSplits: Split[] = [
    {
      distance: 1000,
      movingTime: 300,
      elapsedTime: 305,
      averageSpeed: 3.33,
      elevationDifference: 10,
    },
    {
      distance: 1000,
      movingTime: 320,
      elapsedTime: 325,
      averageSpeed: 3.125,
      elevationDifference: -5,
    },
  ];

  it('should return empty array for null splits', () => {
    expect(prepareSplitsForChart(null, SportType.Run)).toEqual([]);
  });

  it('should return empty array for undefined splits', () => {
    expect(prepareSplitsForChart(undefined, SportType.Run)).toEqual([]);
  });

  it('should return empty array for empty splits array', () => {
    expect(prepareSplitsForChart([], SportType.Run)).toEqual([]);
  });

  it('should prepare pace data for running (pace metric)', () => {
    const result = prepareSplitsForChart(mockSplits, SportType.Run);

    expect(result).toHaveLength(2);
    expect(result[0].km).toBe(1);
    expect(result[0].label).toBe('Km 1');
    expect(result[0].speed).toBeCloseTo(11.988, 2);
    expect(result[0].pace).toBeCloseTo(5, 1);
  });

  it('should prepare speed data for cycling (speed metric)', () => {
    const result = prepareSplitsForChart(mockSplits, SportType.Ride);

    expect(result).toHaveLength(2);
    expect(result[0].km).toBe(1);
    expect(result[0].label).toBe('Km 1');
    expect(result[0].speed).toBeCloseTo(11.988, 2);
    expect(result[0].pace).toBeCloseTo(12, 1);
  });

  it('should prepare pace data for swimming (pace metric)', () => {
    const result = prepareSplitsForChart(mockSplits, SportType.Swim);

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({
      km: 1,
      label: 'Km 1',
    });
    expect(result[0].pace).toBeCloseTo(5, 1);
  });

  it('should correctly number kilometers sequentially', () => {
    const result = prepareSplitsForChart(mockSplits, SportType.Run);

    expect(result[0].km).toBe(1);
    expect(result[1].km).toBe(2);
    expect(result[0].label).toBe('Km 1');
    expect(result[1].label).toBe('Km 2');
  });

  it('should convert speed from m/s to km/h', () => {
    const result = prepareSplitsForChart(mockSplits, SportType.Run);

    expect(result[0].speed).toBeCloseTo(3.33 * 3.6, 2);
    expect(result[1].speed).toBeCloseTo(3.125 * 3.6, 2);
  });
});

describe('calculateAveragePace', () => {
  it('should return 0 for empty splits array', () => {
    expect(calculateAveragePace([])).toBe(0);
  });

  it('should calculate average pace correctly', () => {
    const splits: Split[] = [
      {
        distance: 1000,
        movingTime: 300,
        elapsedTime: 305,
        averageSpeed: 3.33,
      },
      {
        distance: 1000,
        movingTime: 320,
        elapsedTime: 325,
        averageSpeed: 3.125,
      },
    ];

    const result = calculateAveragePace(splits);
    expect(result).toBeCloseTo(5.166, 2);
  });

  it('should handle single split', () => {
    const splits: Split[] = [
      {
        distance: 1000,
        movingTime: 300,
        elapsedTime: 305,
        averageSpeed: 3.33,
      },
    ];

    const result = calculateAveragePace(splits);
    expect(result).toBeCloseTo(5, 1);
  });

  it('should calculate pace for multiple varying distances', () => {
    const splits: Split[] = [
      {
        distance: 500,
        movingTime: 150,
        elapsedTime: 155,
        averageSpeed: 3.33,
      },
      {
        distance: 1500,
        movingTime: 450,
        elapsedTime: 455,
        averageSpeed: 3.33,
      },
    ];

    const result = calculateAveragePace(splits);
    expect(result).toBeCloseTo(5, 1);
  });
});

describe('formatPaceValue', () => {
  it('should format whole minutes correctly', () => {
    expect(formatPaceValue(5)).toBe('5:00');
    expect(formatPaceValue(10)).toBe('10:00');
  });

  it('should format minutes with seconds correctly', () => {
    expect(formatPaceValue(5.5)).toBe('5:30');
    expect(formatPaceValue(4.25)).toBe('4:15');
  });

  it('should pad seconds with leading zero', () => {
    expect(formatPaceValue(5.083333)).toBe('5:05');
    expect(formatPaceValue(4.016667)).toBe('4:01');
  });

  it('should handle zero pace', () => {
    expect(formatPaceValue(0)).toBe('0:00');
  });

  it('should handle very fast pace', () => {
    expect(formatPaceValue(3.5)).toBe('3:30');
  });

  it('should handle very slow pace', () => {
    expect(formatPaceValue(12.75)).toBe('12:45');
  });

  it('should round seconds to nearest integer', () => {
    expect(formatPaceValue(5.008)).toBe('5:00');
    expect(formatPaceValue(5.992)).toBe('5:60');
  });
});
