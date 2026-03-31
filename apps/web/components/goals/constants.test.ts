import { describe, it, expect } from 'vitest';
import { GoalStatus } from '@/gql/graphql';
import { getGoalStatusColors, GOAL_STATUS_COLORS } from './constants';

describe('getGoalStatusColors', () => {
  it('should return Active colors by default when status is undefined', () => {
    const colors = getGoalStatusColors(undefined);

    expect(colors).toEqual(GOAL_STATUS_COLORS[GoalStatus.Active]);
  });

  it('should return Active colors for Active status', () => {
    const colors = getGoalStatusColors(GoalStatus.Active);

    expect(colors.text).toBe('text-primary');
    expect(colors.textSubtle).toBe('text-primary/10');
    expect(colors.bg).toBe('bg-primary');
    expect(colors.bgSubtle).toBe('bg-primary/10');
    expect(colors.border).toBe('border-primary');
    expect(colors.hoverBorder).toBe('hover:border-primary/50');
    expect(colors.hex).toBe('#E5482D');
  });

  it('should return Completed colors for Completed status', () => {
    const colors = getGoalStatusColors(GoalStatus.Completed);

    expect(colors.text).toBe('text-green-500');
    expect(colors.textSubtle).toBe('text-green-500/10');
    expect(colors.bg).toBe('bg-green-500');
    expect(colors.bgSubtle).toBe('bg-green-500/10');
    expect(colors.border).toBe('border-green-500');
    expect(colors.hoverBorder).toBe('hover:border-green-500/50');
    expect(colors.hex).toBe('#22c55e');
  });

  it('should return Failed colors for Failed status', () => {
    const colors = getGoalStatusColors(GoalStatus.Failed);

    expect(colors.text).toBe('text-destructive');
    expect(colors.textSubtle).toBe('text-destructive/10');
    expect(colors.bg).toBe('bg-destructive');
    expect(colors.bgSubtle).toBe('bg-destructive/10');
    expect(colors.border).toBe('border-destructive');
    expect(colors.hoverBorder).toBe('hover:border-destructive/50');
    expect(colors.hex).toBe('#ef4444');
  });

  it('should return Archived colors for Archived status', () => {
    const colors = getGoalStatusColors(GoalStatus.Archived);

    expect(colors.text).toBe('text-muted-foreground');
    expect(colors.textSubtle).toBe('text-muted-foreground/10');
    expect(colors.bg).toBe('bg-muted-foreground');
    expect(colors.bgSubtle).toBe('bg-muted-foreground/10');
    expect(colors.border).toBe('border-muted-foreground');
    expect(colors.hoverBorder).toBe('hover:border-muted-foreground/50');
    expect(colors.hex).toBe('#64748b');
  });
});

describe('GOAL_STATUS_COLORS', () => {
  it('should have colors defined for all GoalStatus values', () => {
    const allStatuses = Object.values(GoalStatus);

    for (const status of allStatuses) {
      expect(GOAL_STATUS_COLORS[status]).toBeDefined();
      expect(GOAL_STATUS_COLORS[status].text).toBeDefined();
      expect(GOAL_STATUS_COLORS[status].textSubtle).toBeDefined();
      expect(GOAL_STATUS_COLORS[status].bg).toBeDefined();
      expect(GOAL_STATUS_COLORS[status].bgSubtle).toBeDefined();
      expect(GOAL_STATUS_COLORS[status].border).toBeDefined();
      expect(GOAL_STATUS_COLORS[status].hoverBorder).toBeDefined();
      expect(GOAL_STATUS_COLORS[status].hex).toBeDefined();
    }
  });

  it('should have valid hex color codes', () => {
    const hexColorRegex = /^#[0-9a-fA-F]{6}$/;

    for (const status of Object.values(GoalStatus)) {
      expect(GOAL_STATUS_COLORS[status].hex).toMatch(hexColorRegex);
    }
  });
});
