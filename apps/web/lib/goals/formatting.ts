import type { Goal, GoalStatus, SportType } from '@/gql/graphql';
import { GoalTargetType } from '@/gql/graphql';
import { Activity, Bike, Footprints, Waves } from 'lucide-react';

export function getUnitLabel(targetType: GoalTargetType): string {
  const units: Record<GoalTargetType, string> = {
    DISTANCE: 'km',
    DURATION: 'hours',
    ELEVATION: 'meters',
    FREQUENCY: 'sessions',
  };
  return units[targetType];
}

/**
 * Converts goal values from storage units (meters, seconds) to display units (km, hours).
 * - Distance: meters → km (÷ 1000)
 * - Duration: seconds → hours (÷ 3600)
 * - Elevation: meters → meters (no conversion)
 * - Frequency: count → count (no conversion)
 */
export function normalizeGoalValue(value: number, targetType: GoalTargetType): number {
  switch (targetType) {
    case GoalTargetType.Distance:
      return value / 1000;
    case GoalTargetType.Duration:
      return value / 3600;
    default:
      return value;
  }
}

export function formatCurrentValue(goal: Goal): string {
  const value = normalizeGoalValue(goal.currentValue, goal.targetType);
  const unit = getUnitLabel(goal.targetType);

  if (goal.targetType === GoalTargetType.Frequency) {
    return `${Math.floor(value)} ${unit}`;
  }
  return `${value.toFixed(1)} ${unit}`;
}

export function formatTargetValue(goal: Goal): string {
  const value = normalizeGoalValue(goal.targetValue, goal.targetType);
  const unit = getUnitLabel(goal.targetType);

  if (goal.targetType === GoalTargetType.Frequency) {
    return `${Math.floor(value)} ${unit}`;
  }
  return `${value.toFixed(0)} ${unit}`;
}

export function formatPeriod(startDate: Date | string, endDate: Date | string, locale: string): string {
  const start = startDate instanceof Date ? startDate : new Date(startDate);
  const end = endDate instanceof Date ? endDate : new Date(endDate);

  const formatDateValue = (date: Date) =>
    date.toLocaleDateString(locale, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

  return `${formatDateValue(start)} - ${formatDateValue(end)}`;
}

export function getSportIcon(sportType: SportType | null | undefined) {
  const icons = {
    RUN: Footprints,
    RIDE: Bike,
    SWIM: Waves,
  };
  return sportType ? icons[sportType] : Activity;
}

export function getSportLabelKey(sportType: SportType | null | undefined): string | null {
  const keys: Record<SportType, string> = {
    RUN: 'goals.sportTypes.run',
    RIDE: 'goals.sportTypes.ride',
    SWIM: 'goals.sportTypes.swim',
  };
  return sportType ? keys[sportType] : null;
}

export function getProgressColor(status: GoalStatus): string {
  const colors: Record<GoalStatus, string> = {
    ACTIVE: 'hsl(var(--goal-progress))',
    COMPLETED: 'hsl(142 71% 45%)',
    FAILED: 'hsl(var(--destructive))',
    ARCHIVED: 'hsl(var(--strava-orange))',
  };
  return colors[status];
}

export function getProgressBackgroundColor(status: GoalStatus): string {
  const colors: Record<GoalStatus, string> = {
    ACTIVE: 'hsl(var(--goal-progress) / 0.1)',
    COMPLETED: 'hsl(142 71% 45% / 0.1)',
    FAILED: 'hsl(var(--destructive) / 0.1)',
    ARCHIVED: 'hsl(var(--strava-orange) / 0.1)',
  };
  return colors[status];
}

export function getProgressColorForChart(status: GoalStatus): string {
  const colors: Record<GoalStatus, string> = {
    ACTIVE: 'oklch(0.65 0.19 245)',
    COMPLETED: 'oklch(0.65 0.19 142)',
    FAILED: 'oklch(0.55 0.19 25)',
    ARCHIVED: 'oklch(0.6678 0.216988 38.3451)',
  };
  return colors[status];
}

export function formatValueOnly(value: number, targetType: GoalTargetType): string {
  const normalized = normalizeGoalValue(value, targetType);
  if (targetType === GoalTargetType.Frequency || targetType === GoalTargetType.Elevation) {
    return Math.floor(normalized).toString();
  }
  return normalized.toFixed(1);
}

export function formatDate(date: Date | string, locale: string): string {
  const dateValue = date instanceof Date ? date : new Date(date);
  return dateValue.toLocaleDateString(locale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
