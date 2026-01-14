import { Test, TestingModule } from '@nestjs/testing';
import { GoalTemplateService } from './goal-template.service';
import { PrismaService } from '../database/prisma.service';
import { UserPreferencesService } from '../user-preferences/user-preferences.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { GoalTemplate as PrismaGoalTemplate, GoalTemplateTranslation, Goal as PrismaGoal } from '@prisma/client';

const createMockPrismaService = () => ({
  goalTemplate: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
  },
  goal: {
    create: jest.fn(),
  },
});

const createMockUserPreferencesService = () => ({
  findByUserId: jest.fn(),
});

const createMockPrismaTemplate = (
  overrides?: Partial<PrismaGoalTemplate & { translations: GoalTemplateTranslation[] }>,
): PrismaGoalTemplate & { translations: GoalTemplateTranslation[] } => ({
  id: 1,
  targetType: 'DISTANCE',
  targetValue: 50,
  periodType: 'MONTHLY',
  sportType: 'Run',
  category: 'beginner',
  isPreset: true,
  createdAt: new Date('2025-01-01T00:00:00Z'),
  updatedAt: new Date('2025-01-01T00:00:00Z'),
  translations: [
    {
      id: 1,
      templateId: 1,
      locale: 'en',
      title: 'Run 50km this month',
      description: 'Beginner monthly running goal',
      createdAt: new Date('2025-01-01T00:00:00Z'),
      updatedAt: new Date('2025-01-01T00:00:00Z'),
    },
    {
      id: 2,
      templateId: 1,
      locale: 'fr',
      title: 'Courir 50km ce mois',
      description: 'Objectif mensuel de course pour débutants',
      createdAt: new Date('2025-01-01T00:00:00Z'),
      updatedAt: new Date('2025-01-01T00:00:00Z'),
    },
  ],
  ...overrides,
});

describe('GoalTemplateService', () => {
  let service: GoalTemplateService;
  let prisma: ReturnType<typeof createMockPrismaService>;
  let userPreferencesService: ReturnType<typeof createMockUserPreferencesService>;

  beforeEach(async () => {
    const mockPrisma = createMockPrismaService();
    const mockUserPreferences = createMockUserPreferencesService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GoalTemplateService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: UserPreferencesService, useValue: mockUserPreferences },
      ],
    }).compile();

    service = module.get<GoalTemplateService>(GoalTemplateService);
    prisma = module.get(PrismaService) as any;
    userPreferencesService = module.get(UserPreferencesService) as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all templates with English translations', async () => {
      const templates = [createMockPrismaTemplate(), createMockPrismaTemplate({ id: 2, targetValue: 100 })];

      prisma.goalTemplate.findMany.mockResolvedValue(templates);

      const result = await service.findAll('en');

      expect(prisma.goalTemplate.findMany).toHaveBeenCalledWith({
        include: { translations: true },
        orderBy: [{ category: 'asc' }, { targetValue: 'asc' }],
      });
      expect(result).toHaveLength(2);
      expect(result[0].title).toBe('Run 50km this month');
    });

    it('should return templates with French translations', async () => {
      const templates = [createMockPrismaTemplate()];

      prisma.goalTemplate.findMany.mockResolvedValue(templates);

      const result = await service.findAll('fr');

      expect(result[0].title).toBe('Courir 50km ce mois');
    });
  });

  describe('findById', () => {
    it('should return a template by ID with translations', async () => {
      const template = createMockPrismaTemplate();

      prisma.goalTemplate.findUnique.mockResolvedValue(template);

      const result = await service.findById(1, 'en');

      expect(prisma.goalTemplate.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: { translations: true },
      });
      expect(result).toBeDefined();
      expect(result?.title).toBe('Run 50km this month');
    });

    it('should return null when template not found', async () => {
      prisma.goalTemplate.findUnique.mockResolvedValue(null);

      const result = await service.findById(999, 'en');

      expect(result).toBeNull();
    });
  });

  describe('findByCategory', () => {
    it('should return templates filtered by category', async () => {
      const templates = [
        createMockPrismaTemplate({ category: 'beginner' }),
        createMockPrismaTemplate({ id: 2, category: 'beginner', targetValue: 30 }),
      ];

      prisma.goalTemplate.findMany.mockResolvedValue(templates);

      const result = await service.findByCategory('beginner', 'en');

      expect(prisma.goalTemplate.findMany).toHaveBeenCalledWith({
        where: { category: 'beginner' },
        include: { translations: true },
        orderBy: { targetValue: 'asc' },
      });
      expect(result).toHaveLength(2);
    });
  });

  describe('createFromTemplate', () => {
    it('should create a goal from template with English locale', async () => {
      const template = createMockPrismaTemplate();
      const userId = 42;
      const startDate = '2025-01-15';

      const createdGoal: PrismaGoal = {
        id: 1,
        userId,
        templateId: 1,
        title: 'Run 50km this month',
        description: 'Beginner monthly running goal',
        targetType: 'DISTANCE',
        targetValue: 50,
        periodType: 'MONTHLY',
        sportType: 'Run',
        isRecurring: false,
        recurrenceEndDate: null,
        startDate: new Date('2025-01-15'),
        endDate: new Date('2025-01-31T23:59:59.999Z'),
        status: 'ACTIVE',
        currentValue: 0,
        completedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prisma.goalTemplate.findUnique.mockResolvedValue(template);
      prisma.goal.create.mockResolvedValue(createdGoal);
      userPreferencesService.findByUserId.mockResolvedValue({ locale: 'en' });

      const result = await service.createFromTemplate(1, userId, startDate);

      expect(prisma.goal.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId,
          templateId: 1,
          title: 'Run 50km this month',
          description: 'Beginner monthly running goal',
          targetType: 'DISTANCE',
          targetValue: 50,
          periodType: 'MONTHLY',
          sportType: 'Run',
          status: 'ACTIVE',
          currentValue: 0,
        }),
      });

      expect(result.title).toBe('Run 50km this month');
    });

    it('should use custom title when provided', async () => {
      const template = createMockPrismaTemplate();
      const customTitle = 'My Custom Running Goal';

      const createdGoal: PrismaGoal = {
        id: 1,
        userId: 42,
        templateId: 1,
        title: customTitle,
        description: 'Beginner monthly running goal',
        targetType: 'DISTANCE',
        targetValue: 50,
        periodType: 'MONTHLY',
        sportType: 'Run',
        isRecurring: false,
        recurrenceEndDate: null,
        startDate: new Date('2025-01-15'),
        endDate: new Date('2025-01-31T23:59:59.999Z'),
        status: 'ACTIVE',
        currentValue: 0,
        completedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prisma.goalTemplate.findUnique.mockResolvedValue(template);
      prisma.goal.create.mockResolvedValue(createdGoal);

      userPreferencesService.findByUserId.mockResolvedValue({ locale: 'en' });

      const result = await service.createFromTemplate(1, 42, '2025-01-15', customTitle);

      expect(prisma.goal.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            title: customTitle,
          }),
        }),
      );

      expect(result.title).toBe(customTitle);
    });

    it('should use French translation when locale is fr', async () => {
      const template = createMockPrismaTemplate();

      const createdGoal: PrismaGoal = {
        id: 1,
        userId: 42,
        templateId: 1,
        title: 'Courir 50km ce mois',
        description: 'Objectif mensuel de course pour débutants',
        targetType: 'DISTANCE',
        targetValue: 50,
        periodType: 'MONTHLY',
        sportType: 'Run',
        isRecurring: false,
        recurrenceEndDate: null,
        startDate: new Date('2025-01-15'),
        endDate: new Date('2025-01-31T23:59:59.999Z'),
        status: 'ACTIVE',
        currentValue: 0,
        completedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prisma.goalTemplate.findUnique.mockResolvedValue(template);
      prisma.goal.create.mockResolvedValue(createdGoal);
      userPreferencesService.findByUserId.mockResolvedValue({ locale: 'fr' });

      await service.createFromTemplate(1, 42, '2025-01-15');

      expect(prisma.goal.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            title: 'Courir 50km ce mois',
            description: 'Objectif mensuel de course pour débutants',
          }),
        }),
      );
    });

    it('should throw NotFoundException when template does not exist', async () => {
      prisma.goalTemplate.findUnique.mockResolvedValue(null);
      userPreferencesService.findByUserId.mockResolvedValue({ locale: 'en' });

      await expect(service.createFromTemplate(999, 42, '2025-01-15')).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when template has no translations', async () => {
      const templateWithoutTranslations = createMockPrismaTemplate({ translations: [] });

      prisma.goalTemplate.findUnique.mockResolvedValue(templateWithoutTranslations);
      userPreferencesService.findByUserId.mockResolvedValue({ locale: 'en' });

      await expect(service.createFromTemplate(1, 42, '2025-01-15')).rejects.toThrow('Template 1 has no translations');
    });
  });
});
