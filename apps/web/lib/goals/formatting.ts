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

export function formatCurrentValue(goal: Goal): string {
  const unit = getUnitLabel(goal.targetType);
  if (goal.targetType === GoalTargetType.Frequency) {
    return `${Math.floor(goal.currentValue)} ${unit}`;
  }
  return `${goal.currentValue.toFixed(1)} ${unit}`;
}

export function formatTargetValue(goal: Goal): string {
  const unit = getUnitLabel(goal.targetType);
  if (goal.targetType === GoalTargetType.Frequency) {
    return `${Math.floor(goal.targetValue)} ${unit}`;
  }
  return `${goal.targetValue.toFixed(0)} ${unit}`;
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
    ACTIVE: 'var(--accent-blue)',
    COMPLETED: 'oklch(0.65 0.19 142)',
    FAILED: 'var(--destructive)',
    ARCHIVED: 'var(--primary)',
  };
  return colors[status];
}

export function getProgressBackgroundColor(status: GoalStatus): string {
  const colors: Record<GoalStatus, string> = {
    ACTIVE: 'color-mix(in oklch, var(--accent-blue) 10%, transparent)',
    COMPLETED: 'oklch(0.65 0.19 142 / 0.1)',
    FAILED: 'color-mix(in oklch, var(--destructive) 10%, transparent)',
    ARCHIVED: 'color-mix(in oklch, var(--primary) 10%, transparent)',
  };
  return colors[status];
}

export function getProgressColorForChart(status: GoalStatus): string {
  const colors: Record<GoalStatus, string> = {
    ACTIVE: 'oklch(0.65 0.19 245)',
    COMPLETED: 'oklch(0.65 0.19 142)',
    FAILED: 'oklch(0.55 0.19 25)',
    ARCHIVED: 'oklch(0.6216 0.198 32.23)',
  };
  return colors[status];
}

export function formatValueOnly(value: number, targetType: GoalTargetType): string {
  if (targetType === GoalTargetType.Frequency || targetType === GoalTargetType.Elevation) {
    return Math.floor(value).toString();
  }
  return value.toFixed(1);
}
