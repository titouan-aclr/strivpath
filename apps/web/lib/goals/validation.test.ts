import { describe, it, expect, vi, beforeEach } from 'vitest';
import { validateGoalField, validateGoalForm, type GoalFormData } from './validation';
import { GoalTargetType, GoalPeriodType, SportType } from '@/gql/graphql';
import { GOAL_TARGET_LIMITS, GOAL_TITLE_MAX_LENGTH } from './constants';

const mockT = vi.fn((key: string, values?: Record<string, string | number>) => {
  if (values) {
    return `${key}:limit=${values.limit}`;
  }
  return key;
});

const createMockFormData = (overrides: Partial<GoalFormData> = {}): GoalFormData => ({
  title: 'Test Goal',
  description: 'Test description',
  targetType: GoalTargetType.Distance,
  targetValue: 50,
  periodType: GoalPeriodType.Monthly,
  sportType: SportType.Run,
  isRecurring: false,
  startDate: new Date('2026-06-01'),
  endDate: null,
  ...overrides,
});

describe('validateGoalField', () => {
  beforeEach(() => {
    mockT.mockClear();
  });

  describe('title validation', () => {
    it('should return error for empty title', () => {
      const formData = createMockFormData();
      const error = validateGoalField('title', '', formData, mockT);
      expect(error).toBe('create.form.errors.titleRequired');
      expect(mockT).toHaveBeenCalledWith('create.form.errors.titleRequired');
    });

    it('should return error for whitespace-only title', () => {
      const formData = createMockFormData();
      const error = validateGoalField('title', '   ', formData, mockT);
      expect(error).toBe('create.form.errors.titleRequired');
    });

    it('should return error for title exceeding max length', () => {
      const formData = createMockFormData();
      const longTitle = 'a'.repeat(GOAL_TITLE_MAX_LENGTH + 1);
      const error = validateGoalField('title', longTitle, formData, mockT);
      expect(error).toBe('create.form.errors.titleTooLong');
    });

    it('should return null for valid title', () => {
      const formData = createMockFormData();
      const error = validateGoalField('title', 'Valid Goal Title', formData, mockT);
      expect(error).toBeNull();
    });

    it('should return null for title at max length', () => {
      const formData = createMockFormData();
      const maxLengthTitle = 'a'.repeat(GOAL_TITLE_MAX_LENGTH);
      const error = validateGoalField('title', maxLengthTitle, formData, mockT);
      expect(error).toBeNull();
    });
  });

  describe('targetValue validation', () => {
    it('should return error for zero value', () => {
      const formData = createMockFormData();
      const error = validateGoalField('targetValue', 0, formData, mockT);
      expect(error).toBe('create.form.errors.targetValuePositive');
    });

    it('should return error for negative value', () => {
      const formData = createMockFormData();
      const error = validateGoalField('targetValue', -10, formData, mockT);
      expect(error).toBe('create.form.errors.targetValuePositive');
    });

    it('should return error for value exceeding limit', () => {
      const formData = createMockFormData({ targetType: GoalTargetType.Distance });
      const error = validateGoalField('targetValue', GOAL_TARGET_LIMITS[GoalTargetType.Distance] + 1, formData, mockT);
      expect(error).toContain('create.form.errors.targetValueTooHigh');
      expect(mockT).toHaveBeenCalledWith('create.form.errors.targetValueTooHigh', {
        limit: GOAL_TARGET_LIMITS[GoalTargetType.Distance],
      });
    });

    it('should return null for valid value', () => {
      const formData = createMockFormData();
      const error = validateGoalField('targetValue', 100, formData, mockT);
      expect(error).toBeNull();
    });

    it('should validate against correct limit for each target type', () => {
      Object.values(GoalTargetType).forEach(targetType => {
        const formData = createMockFormData({ targetType });
        const validValue = GOAL_TARGET_LIMITS[targetType] - 1;
        const error = validateGoalField('targetValue', validValue, formData, mockT);
        expect(error).toBeNull();
      });
    });
  });

  describe('startDate validation', () => {
    it('should return error for null date', () => {
      const formData = createMockFormData();
      const error = validateGoalField('startDate', null, formData, mockT);
      expect(error).toBe('create.form.errors.startDateRequired');
    });

    it('should return error for past date', () => {
      const formData = createMockFormData();
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const error = validateGoalField('startDate', yesterday, formData, mockT);
      expect(error).toBe('create.form.errors.startDatePast');
    });

    it('should allow today as start date', () => {
      const formData = createMockFormData();
      const today = new Date();
      const error = validateGoalField('startDate', today, formData, mockT);
      expect(error).toBeNull();
    });

    it('should return null for future date', () => {
      const formData = createMockFormData();
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const error = validateGoalField('startDate', tomorrow, formData, mockT);
      expect(error).toBeNull();
    });
  });

  describe('endDate validation', () => {
    it('should return null for non-CUSTOM period', () => {
      const formData = createMockFormData({ periodType: GoalPeriodType.Monthly });
      const error = validateGoalField('endDate', null, formData, mockT);
      expect(error).toBeNull();
    });

    it('should return error for CUSTOM period with null endDate', () => {
      const formData = createMockFormData({ periodType: GoalPeriodType.Custom, startDate: new Date('2026-01-01') });
      const error = validateGoalField('endDate', null, formData, mockT);
      expect(error).toBe('create.form.errors.endDateRequired');
    });

    it('should return error for endDate before startDate', () => {
      const formData = createMockFormData({
        periodType: GoalPeriodType.Custom,
        startDate: new Date('2026-02-01'),
      });
      const error = validateGoalField('endDate', new Date('2026-01-01'), formData, mockT);
      expect(error).toBe('create.form.errors.endDateAfterStart');
    });

    it('should return error for endDate equal to startDate', () => {
      const formData = createMockFormData({
        periodType: GoalPeriodType.Custom,
        startDate: new Date('2026-01-01'),
      });
      const error = validateGoalField('endDate', new Date('2026-01-01'), formData, mockT);
      expect(error).toBe('create.form.errors.endDateAfterStart');
    });

    it('should return null for valid endDate after startDate', () => {
      const formData = createMockFormData({
        periodType: GoalPeriodType.Custom,
        startDate: new Date('2026-01-01'),
      });
      const error = validateGoalField('endDate', new Date('2026-02-01'), formData, mockT);
      expect(error).toBeNull();
    });
  });

  describe('default case', () => {
    it('should return null for non-validated fields', () => {
      const formData = createMockFormData();
      const error = validateGoalField('description', 'test', formData, mockT);
      expect(error).toBeNull();
    });
  });
});

describe('validateGoalForm', () => {
  beforeEach(() => {
    mockT.mockClear();
  });

  it('should return empty object for valid form', () => {
    const formData = createMockFormData({
      title: 'Valid Goal',
      targetValue: 50,
      startDate: new Date('2026-06-01'),
    });
    const errors = validateGoalForm(formData, mockT);
    expect(errors).toEqual({});
  });

  it('should return all validation errors for invalid form', () => {
    const formData = createMockFormData({
      title: '',
      targetValue: 0,
      startDate: new Date('2020-01-01'),
      periodType: GoalPeriodType.Custom,
      endDate: null,
    });
    const errors = validateGoalForm(formData, mockT);
    expect(errors.title).toBeTruthy();
    expect(errors.targetValue).toBeTruthy();
    expect(errors.startDate).toBeTruthy();
    expect(errors.endDate).toBeTruthy();
  });

  it('should validate multiple fields independently', () => {
    const formData = createMockFormData({
      title: '',
      targetValue: 100,
      startDate: new Date('2026-06-01'),
    });
    const errors = validateGoalForm(formData, mockT);
    expect(errors.title).toBeTruthy();
    expect(errors.targetValue).toBeUndefined();
    expect(errors.startDate).toBeUndefined();
  });
});
