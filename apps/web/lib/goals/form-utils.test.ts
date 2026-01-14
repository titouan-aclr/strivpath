import { describe, expect, it } from 'vitest';
import { GoalTargetType, GoalPeriodType, SportType } from '@/gql/graphql';
import type { GoalFormData } from './validation';
import {
  getTargetTypeConfig,
  formatGoalTarget,
  transformFormDataToInput,
  transformFormDataToUpdateInput,
} from './form-utils';

describe('getTargetTypeConfig', () => {
  it('should return correct config for DISTANCE', () => {
    const config = getTargetTypeConfig(GoalTargetType.Distance);
    expect(config).toEqual({
      unit: 'km',
      step: 1,
      hintKey: 'create.form.hints.distance',
    });
  });

  it('should return correct config for DURATION', () => {
    const config = getTargetTypeConfig(GoalTargetType.Duration);
    expect(config).toEqual({
      unit: 'h',
      step: 0.5,
      hintKey: 'create.form.hints.duration',
    });
  });

  it('should return correct config for FREQUENCY', () => {
    const config = getTargetTypeConfig(GoalTargetType.Frequency);
    expect(config).toEqual({
      unit: 'sessions',
      step: 1,
      hintKey: 'create.form.hints.frequency',
    });
  });

  it('should return correct config for ELEVATION', () => {
    const config = getTargetTypeConfig(GoalTargetType.Elevation);
    expect(config).toEqual({
      unit: 'm',
      step: 100,
      hintKey: 'create.form.hints.elevation',
    });
  });
});

describe('formatGoalTarget', () => {
  it('should format DISTANCE as integer', () => {
    expect(formatGoalTarget(42.567, GoalTargetType.Distance)).toBe('43');
  });

  it('should format DURATION with one decimal', () => {
    expect(formatGoalTarget(12.345, GoalTargetType.Duration)).toBe('12.3');
  });

  it('should format ELEVATION as integer', () => {
    expect(formatGoalTarget(1234.567, GoalTargetType.Elevation)).toBe('1235');
  });

  it('should format FREQUENCY as integer', () => {
    expect(formatGoalTarget(10.9, GoalTargetType.Frequency)).toBe('11');
  });
});

describe('transformFormDataToInput', () => {
  const baseFormData: GoalFormData = {
    title: '  Run 100km  ',
    description: '  Monthly running goal  ',
    targetType: GoalTargetType.Distance,
    targetValue: 100,
    periodType: GoalPeriodType.Monthly,
    sportType: SportType.Run,
    isRecurring: false,
    startDate: new Date('2024-01-01T00:00:00.000Z'),
    endDate: null,
  };

  it('should trim title and description', () => {
    const result = transformFormDataToInput(baseFormData);
    expect(result.title).toBe('Run 100km');
    expect(result.description).toBe('Monthly running goal');
  });

  it('should convert null sportType to undefined', () => {
    const formData = { ...baseFormData, sportType: null };
    const result = transformFormDataToInput(formData);
    expect(result.sportType).toBeUndefined();
  });

  it('should keep sportType when defined', () => {
    const result = transformFormDataToInput(baseFormData);
    expect(result.sportType).toBe(SportType.Run);
  });

  it('should convert empty description to undefined', () => {
    const formData = { ...baseFormData, description: '   ' };
    const result = transformFormDataToInput(formData);
    expect(result.description).toBeUndefined();
  });

  it('should convert startDate to ISO string', () => {
    const result = transformFormDataToInput(baseFormData);
    expect(result.startDate).toBe('2024-01-01T00:00:00.000Z');
  });

  it('should include endDate for CUSTOM period', () => {
    const formData: GoalFormData = {
      ...baseFormData,
      periodType: GoalPeriodType.Custom,
      endDate: new Date('2024-12-31T00:00:00.000Z'),
    };
    const result = transformFormDataToInput(formData);
    expect(result.endDate).toBe('2024-12-31T00:00:00.000Z');
  });

  it('should not include endDate for non-CUSTOM period', () => {
    const formData: GoalFormData = {
      ...baseFormData,
      periodType: GoalPeriodType.Monthly,
      endDate: new Date('2024-12-31T00:00:00.000Z'),
    };
    const result = transformFormDataToInput(formData);
    expect(result.endDate).toBeUndefined();
  });

  it('should include isRecurring flag', () => {
    const formData = { ...baseFormData, isRecurring: true };
    const result = transformFormDataToInput(formData);
    expect(result.isRecurring).toBe(true);
  });

  it('should include all required fields', () => {
    const result = transformFormDataToInput(baseFormData);
    expect(result).toHaveProperty('title');
    expect(result).toHaveProperty('targetType');
    expect(result).toHaveProperty('targetValue');
    expect(result).toHaveProperty('periodType');
    expect(result).toHaveProperty('isRecurring');
    expect(result).toHaveProperty('startDate');
  });
});

describe('transformFormDataToUpdateInput', () => {
  const baseFormData: GoalFormData = {
    title: '  Updated Title  ',
    description: '  Updated Description  ',
    targetType: GoalTargetType.Distance,
    targetValue: 150,
    periodType: GoalPeriodType.Custom,
    sportType: SportType.Ride,
    isRecurring: false,
    startDate: new Date('2024-01-01T00:00:00.000Z'),
    endDate: new Date('2024-12-31T00:00:00.000Z'),
  };

  it('should only include updatable fields', () => {
    const result = transformFormDataToUpdateInput(baseFormData);
    expect(result).toHaveProperty('title');
    expect(result).toHaveProperty('description');
    expect(result).toHaveProperty('targetValue');
    expect(result).not.toHaveProperty('targetType');
    expect(result).not.toHaveProperty('periodType');
    expect(result).not.toHaveProperty('sportType');
    expect(result).not.toHaveProperty('isRecurring');
    expect(result).not.toHaveProperty('startDate');
  });

  it('should trim title and description', () => {
    const result = transformFormDataToUpdateInput(baseFormData);
    expect(result.title).toBe('Updated Title');
    expect(result.description).toBe('Updated Description');
  });

  it('should include endDate only for CUSTOM period', () => {
    const result = transformFormDataToUpdateInput(baseFormData);
    expect(result.endDate).toBe('2024-12-31T00:00:00.000Z');
  });

  it('should not include endDate for non-CUSTOM period', () => {
    const formData = { ...baseFormData, periodType: GoalPeriodType.Monthly };
    const result = transformFormDataToUpdateInput(formData);
    expect(result.endDate).toBeUndefined();
  });

  it('should convert empty description to undefined', () => {
    const formData = { ...baseFormData, description: '   ' };
    const result = transformFormDataToUpdateInput(formData);
    expect(result.description).toBeUndefined();
  });

  it('should include targetValue', () => {
    const result = transformFormDataToUpdateInput(baseFormData);
    expect(result.targetValue).toBe(150);
  });
});
