import { describe, it, expect } from 'vitest';
import { IntervalType, ProgressionMetric, SportType } from '@/gql/graphql';
import { getIntervalLabel, formatProgressionValue, formatProgressionYAxis } from './chart-label-utils';

describe('getIntervalLabel', () => {
  describe('WEEK interval', () => {
    it('should return W-prefixed labels for index 1-5', () => {
      expect(getIntervalLabel(1, IntervalType.Week)).toBe('W1');
      expect(getIntervalLabel(2, IntervalType.Week)).toBe('W2');
      expect(getIntervalLabel(3, IntervalType.Week)).toBe('W3');
      expect(getIntervalLabel(4, IntervalType.Week)).toBe('W4');
      expect(getIntervalLabel(5, IntervalType.Week)).toBe('W5');
    });
  });

  describe('MONTH interval', () => {
    it('should return short month names for index 0-11 in English', () => {
      const labels = Array.from({ length: 12 }, (_, i) => getIntervalLabel(i, IntervalType.Month, 'en'));

      expect(labels[0]).toBe('Jan');
      expect(labels[1]).toBe('Feb');
      expect(labels[2]).toBe('Mar');
      expect(labels[3]).toBe('Apr');
      expect(labels[4]).toBe('May');
      expect(labels[5]).toBe('Jun');
      expect(labels[6]).toBe('Jul');
      expect(labels[7]).toBe('Aug');
      expect(labels[8]).toBe('Sep');
      expect(labels[9]).toBe('Oct');
      expect(labels[10]).toBe('Nov');
      expect(labels[11]).toBe('Dec');
    });
  });
});

describe('formatProgressionValue', () => {
  it('should format DISTANCE in km', () => {
    expect(formatProgressionValue(42500, ProgressionMetric.Distance, 'en', SportType.Run)).toBe('42.5 km');
    expect(formatProgressionValue(1000, ProgressionMetric.Distance, 'en', SportType.Run)).toBe('1.0 km');
  });

  it('should format DURATION with formatDurationCompact', () => {
    expect(formatProgressionValue(3600, ProgressionMetric.Duration, 'en', SportType.Run)).toBe('1h');
    expect(formatProgressionValue(5400, ProgressionMetric.Duration, 'en', SportType.Run)).toBe('1h 30m');
    expect(formatProgressionValue(1800, ProgressionMetric.Duration, 'en', SportType.Run)).toBe('30m');
  });

  it('should format PACE for Run as min/km', () => {
    const result = formatProgressionValue(330, ProgressionMetric.Pace, 'en', SportType.Run);
    expect(result).toBe('5:30 min/km');
  });

  it('should format PACE for Swim as /100m', () => {
    const result = formatProgressionValue(120, ProgressionMetric.Pace, 'en', SportType.Swim);
    expect(result).toContain('/100m');
  });

  it('should format SPEED in km/h', () => {
    const result = formatProgressionValue(8.5, ProgressionMetric.Speed, 'en', SportType.Ride);
    expect(result).toBe('30.6 km/h');
  });

  it('should format SESSIONS as rounded integer', () => {
    expect(formatProgressionValue(5, ProgressionMetric.Sessions, 'en', SportType.Run)).toBe('5');
    expect(formatProgressionValue(3.7, ProgressionMetric.Sessions, 'en', SportType.Run)).toBe('4');
  });

  it('should format ELEVATION with meters', () => {
    expect(formatProgressionValue(850, ProgressionMetric.Elevation, 'en', SportType.Run)).toBe('850 m');
    expect(formatProgressionValue(1234.5, ProgressionMetric.Elevation, 'en', SportType.Run)).toBe('1235 m');
  });

  it('should return dash for null or undefined', () => {
    expect(formatProgressionValue(null, ProgressionMetric.Distance, 'en', SportType.Run)).toBe('—');
    expect(formatProgressionValue(undefined, ProgressionMetric.Distance, 'en', SportType.Run)).toBe('—');
  });

  it('should handle zero value', () => {
    expect(formatProgressionValue(0, ProgressionMetric.Distance, 'en', SportType.Run)).toBe('0.0 km');
    expect(formatProgressionValue(0, ProgressionMetric.Sessions, 'en', SportType.Run)).toBe('0');
    expect(formatProgressionValue(0, ProgressionMetric.Elevation, 'en', SportType.Run)).toBe('0 m');
  });
});

describe('formatProgressionYAxis', () => {
  it('should format DISTANCE in km without unit', () => {
    expect(formatProgressionYAxis(42500, ProgressionMetric.Distance)).toBe('43');
    expect(formatProgressionYAxis(1000, ProgressionMetric.Distance)).toBe('1');
  });

  it('should format DURATION as Xh or Xm', () => {
    expect(formatProgressionYAxis(3600, ProgressionMetric.Duration)).toBe('1h');
    expect(formatProgressionYAxis(7200, ProgressionMetric.Duration)).toBe('2h');
    expect(formatProgressionYAxis(1800, ProgressionMetric.Duration)).toBe('30m');
  });

  it('should format PACE as mm:ss', () => {
    expect(formatProgressionYAxis(330, ProgressionMetric.Pace)).toBe('5:30');
    expect(formatProgressionYAxis(300, ProgressionMetric.Pace)).toBe('5:00');
  });

  it('should format SPEED as integer km/h', () => {
    expect(formatProgressionYAxis(8.5, ProgressionMetric.Speed)).toBe('31');
    expect(formatProgressionYAxis(5.0, ProgressionMetric.Speed)).toBe('18');
  });

  it('should format SESSIONS as integer', () => {
    expect(formatProgressionYAxis(5, ProgressionMetric.Sessions)).toBe('5');
    expect(formatProgressionYAxis(3.7, ProgressionMetric.Sessions)).toBe('4');
  });

  it('should format ELEVATION as integer', () => {
    expect(formatProgressionYAxis(850, ProgressionMetric.Elevation)).toBe('850');
    expect(formatProgressionYAxis(1234.5, ProgressionMetric.Elevation)).toBe('1235');
  });
});
