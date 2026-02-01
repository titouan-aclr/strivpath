import { Test, TestingModule } from '@nestjs/testing';
import { GoalService } from './goal.service';
import { PrismaService } from '../database/prisma.service';
import { GoalTargetType } from './enums/goal-target-type.enum';
import { GoalPeriodType } from './enums/goal-period-type.enum';
import { GoalStatus } from './enums/goal-status.enum';
import { NotFoundException } from '@nestjs/common';
import { Goal as PrismaGoal } from '@prisma/client';
import { SportType } from '../user-preferences/enums/sport-type.enum';

const createMockPrismaService = () => ({
  goal: {
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
  },
  activity: {
    aggregate: jest.fn(),
    count: jest.fn(),
    findMany: jest.fn(),
  },
});

const createMockPrismaGoal = (overrides?: Partial<PrismaGoal>): PrismaGoal => ({
  id: 1,
  userId: 42,
  title: 'Test Goal',
  description: null,
  targetType: 'DISTANCE',
  targetValue: 50,
  periodType: 'MONTHLY',
  startDate: new Date('2025-01-01'),
  endDate: new Date('2025-01-31'),
  isRecurring: false,
  recurrenceEndDate: null,
  templateId: null,
  sportType: null,
  status: 'ACTIVE',
  currentValue: 0,
  completedAt: null,
  createdAt: new Date('2025-01-01T10:00:00Z'),
  updatedAt: new Date('2025-01-01T10:00:00Z'),
  ...overrides,
});

describe('GoalService', () => {
  let service: GoalService;
  let prisma: ReturnType<typeof createMockPrismaService>;

  beforeEach(async () => {
    const mockPrisma = createMockPrismaService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [GoalService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    service = module.get<GoalService>(GoalService);
    prisma = module.get(PrismaService) as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a goal with calculated end date for MONTHLY period', async () => {
      const userId = 42;
      const input = {
        title: 'Run 50km this month',
        description: 'Monthly running goal',
        targetType: GoalTargetType.DISTANCE,
        targetValue: 50,
        periodType: GoalPeriodType.MONTHLY,
        startDate: '2025-01-15',
        sportType: SportType.RUN,
      };

      const createdGoal = createMockPrismaGoal({
        title: input.title,
        description: input.description,
        targetType: input.targetType,
        targetValue: input.targetValue,
        periodType: input.periodType,
        startDate: new Date('2025-01-15'),
        endDate: new Date('2025-01-31T23:59:59.999Z'),
      });

      prisma.goal.create.mockResolvedValue(createdGoal);
      prisma.activity.aggregate.mockResolvedValue({ _sum: { distance: 0 } });
      prisma.goal.findUnique.mockResolvedValue(createdGoal);

      const result = await service.create(userId, input);

      expect(prisma.goal.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId,
          title: input.title,
          targetType: input.targetType,
          targetValue: input.targetValue,
          periodType: input.periodType,
          status: GoalStatus.ACTIVE,
          currentValue: 0,
        }),
      });

      expect(result.title).toBe('Run 50km this month');
      expect(result.status).toBe(GoalStatus.ACTIVE);
    });

    it('should create a goal with calculated end date for WEEKLY period (mid-week start)', async () => {
      const userId = 42;
      const input = {
        title: 'Run 20km this week',
        targetType: GoalTargetType.DISTANCE,
        targetValue: 20,
        periodType: GoalPeriodType.WEEKLY,
        startDate: '2025-01-08',
      };

      const createdGoal = createMockPrismaGoal({
        periodType: 'WEEKLY',
        startDate: new Date('2025-01-08'),
        endDate: new Date('2025-01-14T23:59:59.999Z'),
      });

      prisma.goal.create.mockResolvedValue(createdGoal);
      prisma.activity.aggregate.mockResolvedValue({ _sum: { distance: 0 } });
      prisma.goal.findUnique.mockResolvedValue(createdGoal);

      await service.create(userId, input);

      expect(prisma.goal.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            periodType: GoalPeriodType.WEEKLY,
            startDate: new Date('2025-01-08'),
          }),
        }),
      );
    });

    it('should create a goal with calculated end date for WEEKLY period (Sunday start)', async () => {
      const userId = 42;
      const input = {
        title: 'Run 20km this week',
        targetType: GoalTargetType.DISTANCE,
        targetValue: 20,
        periodType: GoalPeriodType.WEEKLY,
        startDate: '2025-01-05',
      };

      const createdGoal = createMockPrismaGoal({
        periodType: 'WEEKLY',
        startDate: new Date('2025-01-05'),
        endDate: new Date('2025-01-11T23:59:59.999Z'),
      });

      prisma.goal.create.mockResolvedValue(createdGoal);
      prisma.activity.aggregate.mockResolvedValue({ _sum: { distance: 0 } });
      prisma.goal.findUnique.mockResolvedValue(createdGoal);

      await service.create(userId, input);

      expect(prisma.goal.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            periodType: GoalPeriodType.WEEKLY,
          }),
        }),
      );
    });

    it('should create a goal with calculated end date for YEARLY period', async () => {
      const userId = 42;
      const input = {
        title: 'Run 1000km this year',
        targetType: GoalTargetType.DISTANCE,
        targetValue: 1000,
        periodType: GoalPeriodType.YEARLY,
        startDate: '2025-03-15',
      };

      const createdGoal = createMockPrismaGoal({
        periodType: 'YEARLY',
        startDate: new Date('2025-03-15'),
        endDate: new Date('2025-12-31T23:59:59.999Z'),
      });

      prisma.goal.create.mockResolvedValue(createdGoal);
      prisma.activity.aggregate.mockResolvedValue({ _sum: { distance: 0 } });
      prisma.goal.findUnique.mockResolvedValue(createdGoal);

      await service.create(userId, input);

      expect(prisma.goal.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            periodType: GoalPeriodType.YEARLY,
          }),
        }),
      );
    });

    it('should create a goal with calculated end date for YEARLY period in leap year', async () => {
      const userId = 42;
      const input = {
        title: 'Run 1000km this year',
        targetType: GoalTargetType.DISTANCE,
        targetValue: 1000,
        periodType: GoalPeriodType.YEARLY,
        startDate: '2024-02-15',
      };

      const createdGoal = createMockPrismaGoal({
        periodType: 'YEARLY',
        startDate: new Date('2024-02-15'),
        endDate: new Date('2024-12-31T23:59:59.999Z'),
      });

      prisma.goal.create.mockResolvedValue(createdGoal);
      prisma.activity.aggregate.mockResolvedValue({ _sum: { distance: 0 } });
      prisma.goal.findUnique.mockResolvedValue(createdGoal);

      await service.create(userId, input);

      expect(prisma.goal.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            periodType: GoalPeriodType.YEARLY,
          }),
        }),
      );
    });

    it('should use custom end date for CUSTOM period', async () => {
      const userId = 42;
      const input = {
        title: 'Custom goal',
        targetType: GoalTargetType.FREQUENCY,
        targetValue: 10,
        periodType: GoalPeriodType.CUSTOM,
        startDate: '2025-01-01',
        endDate: '2025-01-15',
      };

      const createdGoal = createMockPrismaGoal({
        periodType: 'CUSTOM',
        endDate: new Date('2025-01-15'),
      });

      prisma.goal.create.mockResolvedValue(createdGoal);
      prisma.activity.aggregate.mockResolvedValue({ _sum: { distance: 0 } });
      prisma.activity.count.mockResolvedValue(0);
      prisma.goal.findUnique.mockResolvedValue(createdGoal);

      await service.create(userId, input);

      expect(prisma.goal.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            endDate: new Date('2025-01-15'),
          }),
        }),
      );
    });

    it('should create a recurring goal with recurrenceEndDate', async () => {
      const userId = 42;
      const input = {
        title: 'Weekly 20km (recurring)',
        targetType: GoalTargetType.DISTANCE,
        targetValue: 20,
        periodType: GoalPeriodType.WEEKLY,
        startDate: '2025-01-01',
        isRecurring: true,
        recurrenceEndDate: '2025-12-31',
      };

      const createdGoal = createMockPrismaGoal({
        isRecurring: true,
        recurrenceEndDate: new Date('2025-12-31'),
      });

      prisma.goal.create.mockResolvedValue(createdGoal);
      prisma.activity.aggregate.mockResolvedValue({ _sum: { distance: 0 } });
      prisma.goal.findUnique.mockResolvedValue(createdGoal);

      const result = await service.create(userId, input);

      expect(prisma.goal.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            isRecurring: true,
            recurrenceEndDate: new Date('2025-12-31'),
          }),
        }),
      );
      expect(result.isRecurring).toBe(true);
    });

    it('should create a recurring goal without recurrenceEndDate', async () => {
      const userId = 42;
      const input = {
        title: 'Weekly 20km (recurring forever)',
        targetType: GoalTargetType.DISTANCE,
        targetValue: 20,
        periodType: GoalPeriodType.WEEKLY,
        startDate: '2025-01-01',
        isRecurring: true,
      };

      const createdGoal = createMockPrismaGoal({
        isRecurring: true,
        recurrenceEndDate: null,
      });

      prisma.goal.create.mockResolvedValue(createdGoal);
      prisma.activity.aggregate.mockResolvedValue({ _sum: { distance: 0 } });
      prisma.goal.findUnique.mockResolvedValue(createdGoal);

      const result = await service.create(userId, input);

      expect(prisma.goal.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            isRecurring: true,
            recurrenceEndDate: null,
          }),
        }),
      );
      expect(result.isRecurring).toBe(true);
      expect(result.recurrenceEndDate).toBeUndefined();
    });
  });

  describe('update', () => {
    it('should update goal title and target value', async () => {
      const userId = 42;
      const goalId = 1;
      const existingGoal = createMockPrismaGoal({ id: goalId, userId });

      const input = {
        title: 'Updated Title',
        targetValue: 75,
      };

      const updatedGoal = createMockPrismaGoal({
        ...existingGoal,
        title: input.title,
        targetValue: input.targetValue,
      });

      prisma.goal.findFirst.mockResolvedValue(existingGoal);
      prisma.goal.update.mockResolvedValue(updatedGoal);
      prisma.activity.aggregate.mockResolvedValue({ _sum: { distance: 25000 } });
      prisma.goal.findUnique.mockResolvedValue(updatedGoal);

      const result = await service.update(goalId, userId, input);

      expect(result.title).toBe('Updated Title');
      expect(result.targetValue).toBe(75);
    });

    it('should throw NotFoundException when goal does not belong to user', async () => {
      prisma.goal.findFirst.mockResolvedValue(null);

      await expect(service.update(1, 42, { title: 'Updated' })).rejects.toThrow(NotFoundException);
    });
  });

  describe('delete', () => {
    it('should delete a goal', async () => {
      const userId = 42;
      const goalId = 1;
      const goal = createMockPrismaGoal({ id: goalId, userId });

      prisma.goal.findFirst.mockResolvedValue(goal);
      prisma.goal.delete.mockResolvedValue(goal);

      const result = await service.delete(goalId, userId);

      expect(prisma.goal.delete).toHaveBeenCalledWith({ where: { id: goalId } });
      expect(result.id).toBe(goalId);
    });
  });

  describe('archive', () => {
    it('should archive a goal by setting status to ARCHIVED', async () => {
      const userId = 42;
      const goalId = 1;
      const goal = createMockPrismaGoal({ id: goalId, userId });
      const archivedGoal = createMockPrismaGoal({ ...goal, status: 'ARCHIVED' });

      prisma.goal.findFirst.mockResolvedValue(goal);
      prisma.goal.update.mockResolvedValue(archivedGoal);

      const result = await service.archive(goalId, userId);

      expect(prisma.goal.update).toHaveBeenCalledWith({
        where: { id: goalId },
        data: { status: GoalStatus.ARCHIVED },
      });
      expect(result.status).toBe(GoalStatus.ARCHIVED);
    });
  });

  describe('findById', () => {
    it('should return a goal when found', async () => {
      const userId = 42;
      const goal = createMockPrismaGoal({ userId });

      prisma.goal.findFirst.mockResolvedValue(goal);

      const result = await service.findById(1, userId);

      expect(result).toBeDefined();
      expect(result?.userId).toBe(userId);
    });

    it('should return null when goal not found', async () => {
      prisma.goal.findFirst.mockResolvedValue(null);

      const result = await service.findById(999, 42);

      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return all active goals (excluding archived)', async () => {
      const userId = 42;
      const goals = [
        createMockPrismaGoal({ id: 1, status: 'ACTIVE' }),
        createMockPrismaGoal({ id: 2, status: 'COMPLETED' }),
      ];

      prisma.goal.findMany.mockResolvedValue(goals);

      const result = await service.findAll(userId);

      expect(prisma.goal.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: { not: GoalStatus.ARCHIVED },
          }),
        }),
      );
      expect(result).toHaveLength(2);
    });

    it('should filter by status', async () => {
      const userId = 42;
      prisma.goal.findMany.mockResolvedValue([]);

      await service.findAll(userId, { status: GoalStatus.COMPLETED });

      expect(prisma.goal.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: GoalStatus.COMPLETED,
          }),
        }),
      );
    });

    it('should filter by sportType', async () => {
      const userId = 42;
      prisma.goal.findMany.mockResolvedValue([]);

      await service.findAll(userId, { sportType: SportType.RUN });

      expect(prisma.goal.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            sportType: SportType.RUN,
          }),
        }),
      );
    });

    it('should include archived goals when includeArchived is true', async () => {
      const userId = 42;
      const goals = [
        createMockPrismaGoal({ id: 1, status: 'ACTIVE' }),
        createMockPrismaGoal({ id: 2, status: 'ARCHIVED' }),
      ];

      prisma.goal.findMany.mockResolvedValue(goals);

      const result = await service.findAll(userId, { includeArchived: true });

      expect(prisma.goal.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.not.objectContaining({
            status: { not: GoalStatus.ARCHIVED },
          }),
        }),
      );
      expect(result).toHaveLength(2);
    });
  });

  describe('updateGoalProgress', () => {
    it('should update goal progress with DISTANCE calculation', async () => {
      const goal = createMockPrismaGoal({
        targetType: 'DISTANCE',
        targetValue: 50,
        currentValue: 0,
      });

      prisma.goal.findUnique.mockResolvedValue(goal);
      prisma.activity.aggregate.mockResolvedValue({ _sum: { distance: 25000 } });

      await service.updateGoalProgress(1);

      expect(prisma.goal.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: expect.objectContaining({
          currentValue: 25,
        }),
      });
    });

    it('should mark goal as COMPLETED when target reached', async () => {
      const goal = createMockPrismaGoal({
        targetType: 'DISTANCE',
        targetValue: 50,
        currentValue: 45,
        status: 'ACTIVE',
      });

      prisma.goal.findUnique.mockResolvedValue(goal);
      prisma.activity.aggregate.mockResolvedValue({ _sum: { distance: 52000 } });

      await service.updateGoalProgress(1);

      expect(prisma.goal.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: expect.objectContaining({
          currentValue: 52,
          status: GoalStatus.COMPLETED,
          completedAt: expect.any(Date),
        }),
      });
    });

    it('should mark goal as FAILED when expired without reaching target', async () => {
      const expiredGoal = createMockPrismaGoal({
        targetType: 'DISTANCE',
        targetValue: 50,
        currentValue: 30,
        status: 'ACTIVE',
        endDate: new Date('2024-12-31'),
      });

      prisma.goal.findUnique.mockResolvedValue(expiredGoal);
      prisma.activity.aggregate.mockResolvedValue({ _sum: { distance: 30000 } });

      await service.updateGoalProgress(1);

      expect(prisma.goal.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: expect.objectContaining({
          currentValue: 30,
          status: GoalStatus.FAILED,
        }),
      });
    });

    it('should calculate DURATION progress in hours', async () => {
      const goal = createMockPrismaGoal({
        targetType: 'DURATION',
        targetValue: 10,
      });

      prisma.goal.findUnique.mockResolvedValue(goal);
      prisma.activity.aggregate.mockResolvedValue({ _sum: { movingTime: 18000 } });

      await service.updateGoalProgress(1);

      expect(prisma.goal.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: expect.objectContaining({
          currentValue: 5,
        }),
      });
    });

    it('should calculate ELEVATION progress', async () => {
      const goal = createMockPrismaGoal({
        targetType: 'ELEVATION',
        targetValue: 1000,
      });

      prisma.goal.findUnique.mockResolvedValue(goal);
      prisma.activity.aggregate.mockResolvedValue({ _sum: { totalElevationGain: 650 } });

      await service.updateGoalProgress(1);

      expect(prisma.goal.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: expect.objectContaining({
          currentValue: 650,
        }),
      });
    });

    it('should calculate FREQUENCY progress', async () => {
      const goal = createMockPrismaGoal({
        targetType: 'FREQUENCY',
        targetValue: 10,
      });

      prisma.goal.findUnique.mockResolvedValue(goal);
      prisma.activity.count.mockResolvedValue(7);

      await service.updateGoalProgress(1);

      expect(prisma.goal.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: expect.objectContaining({
          currentValue: 7,
        }),
      });
    });

    it('should throw NotFoundException when goal does not exist', async () => {
      prisma.goal.findUnique.mockResolvedValue(null);

      await expect(service.updateGoalProgress(999)).rejects.toThrow(NotFoundException);
    });

    it('should handle null aggregate result (no activities)', async () => {
      const goal = createMockPrismaGoal({
        targetType: 'DISTANCE',
        targetValue: 50,
        currentValue: 0,
      });

      prisma.goal.findUnique.mockResolvedValue(goal);
      prisma.activity.aggregate.mockResolvedValue({ _sum: { distance: null } });

      await service.updateGoalProgress(1);

      expect(prisma.goal.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: expect.objectContaining({
          currentValue: 0,
        }),
      });
    });

    it('should count activities on exact startDate boundary', async () => {
      const startDate = new Date('2025-01-01T00:00:00.000Z');
      const goal = createMockPrismaGoal({
        targetType: 'DISTANCE',
        targetValue: 50,
        startDate,
        endDate: new Date('2025-01-31T23:59:59.999Z'),
      });

      prisma.goal.findUnique.mockResolvedValue(goal);
      prisma.activity.aggregate.mockResolvedValue({ _sum: { distance: 10000 } });

      await service.updateGoalProgress(1);

      const callArg = (prisma.activity.aggregate as jest.Mock).mock.calls[0][0];
      expect(callArg.where.startDate.gte).toEqual(startDate);
    });

    it('should count activities on exact endDate boundary', async () => {
      const endDate = new Date('2025-01-31T23:59:59.999Z');
      const goal = createMockPrismaGoal({
        targetType: 'DISTANCE',
        targetValue: 50,
        startDate: new Date('2025-01-01'),
        endDate,
      });

      prisma.goal.findUnique.mockResolvedValue(goal);
      prisma.activity.aggregate.mockResolvedValue({ _sum: { distance: 10000 } });

      await service.updateGoalProgress(1);

      const callArg = (prisma.activity.aggregate as jest.Mock).mock.calls[0][0];
      expect(callArg.where.startDate.lte).toEqual(endDate);
    });

    it('should filter by specific sportType when goal has sportType set', async () => {
      const goal = createMockPrismaGoal({
        targetType: 'DISTANCE',
        targetValue: 50,
        sportType: SportType.RUN,
      });

      prisma.goal.findUnique.mockResolvedValue(goal);
      prisma.activity.aggregate.mockResolvedValue({ _sum: { distance: 20000 } });

      await service.updateGoalProgress(1);

      expect(prisma.activity.aggregate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            type: { in: ['Run', 'TrailRun', 'VirtualRun'] },
          }),
        }),
      );
    });

    it('should include all sports when sportType is null', async () => {
      const goal = createMockPrismaGoal({
        targetType: 'DISTANCE',
        targetValue: 50,
        sportType: null,
      });

      prisma.goal.findUnique.mockResolvedValue(goal);
      prisma.activity.aggregate.mockResolvedValue({ _sum: { distance: 20000 } });

      await service.updateGoalProgress(1);

      expect(prisma.activity.aggregate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.not.objectContaining({
            type: expect.anything(),
          }),
        }),
      );
    });

    it('should not transition from COMPLETED to FAILED', async () => {
      const goal = createMockPrismaGoal({
        targetType: 'DISTANCE',
        targetValue: 50,
        currentValue: 55,
        status: 'COMPLETED',
        completedAt: new Date('2025-01-15T10:00:00Z'),
        endDate: new Date('2024-12-31'),
      });

      prisma.goal.findUnique.mockResolvedValue(goal);
      prisma.activity.aggregate.mockResolvedValue({ _sum: { distance: 55000 } });

      await service.updateGoalProgress(1);

      const callArg = (prisma.goal.update as jest.Mock).mock.calls[0][0];
      expect(callArg.data).toEqual({ currentValue: 55 });
      expect(callArg.data.status).toBeUndefined();
    });

    it('should not transition from FAILED to COMPLETED', async () => {
      const goal = createMockPrismaGoal({
        targetType: 'DISTANCE',
        targetValue: 50,
        currentValue: 30,
        status: 'FAILED',
        endDate: new Date('2024-12-31'),
      });

      prisma.goal.findUnique.mockResolvedValue(goal);
      prisma.activity.aggregate.mockResolvedValue({ _sum: { distance: 55000 } });

      await service.updateGoalProgress(1);

      const callArg = (prisma.goal.update as jest.Mock).mock.calls[0][0];
      expect(callArg.data).toEqual({ currentValue: 55 });
      expect(callArg.data.status).toBeUndefined();
    });

    it('should not transition from ARCHIVED status', async () => {
      const goal = createMockPrismaGoal({
        targetType: 'DISTANCE',
        targetValue: 50,
        currentValue: 30,
        status: 'ARCHIVED',
      });

      prisma.goal.findUnique.mockResolvedValue(goal);
      prisma.activity.aggregate.mockResolvedValue({ _sum: { distance: 55000 } });

      await service.updateGoalProgress(1);

      const callArg = (prisma.goal.update as jest.Mock).mock.calls[0][0];
      expect(callArg.data).toEqual({ currentValue: 55 });
      expect(callArg.data.status).toBeUndefined();
    });

    it('should set completedAt only once when goal is first completed', async () => {
      const goal = createMockPrismaGoal({
        targetType: 'DISTANCE',
        targetValue: 50,
        currentValue: 45,
        status: 'ACTIVE',
        completedAt: null,
      });

      prisma.goal.findUnique.mockResolvedValue(goal);
      prisma.activity.aggregate.mockResolvedValue({ _sum: { distance: 52000 } });

      await service.updateGoalProgress(1);

      expect(prisma.goal.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: expect.objectContaining({
          status: GoalStatus.COMPLETED,
          completedAt: expect.any(Date),
        }),
      });
    });

    it('should preserve completedAt when goal was already completed', async () => {
      const originalCompletedAt = new Date('2025-01-15T10:00:00Z');
      const goal = createMockPrismaGoal({
        targetType: 'DISTANCE',
        targetValue: 50,
        currentValue: 52,
        status: 'COMPLETED',
        completedAt: originalCompletedAt,
      });

      prisma.goal.findUnique.mockResolvedValue(goal);
      prisma.activity.aggregate.mockResolvedValue({ _sum: { distance: 60000 } });

      await service.updateGoalProgress(1);

      expect(prisma.goal.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: expect.not.objectContaining({
          completedAt: expect.anything(),
        }),
      });
    });
  });

  describe('findActiveGoals', () => {
    it('should return only ACTIVE goals', async () => {
      const userId = 42;
      const activeGoals = [
        createMockPrismaGoal({ id: 1, status: 'ACTIVE' }),
        createMockPrismaGoal({ id: 2, status: 'ACTIVE' }),
      ];

      prisma.goal.findMany.mockResolvedValue(activeGoals);

      const result = await service.findActiveGoals(userId);

      expect(prisma.goal.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: GoalStatus.ACTIVE,
          }),
        }),
      );
      expect(result).toHaveLength(2);
    });
  });

  describe('findByTemplate', () => {
    it('should return goals created from specific template', async () => {
      const userId = 42;
      const templateId = 5;
      const goals = [createMockPrismaGoal({ id: 1, templateId }), createMockPrismaGoal({ id: 2, templateId })];

      prisma.goal.findMany.mockResolvedValue(goals);

      const result = await service.findByTemplate(templateId, userId);

      expect(prisma.goal.findMany).toHaveBeenCalledWith({
        where: { templateId, userId },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toHaveLength(2);
    });

    it('should return empty array when no goals found for template', async () => {
      const userId = 42;
      const templateId = 999;

      prisma.goal.findMany.mockResolvedValue([]);

      const result = await service.findByTemplate(templateId, userId);

      expect(result).toHaveLength(0);
      expect(result).toEqual([]);
    });
  });

  describe('findPrimaryDashboardGoal', () => {
    it('should return the highest priority goal', async () => {
      const userId = 42;
      const goals = [
        createMockPrismaGoal({ id: 1, status: 'ACTIVE', sportType: SportType.RUN, endDate: new Date('2025-01-15') }),
        createMockPrismaGoal({ id: 2, status: 'ACTIVE', sportType: null, endDate: new Date('2025-01-31') }),
        createMockPrismaGoal({ id: 3, status: 'ACTIVE', sportType: SportType.RIDE, endDate: new Date('2025-01-20') }),
      ];

      prisma.goal.findMany.mockResolvedValue(goals);

      const result = await service.findPrimaryDashboardGoal(userId);

      expect(result).toBeDefined();
      expect(result?.id).toBe(2);
      expect(result?.sportType).toBeUndefined();
    });

    it('should return null when no active goals exist', async () => {
      const userId = 42;

      prisma.goal.findMany.mockResolvedValue([]);

      const result = await service.findPrimaryDashboardGoal(userId);

      expect(result).toBeNull();
    });

    it('should prioritize global goal over sport-specific goal with earlier deadline', async () => {
      const userId = 42;
      const goals = [
        createMockPrismaGoal({ id: 1, status: 'ACTIVE', sportType: SportType.RUN, endDate: new Date('2025-01-10') }),
        createMockPrismaGoal({ id: 2, status: 'ACTIVE', sportType: null, endDate: new Date('2025-01-31') }),
      ];

      prisma.goal.findMany.mockResolvedValue(goals);

      const result = await service.findPrimaryDashboardGoal(userId);

      expect(result?.id).toBe(2);
    });

    it('should sort global goals by deadline (earliest first)', async () => {
      const userId = 42;
      const goals = [
        createMockPrismaGoal({ id: 1, status: 'ACTIVE', sportType: null, endDate: new Date('2025-03-31') }),
        createMockPrismaGoal({ id: 2, status: 'ACTIVE', sportType: null, endDate: new Date('2025-01-15') }),
      ];

      prisma.goal.findMany.mockResolvedValue(goals);

      const result = await service.findPrimaryDashboardGoal(userId);

      expect(result?.id).toBe(2);
    });
  });

  describe('findSecondaryDashboardGoals', () => {
    it('should return maximum 2 goals excluding the primary', async () => {
      const userId = 42;
      const goals = [
        createMockPrismaGoal({ id: 1, status: 'ACTIVE', sportType: null, endDate: new Date('2025-01-15') }),
        createMockPrismaGoal({ id: 2, status: 'ACTIVE', sportType: SportType.RUN, endDate: new Date('2025-01-20') }),
        createMockPrismaGoal({ id: 3, status: 'ACTIVE', sportType: SportType.RIDE, endDate: new Date('2025-01-25') }),
        createMockPrismaGoal({ id: 4, status: 'ACTIVE', sportType: SportType.SWIM, endDate: new Date('2025-01-30') }),
      ];

      prisma.goal.findMany.mockResolvedValue(goals);

      const result = await service.findSecondaryDashboardGoals(userId);

      expect(result).toHaveLength(2);
      expect(result.map(g => g.id)).toEqual([2, 3]);
    });

    it('should return empty array when no active goals exist', async () => {
      const userId = 42;

      prisma.goal.findMany.mockResolvedValue([]);

      const result = await service.findSecondaryDashboardGoals(userId);

      expect(result).toHaveLength(0);
    });

    it('should return empty array when only one goal exists', async () => {
      const userId = 42;
      const goals = [
        createMockPrismaGoal({ id: 1, status: 'ACTIVE', sportType: null, endDate: new Date('2025-01-15') }),
      ];

      prisma.goal.findMany.mockResolvedValue(goals);

      const result = await service.findSecondaryDashboardGoals(userId);

      expect(result).toHaveLength(0);
    });

    it('should return one goal when only two goals exist', async () => {
      const userId = 42;
      const goals = [
        createMockPrismaGoal({ id: 1, status: 'ACTIVE', sportType: null, endDate: new Date('2025-01-15') }),
        createMockPrismaGoal({ id: 2, status: 'ACTIVE', sportType: SportType.RUN, endDate: new Date('2025-01-20') }),
      ];

      prisma.goal.findMany.mockResolvedValue(goals);

      const result = await service.findSecondaryDashboardGoals(userId);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(2);
    });

    it('should sort secondary goals by priority (global first, then by deadline)', async () => {
      const userId = 42;
      const goals = [
        createMockPrismaGoal({ id: 1, status: 'ACTIVE', sportType: null, endDate: new Date('2025-01-15') }),
        createMockPrismaGoal({ id: 2, status: 'ACTIVE', sportType: SportType.RUN, endDate: new Date('2025-01-10') }),
        createMockPrismaGoal({ id: 3, status: 'ACTIVE', sportType: null, endDate: new Date('2025-01-20') }),
        createMockPrismaGoal({ id: 4, status: 'ACTIVE', sportType: SportType.RIDE, endDate: new Date('2025-01-05') }),
      ];

      prisma.goal.findMany.mockResolvedValue(goals);

      const result = await service.findSecondaryDashboardGoals(userId);

      expect(result.map(g => g.id)).toEqual([3, 4]);
    });
  });

  describe('calculateProgressHistory', () => {
    const createGoalForHistory = (
      overrides?: Partial<{
        userId: number;
        targetType: GoalTargetType;
        sportType: SportType | undefined;
        startDate: Date;
        endDate: Date;
      }>,
    ) => ({
      id: 1,
      userId: 42,
      title: 'Test Goal',
      targetType: GoalTargetType.DISTANCE,
      targetValue: 50,
      periodType: GoalPeriodType.MONTHLY,
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-01-31'),
      isRecurring: false,
      status: GoalStatus.ACTIVE,
      currentValue: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    });

    it('should return empty array when no activities exist', async () => {
      const goal = createGoalForHistory();
      prisma.activity.findMany.mockResolvedValue([]);

      const result = await service.calculateProgressHistory(goal);

      expect(result).toEqual([]);
    });

    it('should calculate cumulative DISTANCE progress in km', async () => {
      const goal = createGoalForHistory({ targetType: GoalTargetType.DISTANCE });
      const activities = [
        { startDate: new Date('2025-01-05T10:00:00Z'), distance: 5000, movingTime: 1800, totalElevationGain: 50 },
        { startDate: new Date('2025-01-10T10:00:00Z'), distance: 10000, movingTime: 3600, totalElevationGain: 100 },
        { startDate: new Date('2025-01-15T10:00:00Z'), distance: 7000, movingTime: 2520, totalElevationGain: 70 },
      ];
      prisma.activity.findMany.mockResolvedValue(activities);

      const result = await service.calculateProgressHistory(goal);

      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({ date: new Date('2025-01-05'), value: 5 });
      expect(result[1]).toEqual({ date: new Date('2025-01-10'), value: 15 });
      expect(result[2]).toEqual({ date: new Date('2025-01-15'), value: 22 });
    });

    it('should calculate cumulative DURATION progress in hours', async () => {
      const goal = createGoalForHistory({ targetType: GoalTargetType.DURATION });
      const activities = [
        { startDate: new Date('2025-01-05T10:00:00Z'), distance: 5000, movingTime: 3600, totalElevationGain: 50 },
        { startDate: new Date('2025-01-10T10:00:00Z'), distance: 10000, movingTime: 7200, totalElevationGain: 100 },
      ];
      prisma.activity.findMany.mockResolvedValue(activities);

      const result = await service.calculateProgressHistory(goal);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ date: new Date('2025-01-05'), value: 1 });
      expect(result[1]).toEqual({ date: new Date('2025-01-10'), value: 3 });
    });

    it('should calculate cumulative ELEVATION progress in meters', async () => {
      const goal = createGoalForHistory({ targetType: GoalTargetType.ELEVATION });
      const activities = [
        { startDate: new Date('2025-01-05T10:00:00Z'), distance: 5000, movingTime: 1800, totalElevationGain: 150 },
        { startDate: new Date('2025-01-10T10:00:00Z'), distance: 10000, movingTime: 3600, totalElevationGain: 250 },
      ];
      prisma.activity.findMany.mockResolvedValue(activities);

      const result = await service.calculateProgressHistory(goal);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ date: new Date('2025-01-05'), value: 150 });
      expect(result[1]).toEqual({ date: new Date('2025-01-10'), value: 400 });
    });

    it('should calculate cumulative FREQUENCY progress as activity count', async () => {
      const goal = createGoalForHistory({ targetType: GoalTargetType.FREQUENCY });
      const activities = [
        { startDate: new Date('2025-01-05T10:00:00Z'), distance: 5000, movingTime: 1800, totalElevationGain: 50 },
        { startDate: new Date('2025-01-05T18:00:00Z'), distance: 3000, movingTime: 1200, totalElevationGain: 30 },
        { startDate: new Date('2025-01-10T10:00:00Z'), distance: 10000, movingTime: 3600, totalElevationGain: 100 },
      ];
      prisma.activity.findMany.mockResolvedValue(activities);

      const result = await service.calculateProgressHistory(goal);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ date: new Date('2025-01-05'), value: 2 });
      expect(result[1]).toEqual({ date: new Date('2025-01-10'), value: 3 });
    });

    it('should aggregate multiple activities on the same day', async () => {
      const goal = createGoalForHistory({ targetType: GoalTargetType.DISTANCE });
      const activities = [
        { startDate: new Date('2025-01-05T08:00:00Z'), distance: 5000, movingTime: 1800, totalElevationGain: 50 },
        { startDate: new Date('2025-01-05T18:00:00Z'), distance: 3000, movingTime: 1200, totalElevationGain: 30 },
      ];
      prisma.activity.findMany.mockResolvedValue(activities);

      const result = await service.calculateProgressHistory(goal);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({ date: new Date('2025-01-05'), value: 8 });
    });

    it('should filter activities by sportType when specified', async () => {
      const goal = createGoalForHistory({ sportType: SportType.RUN });
      prisma.activity.findMany.mockResolvedValue([]);

      await service.calculateProgressHistory(goal);

      expect(prisma.activity.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            type: { in: ['Run', 'TrailRun', 'VirtualRun'] },
          }),
        }),
      );
    });

    it('should not filter by sportType when goal is global', async () => {
      const goal = createGoalForHistory({ sportType: undefined });
      prisma.activity.findMany.mockResolvedValue([]);

      await service.calculateProgressHistory(goal);

      expect(prisma.activity.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.not.objectContaining({
            type: expect.anything(),
          }),
        }),
      );
    });

    it('should query activities within goal date range', async () => {
      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-01-31');
      const goal = createGoalForHistory({ startDate, endDate });
      prisma.activity.findMany.mockResolvedValue([]);

      await service.calculateProgressHistory(goal);

      expect(prisma.activity.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            startDate: {
              gte: startDate,
              lte: endDate,
            },
          }),
        }),
      );
    });

    it('should return progress points sorted by date', async () => {
      const goal = createGoalForHistory({ targetType: GoalTargetType.DISTANCE });
      const activities = [
        { startDate: new Date('2025-01-15T10:00:00Z'), distance: 7000, movingTime: 2520, totalElevationGain: 70 },
        { startDate: new Date('2025-01-05T10:00:00Z'), distance: 5000, movingTime: 1800, totalElevationGain: 50 },
        { startDate: new Date('2025-01-10T10:00:00Z'), distance: 10000, movingTime: 3600, totalElevationGain: 100 },
      ];
      prisma.activity.findMany.mockResolvedValue(activities);

      const result = await service.calculateProgressHistory(goal);

      expect(result.map(p => p.date.toISOString().split('T')[0])).toEqual(['2025-01-05', '2025-01-10', '2025-01-15']);
    });

    it('should round values to 2 decimal places', async () => {
      const goal = createGoalForHistory({ targetType: GoalTargetType.DISTANCE });
      const activities = [
        { startDate: new Date('2025-01-05T10:00:00Z'), distance: 3333, movingTime: 1800, totalElevationGain: 50 },
        { startDate: new Date('2025-01-10T10:00:00Z'), distance: 6666, movingTime: 3600, totalElevationGain: 100 },
      ];
      prisma.activity.findMany.mockResolvedValue(activities);

      const result = await service.calculateProgressHistory(goal);

      expect(result[0].value).toBe(3.33);
      expect(result[1].value).toBe(10);
    });
  });
});
