import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { CreateGoalInput, UpdateGoalInput, CreateGoalFromTemplateInput } from './goal.input';
import { GoalTargetType } from '../enums/goal-target-type.enum';
import { GoalPeriodType } from '../enums/goal-period-type.enum';

describe('CreateGoalInput', () => {
  it('should pass validation with valid data', async () => {
    const input = plainToClass(CreateGoalInput, {
      title: 'Run 50km this month',
      targetType: GoalTargetType.DISTANCE,
      targetValue: 50,
      periodType: GoalPeriodType.MONTHLY,
      startDate: '2025-01-01T00:00:00Z',
    });

    const errors = await validate(input);
    expect(errors).toHaveLength(0);
  });

  it('should fail validation when targetValue is 0', async () => {
    const input = plainToClass(CreateGoalInput, {
      title: 'Invalid goal',
      targetType: GoalTargetType.DISTANCE,
      targetValue: 0,
      periodType: GoalPeriodType.MONTHLY,
      startDate: '2025-01-01T00:00:00Z',
    });

    const errors = await validate(input);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('targetValue');
  });

  it('should fail validation when title is empty', async () => {
    const input = plainToClass(CreateGoalInput, {
      title: '',
      targetType: GoalTargetType.DISTANCE,
      targetValue: 50,
      periodType: GoalPeriodType.MONTHLY,
      startDate: '2025-01-01T00:00:00Z',
    });

    const errors = await validate(input);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('title');
  });

  it('should fail validation with invalid enum value', async () => {
    const input = plainToClass(CreateGoalInput, {
      title: 'Test goal',
      targetType: 'INVALID_TYPE' as any,
      targetValue: 50,
      periodType: GoalPeriodType.MONTHLY,
      startDate: '2025-01-01T00:00:00Z',
    });

    const errors = await validate(input);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('targetType');
  });

  it('should fail validation with invalid date string', async () => {
    const input = plainToClass(CreateGoalInput, {
      title: 'Test goal',
      targetType: GoalTargetType.DISTANCE,
      targetValue: 50,
      periodType: GoalPeriodType.MONTHLY,
      startDate: 'invalid-date',
    });

    const errors = await validate(input);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('startDate');
  });

  it('should pass validation with optional description', async () => {
    const input = plainToClass(CreateGoalInput, {
      title: 'Run 50km this month',
      description: 'My monthly running goal',
      targetType: GoalTargetType.DISTANCE,
      targetValue: 50,
      periodType: GoalPeriodType.MONTHLY,
      startDate: '2025-01-01T00:00:00Z',
    });

    const errors = await validate(input);
    expect(errors).toHaveLength(0);
  });
});

describe('UpdateGoalInput', () => {
  it('should pass validation with valid partial data', async () => {
    const input = plainToClass(UpdateGoalInput, {
      title: 'Updated title',
    });

    const errors = await validate(input);
    expect(errors).toHaveLength(0);
  });

  it('should fail validation when targetValue is negative', async () => {
    const input = plainToClass(UpdateGoalInput, {
      targetValue: -10,
    });

    const errors = await validate(input);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('targetValue');
  });

  it('should fail validation when title is empty string', async () => {
    const input = plainToClass(UpdateGoalInput, {
      title: '',
    });

    const errors = await validate(input);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('title');
  });

  it('should pass validation when only updating endDate', async () => {
    const input = plainToClass(UpdateGoalInput, {
      endDate: '2025-12-31T23:59:59Z',
    });

    const errors = await validate(input);
    expect(errors).toHaveLength(0);
  });
});

describe('CreateGoalFromTemplateInput', () => {
  it('should pass validation with valid data', async () => {
    const input = plainToClass(CreateGoalFromTemplateInput, {
      templateId: 1,
      startDate: '2025-01-01T00:00:00Z',
    });

    const errors = await validate(input);
    expect(errors).toHaveLength(0);
  });

  it('should fail validation when templateId is 0', async () => {
    const input = plainToClass(CreateGoalFromTemplateInput, {
      templateId: 0,
      startDate: '2025-01-01T00:00:00Z',
    });

    const errors = await validate(input);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('templateId');
  });

  it('should fail validation when templateId is negative', async () => {
    const input = plainToClass(CreateGoalFromTemplateInput, {
      templateId: -1,
      startDate: '2025-01-01T00:00:00Z',
    });

    const errors = await validate(input);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('templateId');
  });

  it('should fail validation when startDate is invalid', async () => {
    const input = plainToClass(CreateGoalFromTemplateInput, {
      templateId: 1,
      startDate: 'not-a-date',
    });

    const errors = await validate(input);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('startDate');
  });

  it('should pass validation with optional customTitle', async () => {
    const input = plainToClass(CreateGoalFromTemplateInput, {
      templateId: 1,
      startDate: '2025-01-01T00:00:00Z',
      customTitle: 'My custom title',
    });

    const errors = await validate(input);
    expect(errors).toHaveLength(0);
  });

  it('should fail validation when customTitle is empty string', async () => {
    const input = plainToClass(CreateGoalFromTemplateInput, {
      templateId: 1,
      startDate: '2025-01-01T00:00:00Z',
      customTitle: '',
    });

    const errors = await validate(input);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('customTitle');
  });
});
