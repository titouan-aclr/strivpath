import { describe, it, expect } from 'vitest';
import { GoalStatus } from '@/gql/graphql';
import { getGoalStatusColors } from '@/components/goals/constants';
import type { SportColorConfig } from '@/lib/sports/config';
import { getEffectiveStatusColors } from './utils';

const mockSportColor: SportColorConfig = {
  bg: 'bg-lime-300',
  bgMuted: 'bg-lime-300/10',
  text: 'text-lime-500',
  textMuted: 'text-lime-500/10',
  border: 'border-lime-300',
  ring: 'ring-lime-300',
  chart: 'oklch(0.84 0.18 128)',
};

describe('getEffectiveStatusColors', () => {
  it('should return status colors when no sportColor is provided', () => {
    const result = getEffectiveStatusColors(GoalStatus.Active);
    const expected = getGoalStatusColors(GoalStatus.Active);

    expect(result).toEqual(expected);
  });

  it('should return status colors when status is not Active even with sportColor', () => {
    const result = getEffectiveStatusColors(GoalStatus.Completed, mockSportColor);
    const expected = getGoalStatusColors(GoalStatus.Completed);

    expect(result).toEqual(expected);
  });

  it('should return sport-derived colors when status is Active and sportColor is provided', () => {
    const result = getEffectiveStatusColors(GoalStatus.Active, mockSportColor);
    const baseColors = getGoalStatusColors(GoalStatus.Active);

    expect(result.text).toBe(mockSportColor.text);
    expect(result.textSubtle).toBe(mockSportColor.textMuted);
    expect(result.bg).toBe(mockSportColor.bg);
    expect(result.bgSubtle).toBe(mockSportColor.bgMuted);
    expect(result.border).toBe(mockSportColor.border);
    expect(result.hoverBorder).toBe(baseColors.hoverBorder);
    expect(result.hex).toBe(baseColors.hex);
  });

  it('should return Active status colors when status is undefined', () => {
    const result = getEffectiveStatusColors(undefined);
    const expected = getGoalStatusColors(undefined);

    expect(result).toEqual(expected);
  });

  it('should return Active status colors when status is undefined even with sportColor', () => {
    const result = getEffectiveStatusColors(undefined, mockSportColor);
    const expected = getGoalStatusColors(undefined);

    expect(result).toEqual(expected);
  });

  it('should return status colors for Failed status with sportColor', () => {
    const result = getEffectiveStatusColors(GoalStatus.Failed, mockSportColor);
    const expected = getGoalStatusColors(GoalStatus.Failed);

    expect(result).toEqual(expected);
  });

  it('should return status colors for Archived status with sportColor', () => {
    const result = getEffectiveStatusColors(GoalStatus.Archived, mockSportColor);
    const expected = getGoalStatusColors(GoalStatus.Archived);

    expect(result).toEqual(expected);
  });
});
