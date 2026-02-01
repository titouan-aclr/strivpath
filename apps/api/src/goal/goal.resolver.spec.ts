import { Test, TestingModule } from '@nestjs/testing';
import { GoalResolver } from './goal.resolver';
import { GoalService } from './goal.service';
import { GoalTemplateService } from './goal-template.service';
import { TokenPayload } from '../auth/types/token-payload.interface';
import { Goal } from './models/goal.model';
import { GoalTemplate } from './models/goal-template.model';
import { GoalTargetType } from './enums/goal-target-type.enum';
import { GoalPeriodType } from './enums/goal-period-type.enum';
import { GoalStatus } from './enums/goal-status.enum';
import { Locale } from './enums/locale.enum';
import { CreateGoalInput, UpdateGoalInput } from './dto/goal.input';

describe('GoalResolver', () => {
  let resolver: GoalResolver;
  let goalService: GoalService;
  let goalTemplateService: GoalTemplateService;

  const mockGoalService = {
    findAll: jest.fn(),
    findById: jest.fn(),
    findActiveGoals: jest.fn(),
    findPrimaryDashboardGoal: jest.fn(),
    findSecondaryDashboardGoals: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    archive: jest.fn(),
    updateGoalProgress: jest.fn(),
  };

  const mockGoalTemplateService = {
    findAll: jest.fn(),
    findByCategory: jest.fn(),
    createFromTemplate: jest.fn(),
  };

  const mockTokenPayload: TokenPayload = {
    sub: 1,
    stravaId: 12345,
  };

  const mockGoal: Goal = {
    id: 1,
    userId: 1,
    title: 'Courir 50km ce mois',
    description: 'Objectif de distance mensuel',
    targetType: GoalTargetType.DISTANCE,
    targetValue: 50,
    periodType: GoalPeriodType.MONTHLY,
    startDate: new Date('2025-01-01'),
    endDate: new Date('2025-01-31'),
    isRecurring: false,
    recurrenceEndDate: undefined,
    sportType: undefined,
    status: GoalStatus.ACTIVE,
    currentValue: 23.5,
    completedAt: undefined,
    templateId: undefined,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockGoalTemplate: GoalTemplate = {
    id: 1,
    title: 'Run 50km this month',
    description: 'Intermediate running goal',
    targetType: GoalTargetType.DISTANCE,
    targetValue: 50,
    periodType: GoalPeriodType.MONTHLY,
    sportType: undefined,
    category: 'intermediate',
    isPreset: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GoalResolver,
        {
          provide: GoalService,
          useValue: mockGoalService,
        },
        {
          provide: GoalTemplateService,
          useValue: mockGoalTemplateService,
        },
      ],
    }).compile();

    resolver = module.get<GoalResolver>(GoalResolver);
    goalService = module.get<GoalService>(GoalService);
    goalTemplateService = module.get<GoalTemplateService>(GoalTemplateService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('goals', () => {
    it('should return all goals for user', async () => {
      mockGoalService.findAll.mockResolvedValue([mockGoal]);

      const result = await resolver.goals(mockTokenPayload, undefined, undefined, false);

      expect(goalService.findAll).toHaveBeenCalledWith(mockTokenPayload.sub, {
        status: undefined,
        sportType: undefined,
        includeArchived: false,
      });
      expect(result).toEqual([mockGoal]);
    });

    it('should filter goals by status', async () => {
      mockGoalService.findAll.mockResolvedValue([mockGoal]);

      await resolver.goals(mockTokenPayload, GoalStatus.ACTIVE, undefined, false);

      expect(goalService.findAll).toHaveBeenCalledWith(mockTokenPayload.sub, {
        status: GoalStatus.ACTIVE,
        sportType: undefined,
        includeArchived: false,
      });
    });

    it('should include archived goals when requested', async () => {
      mockGoalService.findAll.mockResolvedValue([mockGoal]);

      await resolver.goals(mockTokenPayload, undefined, undefined, true);

      expect(goalService.findAll).toHaveBeenCalledWith(mockTokenPayload.sub, {
        status: undefined,
        sportType: undefined,
        includeArchived: true,
      });
    });
  });

  describe('goal', () => {
    it('should return a single goal by id', async () => {
      mockGoalService.findById.mockResolvedValue(mockGoal);

      const result = await resolver.goal(mockTokenPayload, 1);

      expect(goalService.findById).toHaveBeenCalledWith(1, mockTokenPayload.sub);
      expect(result).toEqual(mockGoal);
    });

    it('should return null if goal not found', async () => {
      mockGoalService.findById.mockResolvedValue(null);

      const result = await resolver.goal(mockTokenPayload, 999);

      expect(result).toBeNull();
    });
  });

  describe('activeGoals', () => {
    it('should return only active goals', async () => {
      mockGoalService.findActiveGoals.mockResolvedValue([mockGoal]);

      const result = await resolver.activeGoals(mockTokenPayload);

      expect(goalService.findActiveGoals).toHaveBeenCalledWith(mockTokenPayload.sub);
      expect(result).toEqual([mockGoal]);
    });
  });

  describe('primaryDashboardGoal', () => {
    it('should return the primary goal for dashboard', async () => {
      mockGoalService.findPrimaryDashboardGoal.mockResolvedValue(mockGoal);

      const result = await resolver.primaryDashboardGoal(mockTokenPayload);

      expect(goalService.findPrimaryDashboardGoal).toHaveBeenCalledWith(mockTokenPayload.sub);
      expect(result).toEqual(mockGoal);
    });

    it('should return null when no active goals exist', async () => {
      mockGoalService.findPrimaryDashboardGoal.mockResolvedValue(null);

      const result = await resolver.primaryDashboardGoal(mockTokenPayload);

      expect(result).toBeNull();
    });
  });

  describe('secondaryDashboardGoals', () => {
    it('should return secondary goals for dashboard', async () => {
      const secondaryGoals = [
        { ...mockGoal, id: 2, title: 'Secondary Goal 1' },
        { ...mockGoal, id: 3, title: 'Secondary Goal 2' },
      ];
      mockGoalService.findSecondaryDashboardGoals.mockResolvedValue(secondaryGoals);

      const result = await resolver.secondaryDashboardGoals(mockTokenPayload);

      expect(goalService.findSecondaryDashboardGoals).toHaveBeenCalledWith(mockTokenPayload.sub);
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe(2);
      expect(result[1].id).toBe(3);
    });

    it('should return empty array when no secondary goals exist', async () => {
      mockGoalService.findSecondaryDashboardGoals.mockResolvedValue([]);

      const result = await resolver.secondaryDashboardGoals(mockTokenPayload);

      expect(result).toEqual([]);
    });
  });

  describe('goalTemplates', () => {
    it('should return all templates with default locale', async () => {
      mockGoalTemplateService.findAll.mockResolvedValue([mockGoalTemplate]);

      const result = await resolver.goalTemplates(undefined, Locale.EN);

      expect(goalTemplateService.findAll).toHaveBeenCalledWith(Locale.EN);
      expect(result).toEqual([mockGoalTemplate]);
    });

    it('should return templates filtered by category', async () => {
      mockGoalTemplateService.findByCategory.mockResolvedValue([mockGoalTemplate]);

      const result = await resolver.goalTemplates('intermediate', Locale.FR);

      expect(goalTemplateService.findByCategory).toHaveBeenCalledWith('intermediate', Locale.FR);
      expect(result).toEqual([mockGoalTemplate]);
    });
  });

  describe('createGoal', () => {
    it('should create a new goal', async () => {
      const input: CreateGoalInput = {
        title: 'Courir 50km',
        targetType: GoalTargetType.DISTANCE,
        targetValue: 50,
        periodType: GoalPeriodType.MONTHLY,
        startDate: '2025-01-01',
        isRecurring: false,
        sportType: undefined,
      };

      mockGoalService.create.mockResolvedValue(mockGoal);

      const result = await resolver.createGoal(mockTokenPayload, input);

      expect(goalService.create).toHaveBeenCalledWith(mockTokenPayload.sub, input);
      expect(result).toEqual(mockGoal);
    });
  });

  describe('createGoalFromTemplate', () => {
    it('should create goal from template', async () => {
      const input = {
        templateId: 1,
        startDate: '2025-01-01',
        customTitle: undefined,
        locale: Locale.EN,
      };

      mockGoalTemplateService.createFromTemplate.mockResolvedValue(mockGoal);

      const result = await resolver.createGoalFromTemplate(mockTokenPayload, input);

      expect(goalTemplateService.createFromTemplate).toHaveBeenCalledWith(
        1,
        mockTokenPayload.sub,
        '2025-01-01',
        undefined,
        Locale.EN,
      );
      expect(result).toEqual(mockGoal);
    });
  });

  describe('updateGoal', () => {
    it('should update an existing goal', async () => {
      const input: UpdateGoalInput = {
        title: 'Courir 60km',
        targetValue: 60,
      };

      mockGoalService.update.mockResolvedValue({
        ...mockGoal,
        ...input,
      });

      const result = await resolver.updateGoal(mockTokenPayload, 1, input);

      expect(goalService.update).toHaveBeenCalledWith(1, mockTokenPayload.sub, input);
      expect(result.title).toBe('Courir 60km');
    });
  });

  describe('deleteGoal', () => {
    it('should delete a goal', async () => {
      mockGoalService.delete.mockResolvedValue(undefined);

      const result = await resolver.deleteGoal(mockTokenPayload, 1);

      expect(goalService.delete).toHaveBeenCalledWith(1, mockTokenPayload.sub);
      expect(result).toBe(true);
    });
  });

  describe('archiveGoal', () => {
    it('should archive a goal', async () => {
      const archivedGoal = { ...mockGoal, status: GoalStatus.ARCHIVED };
      mockGoalService.archive.mockResolvedValue(archivedGoal);

      const result = await resolver.archiveGoal(mockTokenPayload, 1);

      expect(goalService.archive).toHaveBeenCalledWith(1, mockTokenPayload.sub);
      expect(result.status).toBe(GoalStatus.ARCHIVED);
    });
  });

  describe('refreshGoalProgress', () => {
    it('should refresh goal progress', async () => {
      mockGoalService.updateGoalProgress.mockResolvedValue(undefined);
      mockGoalService.findById.mockResolvedValue(mockGoal);

      const result = await resolver.refreshGoalProgress(mockTokenPayload, 1);

      expect(goalService.updateGoalProgress).toHaveBeenCalledWith(1);
      expect(goalService.findById).toHaveBeenCalledWith(1, mockTokenPayload.sub);
      expect(result).toEqual(mockGoal);
    });
  });

  describe('progressPercentage', () => {
    it('should calculate progress percentage with 2 decimals', () => {
      const result = resolver.progressPercentage(mockGoal);
      expect(result).toBe(47.0);
    });

    it('should return 0 if target value is 0', () => {
      const goalWithZeroTarget = { ...mockGoal, targetValue: 0 };
      const result = resolver.progressPercentage(goalWithZeroTarget);
      expect(result).toBe(0);
    });

    it('should allow values over 100%', () => {
      const overachievedGoal = { ...mockGoal, currentValue: 60 };
      const result = resolver.progressPercentage(overachievedGoal);
      expect(result).toBe(120);
    });
  });

  describe('isExpired', () => {
    it('should return false for future end date', () => {
      const futureGoal = {
        ...mockGoal,
        endDate: new Date(Date.now() + 86400000),
      };
      const result = resolver.isExpired(futureGoal);
      expect(result).toBe(false);
    });

    it('should return true for past end date', () => {
      const expiredGoal = {
        ...mockGoal,
        endDate: new Date(Date.now() - 86400000),
      };
      const result = resolver.isExpired(expiredGoal);
      expect(result).toBe(true);
    });
  });

  describe('daysRemaining', () => {
    it('should calculate days remaining', () => {
      const futureGoal = {
        ...mockGoal,
        endDate: new Date(Date.now() + 5 * 86400000),
      };
      const result = resolver.daysRemaining(futureGoal);
      expect(result).toBeGreaterThanOrEqual(4);
      expect(result).toBeLessThanOrEqual(6);
    });

    it('should return null for expired goals', () => {
      const expiredGoal = {
        ...mockGoal,
        endDate: new Date(Date.now() - 86400000),
      };
      const result = resolver.daysRemaining(expiredGoal);
      expect(result).toBeNull();
    });

    it('should return null for goals with negative days remaining', () => {
      const expiredGoal = {
        ...mockGoal,
        endDate: new Date(Date.now() - 10 * 86400000),
      };
      const result = resolver.daysRemaining(expiredGoal);
      expect(result).toBeNull();
    });

    it('should return 0 for goals expiring today', () => {
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);
      const todayGoal = {
        ...mockGoal,
        endDate: todayEnd,
      };
      const result = resolver.daysRemaining(todayGoal);
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(1);
    });
  });

  describe('isExpired', () => {
    it('should return true for goal with exact end date in the past', () => {
      const exactlyExpiredGoal = {
        ...mockGoal,
        endDate: new Date(Date.now() - 1),
      };
      const result = resolver.isExpired(exactlyExpiredGoal);
      expect(result).toBe(true);
    });
  });

  describe('progressPercentage', () => {
    it('should handle division by zero gracefully', () => {
      const zeroTargetGoal = {
        ...mockGoal,
        targetValue: 0,
        currentValue: 10,
      };
      const result = resolver.progressPercentage(zeroTargetGoal);
      expect(result).toBe(0);
    });

    it('should round to 2 decimal places', () => {
      const preciseGoal = {
        ...mockGoal,
        targetValue: 3,
        currentValue: 1,
      };
      const result = resolver.progressPercentage(preciseGoal);
      expect(result).toBe(33.33);
    });
  });
});
