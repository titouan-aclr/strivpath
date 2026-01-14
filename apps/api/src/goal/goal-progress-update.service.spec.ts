import { Test, TestingModule } from '@nestjs/testing';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { GoalProgressUpdateService } from './goal-progress-update.service';
import { PrismaService } from '../database/prisma.service';
import { GoalService } from './goal.service';
import { GoalStatus } from './enums/goal-status.enum';
import { NotFoundException } from '@nestjs/common';

describe('GoalProgressUpdateService', () => {
  let service: GoalProgressUpdateService;
  let prisma: DeepMockProxy<PrismaService>;
  let goalService: DeepMockProxy<GoalService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GoalProgressUpdateService,
        { provide: PrismaService, useValue: mockDeep<PrismaService>() },
        { provide: GoalService, useValue: mockDeep<GoalService>() },
      ],
    }).compile();

    service = module.get(GoalProgressUpdateService);
    prisma = module.get(PrismaService);
    goalService = module.get(GoalService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('updateAllGoalsForUser', () => {
    it('should update all active goals for a user', async () => {
      const userId = 1;
      const activeGoals = [{ id: 1 }, { id: 2 }, { id: 3 }];

      prisma.goal.findMany.mockResolvedValue(activeGoals as any);
      prisma.goal.findUnique.mockResolvedValue({ status: 'ACTIVE' } as any);
      goalService.updateGoalProgress.mockResolvedValue(undefined);

      const result = await service.updateAllGoalsForUser(userId);

      expect(prisma.goal.findMany).toHaveBeenCalledWith({
        where: {
          userId,
          status: GoalStatus.ACTIVE,
        },
        select: { id: true },
      });

      expect(goalService.updateGoalProgress).toHaveBeenCalledTimes(3);
      expect(goalService.updateGoalProgress).toHaveBeenCalledWith(1);
      expect(goalService.updateGoalProgress).toHaveBeenCalledWith(2);
      expect(goalService.updateGoalProgress).toHaveBeenCalledWith(3);

      expect(result).toEqual({
        totalGoals: 3,
        successCount: 3,
        failureCount: 0,
        completedGoalIds: [],
        failedGoalIds: [],
        errors: [],
      });
    });

    it('should filter goals by date range when earliestActivityDate is provided', async () => {
      const userId = 1;
      const earliestDate = new Date('2025-01-20');
      const filteredGoals = [{ id: 2 }, { id: 3 }];

      prisma.goal.findMany.mockResolvedValue(filteredGoals as any);
      prisma.goal.findUnique.mockResolvedValue({ status: 'ACTIVE' } as any);
      goalService.updateGoalProgress.mockResolvedValue(undefined);

      const result = await service.updateAllGoalsForUser(userId, earliestDate);

      expect(prisma.goal.findMany).toHaveBeenCalledWith({
        where: {
          userId,
          status: GoalStatus.ACTIVE,
          endDate: { gte: earliestDate },
        },
        select: { id: true },
      });

      expect(result.totalGoals).toBe(2);
      expect(result.successCount).toBe(2);
      expect(result.completedGoalIds).toEqual([]);
      expect(result.failedGoalIds).toEqual([]);
    });

    it('should handle individual goal update failures without stopping', async () => {
      const userId = 1;
      const goals = [{ id: 1 }, { id: 2 }, { id: 3 }];

      prisma.goal.findMany.mockResolvedValue(goals as any);
      prisma.goal.findUnique.mockResolvedValue({ status: 'ACTIVE' } as any);

      goalService.updateGoalProgress.mockImplementation(async (goalId: number) => {
        if (goalId === 2) {
          throw new NotFoundException(`Goal with ID ${goalId} not found`);
        }
        return Promise.resolve();
      });

      const result = await service.updateAllGoalsForUser(userId);

      expect(goalService.updateGoalProgress).toHaveBeenCalledTimes(3);

      expect(result).toEqual({
        totalGoals: 3,
        successCount: 2,
        failureCount: 1,
        completedGoalIds: [],
        failedGoalIds: [],
        errors: [
          {
            goalId: 2,
            error: `Goal with ID 2 not found`,
          },
        ],
      });
    });

    it('should return correct summary with success and failure counts', async () => {
      const userId = 1;
      const goals = [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }];

      prisma.goal.findMany.mockResolvedValue(goals as any);
      prisma.goal.findUnique.mockResolvedValue({ status: 'ACTIVE' } as any);

      goalService.updateGoalProgress.mockImplementation(async (goalId: number) => {
        if (goalId === 2 || goalId === 4) {
          throw new Error('Database error');
        }
        return Promise.resolve();
      });

      const result = await service.updateAllGoalsForUser(userId);

      expect(result.totalGoals).toBe(5);
      expect(result.successCount).toBe(3);
      expect(result.failureCount).toBe(2);
      expect(result.errors).toHaveLength(2);
      expect(result.successCount + result.failureCount).toBe(result.totalGoals);
    });

    it('should return empty result when user has no active goals', async () => {
      const userId = 1;

      prisma.goal.findMany.mockResolvedValue([]);

      const result = await service.updateAllGoalsForUser(userId);

      expect(goalService.updateGoalProgress).not.toHaveBeenCalled();

      expect(result).toEqual({
        totalGoals: 0,
        successCount: 0,
        failureCount: 0,
        completedGoalIds: [],
        failedGoalIds: [],
        errors: [],
      });
    });

    it('should process goals in parallel batches', async () => {
      const userId = 1;
      const goals = Array.from({ length: 12 }, (_, i) => ({ id: i + 1 }));

      prisma.goal.findMany.mockResolvedValue(goals as any);
      prisma.goal.findUnique.mockResolvedValue({ status: 'ACTIVE' } as any);
      goalService.updateGoalProgress.mockResolvedValue(undefined);

      const callOrder: number[] = [];
      goalService.updateGoalProgress.mockImplementation(async (goalId: number) => {
        callOrder.push(goalId);
        return Promise.resolve();
      });

      await service.updateAllGoalsForUser(userId);

      expect(goalService.updateGoalProgress).toHaveBeenCalledTimes(12);

      expect(callOrder).toEqual(expect.arrayContaining([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]));
    });

    it('should handle errors without error message gracefully', async () => {
      const userId = 1;
      const goals = [{ id: 1 }];

      prisma.goal.findMany.mockResolvedValue(goals as any);
      prisma.goal.findUnique.mockResolvedValue({ status: 'ACTIVE' } as any);
      goalService.updateGoalProgress.mockRejectedValue(new Error());

      const result = await service.updateAllGoalsForUser(userId);

      expect(result.errors[0].error).toBe('Unknown error');
    });

    it('should populate completedGoalIds when goals transition to COMPLETED', async () => {
      const userId = 1;
      const goals = [{ id: 1 }, { id: 2 }, { id: 3 }];

      prisma.goal.findMany.mockResolvedValue(goals as any);
      goalService.updateGoalProgress.mockResolvedValue(undefined);

      const callCounts = { 1: 0, 2: 0, 3: 0 };
      (prisma.goal.findUnique.mockImplementation as any)(async ({ where }: any) => {
        const id = where.id;
        callCounts[id]++;

        if (id === 2 && callCounts[id] === 2) {
          return { id: 2, status: 'COMPLETED' } as any;
        }

        return { id, status: 'ACTIVE' } as any;
      });

      const result = await service.updateAllGoalsForUser(userId);

      expect(result.completedGoalIds).toEqual([2]);
      expect(result.successCount).toBe(3);
    });

    it('should populate failedGoalIds when goals transition to FAILED', async () => {
      const userId = 1;
      const goals = [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }];

      prisma.goal.findMany.mockResolvedValue(goals as any);
      goalService.updateGoalProgress.mockResolvedValue(undefined);

      const callCounts = { 1: 0, 2: 0, 3: 0, 4: 0 };
      (prisma.goal.findUnique.mockImplementation as any)(async ({ where }: any) => {
        const id = where.id;
        callCounts[id]++;

        if (id === 2 && callCounts[id] === 2) {
          return { id: 2, status: 'FAILED' } as any;
        }

        if (id === 4 && callCounts[id] === 2) {
          return { id: 4, status: 'FAILED' } as any;
        }

        return { id, status: 'ACTIVE' } as any;
      });

      const result = await service.updateAllGoalsForUser(userId);

      expect(result.failedGoalIds).toEqual([2, 4]);
      expect(result.successCount).toBe(4);
    });

    it('should populate both completedGoalIds and failedGoalIds correctly', async () => {
      const userId = 1;
      const goals = [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }];

      prisma.goal.findMany.mockResolvedValue(goals as any);
      goalService.updateGoalProgress.mockResolvedValue(undefined);

      const callCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      (prisma.goal.findUnique.mockImplementation as any)(async ({ where }: any) => {
        const id = where.id;
        callCounts[id]++;

        if (id === 2 && callCounts[id] === 2) {
          return { id: 2, status: 'COMPLETED' } as any;
        }

        if (id === 3 && callCounts[id] === 2) {
          return { id: 3, status: 'FAILED' } as any;
        }

        if (id === 4 && callCounts[id] === 2) {
          return { id: 4, status: 'COMPLETED' } as any;
        }

        return { id, status: 'ACTIVE' } as any;
      });

      const result = await service.updateAllGoalsForUser(userId);

      expect(result.completedGoalIds).toEqual([2, 4]);
      expect(result.failedGoalIds).toEqual([3]);
      expect(result.successCount).toBe(5);
      expect(result.failureCount).toBe(0);
    });

    it('should handle large batch of 50 goals', async () => {
      const userId = 1;
      const goals = Array.from({ length: 50 }, (_, i) => ({ id: i + 1 }));

      prisma.goal.findMany.mockResolvedValue(goals as any);
      prisma.goal.findUnique.mockResolvedValue({ status: 'ACTIVE' } as any);
      goalService.updateGoalProgress.mockResolvedValue(undefined);

      const result = await service.updateAllGoalsForUser(userId);

      expect(goalService.updateGoalProgress).toHaveBeenCalledTimes(50);
      expect(result.totalGoals).toBe(50);
      expect(result.successCount).toBe(50);
      expect(result.failureCount).toBe(0);
    });

    it('should handle large batch of 100 goals', async () => {
      const userId = 1;
      const goals = Array.from({ length: 100 }, (_, i) => ({ id: i + 1 }));

      prisma.goal.findMany.mockResolvedValue(goals as any);
      prisma.goal.findUnique.mockResolvedValue({ status: 'ACTIVE' } as any);
      goalService.updateGoalProgress.mockResolvedValue(undefined);

      const result = await service.updateAllGoalsForUser(userId);

      expect(goalService.updateGoalProgress).toHaveBeenCalledTimes(100);
      expect(result.totalGoals).toBe(100);
      expect(result.successCount).toBe(100);
      expect(result.failureCount).toBe(0);
    });

    it('should handle large batch with mixed success and failures', async () => {
      const userId = 1;
      const goals = Array.from({ length: 50 }, (_, i) => ({ id: i + 1 }));

      prisma.goal.findMany.mockResolvedValue(goals as any);
      prisma.goal.findUnique.mockResolvedValue({ status: 'ACTIVE' } as any);

      goalService.updateGoalProgress.mockImplementation(async (goalId: number) => {
        if (goalId % 5 === 0) {
          throw new Error('Processing error');
        }
        return Promise.resolve();
      });

      const result = await service.updateAllGoalsForUser(userId);

      expect(result.totalGoals).toBe(50);
      expect(result.successCount).toBe(40);
      expect(result.failureCount).toBe(10);
      expect(result.errors).toHaveLength(10);
    });
  });
});
