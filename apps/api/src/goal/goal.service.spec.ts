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
  sportType: 'Run',
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
  });
});
