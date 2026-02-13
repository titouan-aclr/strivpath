import type { Goal } from '@/gql/graphql';
import { GoalStatus, GoalTargetType, SportType } from '@/gql/graphql';
import { Activity, Bike, Footprints, Waves } from 'lucide-react';
import { describe, expect, it } from 'vitest';
import {
  formatCurrentValue,
  formatPeriod,
  formatTargetValue,
  formatValueOnly,
  getProgressBackgroundColor,
  getProgressColor,
  getProgressColorForChart,
  getSportIcon,
  getSportLabelKey,
  getUnitLabel,
} from './formatting';

describe('getUnitLabel', () => {
  it('should return km for DISTANCE', () => {
    expect(getUnitLabel(GoalTargetType.Distance)).toBe('km');
  });

  it('should return hours for DURATION', () => {
    expect(getUnitLabel(GoalTargetType.Duration)).toBe('hours');
  });

  it('should return meters for ELEVATION', () => {
    expect(getUnitLabel(GoalTargetType.Elevation)).toBe('meters');
  });

  it('should return sessions for FREQUENCY', () => {
    expect(getUnitLabel(GoalTargetType.Frequency)).toBe('sessions');
  });
});

describe('formatCurrentValue', () => {
  it('should format DISTANCE with one decimal', () => {
    const goal = {
      currentValue: 42567,
      targetType: GoalTargetType.Distance,
    } as Goal;
    expect(formatCurrentValue(goal)).toBe('42.6 km');
  });

  it('should format DURATION with one decimal', () => {
    const goal = {
      currentValue: 44442,
      targetType: GoalTargetType.Duration,
    } as Goal;
    expect(formatCurrentValue(goal)).toBe('12.3 hours');
  });

  it('should format ELEVATION with one decimal', () => {
    const goal = {
      currentValue: 1234.567,
      targetType: GoalTargetType.Elevation,
    } as Goal;
    expect(formatCurrentValue(goal)).toBe('1234.6 meters');
  });

  it('should format FREQUENCY as integer', () => {
    const goal = {
      currentValue: 10.9,
      targetType: GoalTargetType.Frequency,
    } as Goal;
    expect(formatCurrentValue(goal)).toBe('10 sessions');
  });
});

describe('formatTargetValue', () => {
  it('should format DISTANCE as integer', () => {
    const goal = {
      targetValue: 100567,
      targetType: GoalTargetType.Distance,
    } as Goal;
    expect(formatTargetValue(goal)).toBe('101 km');
  });

  it('should format DURATION as integer', () => {
    const goal = {
      targetValue: 92842,
      targetType: GoalTargetType.Duration,
    } as Goal;
    expect(formatTargetValue(goal)).toBe('26 hours');
  });

  it('should format ELEVATION as integer', () => {
    const goal = {
      targetValue: 5000.123,
      targetType: GoalTargetType.Elevation,
    } as Goal;
    expect(formatTargetValue(goal)).toBe('5000 meters');
  });

  it('should format FREQUENCY as integer', () => {
    const goal = {
      targetValue: 20.5,
      targetType: GoalTargetType.Frequency,
    } as Goal;
    expect(formatTargetValue(goal)).toBe('20 sessions');
  });
});

describe('formatPeriod', () => {
  it('should format period with Date objects', () => {
    const start = new Date('2024-01-01');
    const end = new Date('2024-12-31');
    const result = formatPeriod(start, end, 'en-US');
    expect(result).toContain('Jan');
    expect(result).toContain('Dec');
    expect(result).toContain('2024');
    expect(result).toContain('-');
  });

  it('should format period with date strings', () => {
    const start = '2024-01-15';
    const end = '2024-02-15';
    const result = formatPeriod(start, end, 'en-US');
    expect(result).toContain('Jan');
    expect(result).toContain('Feb');
    expect(result).toContain('2024');
  });

  it('should format period with French locale', () => {
    const start = new Date('2024-01-01');
    const end = new Date('2024-12-31');
    const result = formatPeriod(start, end, 'fr-FR');
    expect(result).toContain('2024');
    expect(result).toContain('-');
  });
});

describe('getSportIcon', () => {
  it('should return Footprints icon for RUN', () => {
    expect(getSportIcon(SportType.Run)).toBe(Footprints);
  });

  it('should return Bike icon for RIDE', () => {
    expect(getSportIcon(SportType.Ride)).toBe(Bike);
  });

  it('should return Waves icon for SWIM', () => {
    expect(getSportIcon(SportType.Swim)).toBe(Waves);
  });

  it('should return Activity icon for null sportType', () => {
    expect(getSportIcon(null)).toBe(Activity);
  });

  it('should return Activity icon for undefined sportType', () => {
    expect(getSportIcon(undefined)).toBe(Activity);
  });
});

describe('getSportLabelKey', () => {
  it('should return correct key for RUN', () => {
    expect(getSportLabelKey(SportType.Run)).toBe('goals.sportTypes.run');
  });

  it('should return correct key for RIDE', () => {
    expect(getSportLabelKey(SportType.Ride)).toBe('goals.sportTypes.ride');
  });

  it('should return correct key for SWIM', () => {
    expect(getSportLabelKey(SportType.Swim)).toBe('goals.sportTypes.swim');
  });

  it('should return null for null sportType', () => {
    expect(getSportLabelKey(null)).toBeNull();
  });

  it('should return null for undefined sportType', () => {
    expect(getSportLabelKey(undefined)).toBeNull();
  });
});

describe('getProgressColor', () => {
  it('should return accent-blue color for ACTIVE', () => {
    expect(getProgressColor(GoalStatus.Active)).toBe('var(--accent-blue)');
  });

  it('should return green color for COMPLETED', () => {
    expect(getProgressColor(GoalStatus.Completed)).toBe('oklch(0.65 0.19 142)');
  });

  it('should return destructive color for FAILED', () => {
    expect(getProgressColor(GoalStatus.Failed)).toBe('var(--destructive)');
  });

  it('should return primary color for ARCHIVED', () => {
    expect(getProgressColor(GoalStatus.Archived)).toBe('var(--primary)');
  });
});

describe('getProgressBackgroundColor', () => {
  it('should return accent-blue background for ACTIVE', () => {
    expect(getProgressBackgroundColor(GoalStatus.Active)).toBe(
      'color-mix(in oklch, var(--accent-blue) 10%, transparent)',
    );
  });

  it('should return green background for COMPLETED', () => {
    expect(getProgressBackgroundColor(GoalStatus.Completed)).toBe('oklch(0.65 0.19 142 / 0.1)');
  });

  it('should return destructive background for FAILED', () => {
    expect(getProgressBackgroundColor(GoalStatus.Failed)).toBe(
      'color-mix(in oklch, var(--destructive) 10%, transparent)',
    );
  });

  it('should return primary background for ARCHIVED', () => {
    expect(getProgressBackgroundColor(GoalStatus.Archived)).toBe(
      'color-mix(in oklch, var(--primary) 10%, transparent)',
    );
  });
});

describe('getProgressColorForChart', () => {
  it('should return OKLCH blue for ACTIVE', () => {
    expect(getProgressColorForChart(GoalStatus.Active)).toBe('oklch(0.65 0.19 245)');
  });

  it('should return OKLCH green for COMPLETED', () => {
    expect(getProgressColorForChart(GoalStatus.Completed)).toBe('oklch(0.65 0.19 142)');
  });

  it('should return OKLCH red for FAILED', () => {
    expect(getProgressColorForChart(GoalStatus.Failed)).toBe('oklch(0.55 0.19 25)');
  });

  it('should return OKLCH primary for ARCHIVED', () => {
    expect(getProgressColorForChart(GoalStatus.Archived)).toBe('oklch(0.6216 0.198 32.23)');
  });
});

describe('formatValueOnly', () => {
  it('should format DISTANCE with one decimal', () => {
    expect(formatValueOnly(42567, GoalTargetType.Distance)).toBe('42.6');
  });

  it('should format DURATION with one decimal', () => {
    expect(formatValueOnly(44442, GoalTargetType.Duration)).toBe('12.3');
  });

  it('should format ELEVATION as integer', () => {
    expect(formatValueOnly(1234.567, GoalTargetType.Elevation)).toBe('1234');
  });

  it('should format FREQUENCY as integer', () => {
    expect(formatValueOnly(10.9, GoalTargetType.Frequency)).toBe('10');
  });
});
