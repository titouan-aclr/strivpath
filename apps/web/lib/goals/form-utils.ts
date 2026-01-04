import { GoalTargetType, GoalPeriodType, type CreateGoalInput } from '@/gql/graphql';
import type { GoalFormData } from './validation';

export interface TargetTypeConfig {
  unit: string;
  step: number;
  hintKey: string;
}

export function getTargetTypeConfig(targetType: GoalTargetType): TargetTypeConfig {
  switch (targetType) {
    case GoalTargetType.Distance:
      return { unit: 'km', step: 1, hintKey: 'create.form.hints.distance' };
    case GoalTargetType.Duration:
      return { unit: 'h', step: 0.5, hintKey: 'create.form.hints.duration' };
    case GoalTargetType.Frequency:
      return { unit: 'sessions', step: 1, hintKey: 'create.form.hints.frequency' };
    case GoalTargetType.Elevation:
      return { unit: 'm', step: 100, hintKey: 'create.form.hints.elevation' };
  }
}

export function formatGoalTarget(value: number, targetType: GoalTargetType): string {
  switch (targetType) {
    case GoalTargetType.Distance:
    case GoalTargetType.Elevation:
    case GoalTargetType.Frequency:
      return value.toFixed(0);
    case GoalTargetType.Duration:
      return value.toFixed(1);
  }
}

export function transformFormDataToInput(formData: GoalFormData): CreateGoalInput {
  return {
    title: formData.title.trim(),
    description: formData.description?.trim() || undefined,
    targetType: formData.targetType,
    targetValue: formData.targetValue,
    periodType: formData.periodType,
    sportType: formData.sportType || undefined,
    isRecurring: formData.isRecurring,
    startDate: formData.startDate.toISOString(),
    endDate:
      formData.periodType === GoalPeriodType.Custom && formData.endDate ? formData.endDate.toISOString() : undefined,
  };
}
