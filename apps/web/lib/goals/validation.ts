import { GoalTargetType, GoalPeriodType, SportType } from '@/gql/graphql';
import { GOAL_TARGET_LIMITS, GOAL_TITLE_MAX_LENGTH } from './constants';

export interface GoalFormData {
  title: string;
  description: string;
  targetType: GoalTargetType;
  targetValue: number;
  periodType: GoalPeriodType;
  sportType: SportType | null;
  isRecurring: boolean;
  startDate: Date;
  endDate: Date | null;
}

export type ValidationErrors = Partial<Record<keyof GoalFormData, string>>;

type TranslationFunction = (key: string, values?: Record<string, string | number>) => string;

export function validateGoalField<K extends keyof GoalFormData>(
  field: K,
  value: GoalFormData[K] | null | undefined,
  formData: GoalFormData,
  t: TranslationFunction,
): string | null {
  switch (field) {
    case 'title': {
      // Runtime type check
      if (typeof value !== 'string') {
        return t('create.form.errors.titleRequired');
      }
      if (value.trim().length === 0) {
        return t('create.form.errors.titleRequired');
      }
      if (value.length > GOAL_TITLE_MAX_LENGTH) {
        return t('create.form.errors.titleTooLong');
      }
      return null;
    }

    case 'targetValue': {
      // Runtime type check
      if (typeof value !== 'number') {
        return t('create.form.errors.targetValuePositive');
      }
      if (value <= 0) {
        return t('create.form.errors.targetValuePositive');
      }
      const limit = GOAL_TARGET_LIMITS[formData.targetType];
      if (value > limit) {
        return t('create.form.errors.targetValueTooHigh', { limit });
      }
      return null;
    }

    case 'startDate': {
      // Runtime type check - accept Date or null
      if (!(value instanceof Date) && value !== null) {
        return t('create.form.errors.startDateRequired');
      }
      if (!value) {
        return t('create.form.errors.startDateRequired');
      }
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const start = new Date(value);
      start.setHours(0, 0, 0, 0);
      if (start < today) {
        return t('create.form.errors.startDatePast');
      }
      return null;
    }

    case 'endDate': {
      if (formData.periodType !== GoalPeriodType.Custom) return null;

      // Runtime type check - accept Date or null
      if (value !== null && !(value instanceof Date)) {
        return t('create.form.errors.endDateRequired');
      }
      if (!value) {
        return t('create.form.errors.endDateRequired');
      }
      const end = new Date(value);
      const startForEnd = new Date(formData.startDate);
      end.setHours(0, 0, 0, 0);
      startForEnd.setHours(0, 0, 0, 0);
      if (end <= startForEnd) {
        return t('create.form.errors.endDateAfterStart');
      }
      return null;
    }

    default:
      return null;
  }
}

export function validateGoalForm(formData: GoalFormData, t: TranslationFunction): ValidationErrors {
  const errors: ValidationErrors = {};

  const titleError = validateGoalField('title', formData.title, formData, t);
  if (titleError) errors.title = titleError;

  const targetValueError = validateGoalField('targetValue', formData.targetValue, formData, t);
  if (targetValueError) errors.targetValue = targetValueError;

  const startDateError = validateGoalField('startDate', formData.startDate, formData, t);
  if (startDateError) errors.startDate = startDateError;

  const endDateError = validateGoalField('endDate', formData.endDate, formData, t);
  if (endDateError) errors.endDate = endDateError;

  return errors;
}
