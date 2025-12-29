import { GoalMapper } from './goal.mapper';
import { Goal as PrismaGoal } from '@prisma/client';
import { GoalTargetType } from './enums/goal-target-type.enum';
import { GoalPeriodType } from './enums/goal-period-type.enum';
import { GoalStatus } from './enums/goal-status.enum';

describe('GoalMapper', () => {
  describe('toGraphQL', () => {
    it('should map complete Prisma Goal to GraphQL Goal', () => {
      const prismaGoal: PrismaGoal = {
        id: 1,
        userId: 42,
        title: 'Run 50km this month',
        description: 'Complete 50km of running activities',
        targetType: 'DISTANCE',
        targetValue: 50,
        periodType: 'MONTHLY',
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-01-31'),
        isRecurring: false,
        recurrenceEndDate: null,
        templateId: 5,
        sportType: 'Run',
        status: 'ACTIVE',
        currentValue: 25.5,
        completedAt: null,
        createdAt: new Date('2025-01-01T10:00:00Z'),
        updatedAt: new Date('2025-01-15T12:00:00Z'),
      };

      const result = GoalMapper.toGraphQL(prismaGoal);

      expect(result.id).toBe(1);
      expect(result.userId).toBe(42);
      expect(result.title).toBe('Run 50km this month');
      expect(result.description).toBe('Complete 50km of running activities');
      expect(result.targetType).toBe(GoalTargetType.DISTANCE);
      expect(result.targetValue).toBe(50);
      expect(result.periodType).toBe(GoalPeriodType.MONTHLY);
      expect(result.templateId).toBe(5);
      expect(result.sportType).toBe('Run');
      expect(result.status).toBe(GoalStatus.ACTIVE);
      expect(result.currentValue).toBe(25.5);
      expect(result.completedAt).toBeUndefined();
    });

    it('should handle null optional fields', () => {
      const prismaGoal: PrismaGoal = {
        id: 2,
        userId: 42,
        title: 'General fitness goal',
        description: null,
        targetType: 'FREQUENCY',
        targetValue: 10,
        periodType: 'WEEKLY',
        startDate: new Date('2025-01-06'),
        endDate: new Date('2025-01-12'),
        isRecurring: false,
        recurrenceEndDate: null,
        templateId: null,
        sportType: null,
        status: 'ACTIVE',
        currentValue: 0,
        completedAt: null,
        createdAt: new Date('2025-01-06T08:00:00Z'),
        updatedAt: new Date('2025-01-06T08:00:00Z'),
      };

      const result = GoalMapper.toGraphQL(prismaGoal);

      expect(result.description).toBeUndefined();
      expect(result.templateId).toBeUndefined();
      expect(result.sportType).toBeUndefined();
      expect(result.completedAt).toBeUndefined();
    });

    it('should map completed goal', () => {
      const prismaGoal: PrismaGoal = {
        id: 3,
        userId: 42,
        title: 'Ride 100km',
        description: null,
        targetType: 'DISTANCE',
        targetValue: 100,
        periodType: 'WEEKLY',
        startDate: new Date('2025-01-06'),
        endDate: new Date('2025-01-12'),
        isRecurring: false,
        recurrenceEndDate: null,
        templateId: null,
        sportType: 'Ride',
        status: 'COMPLETED',
        currentValue: 105.3,
        completedAt: new Date('2025-01-11T18:30:00Z'),
        createdAt: new Date('2025-01-06T08:00:00Z'),
        updatedAt: new Date('2025-01-11T18:30:00Z'),
      };

      const result = GoalMapper.toGraphQL(prismaGoal);

      expect(result.status).toBe(GoalStatus.COMPLETED);
      expect(result.currentValue).toBe(105.3);
      expect(result.completedAt).toEqual(new Date('2025-01-11T18:30:00Z'));
    });
  });
});
