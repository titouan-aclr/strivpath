import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/database/prisma.service';
import { getTestPrismaClient, seedTestUser } from '../test-db';
import { GoalTemplateService } from '../../src/goal/goal-template.service';
import { GoalTargetType } from '../../src/goal/enums/goal-target-type.enum';
import { GoalPeriodType } from '../../src/goal/enums/goal-period-type.enum';
import { SportType } from '../../src/user-preferences/enums/sport-type.enum';
import { LocaleType } from '../../src/user-preferences/enums/locale-type.enum';

describe('Goal Template Integration', () => {
  let app: INestApplication;
  let goalTemplateService: GoalTemplateService;
  let prisma: ReturnType<typeof getTestPrismaClient>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    goalTemplateService = moduleFixture.get<GoalTemplateService>(GoalTemplateService);
    prisma = getTestPrismaClient();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Database Template Fetching', () => {
    it('should fetch all goal templates from database', async () => {
      const template1 = await prisma.goalTemplate.create({
        data: {
          targetType: GoalTargetType.DISTANCE,
          targetValue: 10,
          periodType: GoalPeriodType.MONTHLY,
          sportType: SportType.RUN,
          category: 'test-beginner',
          isPreset: true,
          translations: {
            create: [
              {
                locale: LocaleType.EN,
                title: 'Run 10km this month',
                description: 'Beginner running goal',
              },
              {
                locale: LocaleType.FR,
                title: 'Courir 10km ce mois',
                description: 'Objectif débutant',
              },
            ],
          },
        },
      });

      const template2 = await prisma.goalTemplate.create({
        data: {
          targetType: GoalTargetType.FREQUENCY,
          targetValue: 3,
          periodType: GoalPeriodType.WEEKLY,
          sportType: null,
          category: 'test-beginner',
          isPreset: true,
          translations: {
            create: [
              {
                locale: LocaleType.EN,
                title: '3 workouts per week',
                description: 'Build consistency',
              },
            ],
          },
        },
      });

      const templates = await goalTemplateService.findAll('en');

      expect(templates.length).toBeGreaterThanOrEqual(2);
      const createdTemplates = templates.filter(t => t.id === template1.id || t.id === template2.id);
      expect(createdTemplates).toHaveLength(2);
    });

    it('should fetch a specific template by ID from database', async () => {
      const template = await prisma.goalTemplate.create({
        data: {
          targetType: GoalTargetType.DURATION,
          targetValue: 5,
          periodType: GoalPeriodType.MONTHLY,
          sportType: null,
          category: 'test-intermediate',
          isPreset: true,
          translations: {
            create: [
              {
                locale: LocaleType.EN,
                title: '5 hours this month',
                description: 'Monthly duration goal',
              },
            ],
          },
        },
      });

      const result = await goalTemplateService.findById(template.id, 'en');

      expect(result).toBeDefined();
      expect(result!.id).toBe(template.id);
      expect(result!.title).toBe('5 hours this month');
      expect(result!.targetType).toBe(GoalTargetType.DURATION);
    });
  });

  describe('Locale Selection with Real Data', () => {
    it('should select English translation when locale is en', async () => {
      const template = await prisma.goalTemplate.create({
        data: {
          targetType: GoalTargetType.DISTANCE,
          targetValue: 50,
          periodType: GoalPeriodType.MONTHLY,
          sportType: SportType.RUN,
          category: 'test-intermediate',
          isPreset: true,
          translations: {
            create: [
              {
                locale: LocaleType.EN,
                title: 'Run 50km this month',
                description: 'Intermediate running goal',
              },
              {
                locale: LocaleType.FR,
                title: 'Courir 50km ce mois',
                description: 'Objectif intermédiaire',
              },
            ],
          },
        },
      });

      const result = await goalTemplateService.findById(template.id, 'en');

      expect(result!.title).toBe('Run 50km this month');
      expect(result!.description).toBe('Intermediate running goal');
    });

    it('should select French translation when locale is fr', async () => {
      const template = await prisma.goalTemplate.create({
        data: {
          targetType: GoalTargetType.DISTANCE,
          targetValue: 50,
          periodType: GoalPeriodType.MONTHLY,
          sportType: SportType.RUN,
          category: 'test-intermediate',
          isPreset: true,
          translations: {
            create: [
              {
                locale: LocaleType.EN,
                title: 'Run 50km this month',
                description: 'Intermediate running goal',
              },
              {
                locale: LocaleType.FR,
                title: 'Courir 50km ce mois',
                description: 'Objectif intermédiaire',
              },
            ],
          },
        },
      });

      const result = await goalTemplateService.findById(template.id, 'fr');

      expect(result!.title).toBe('Courir 50km ce mois');
      expect(result!.description).toBe('Objectif intermédiaire');
    });

    it('should fallback to English when requested locale is unavailable', async () => {
      const template = await prisma.goalTemplate.create({
        data: {
          targetType: GoalTargetType.FREQUENCY,
          targetValue: 4,
          periodType: GoalPeriodType.WEEKLY,
          sportType: null,
          category: 'test-advanced',
          isPreset: true,
          translations: {
            create: [
              {
                locale: LocaleType.EN,
                title: '4 workouts per week',
                description: 'Advanced consistency goal',
              },
            ],
          },
        },
      });

      const result = await goalTemplateService.findById(template.id, 'de');

      expect(result!.title).toBe('4 workouts per week');
      expect(result!.description).toBe('Advanced consistency goal');
    });
  });

  describe('Category Filtering', () => {
    it('should filter templates by category', async () => {
      await prisma.goalTemplate.create({
        data: {
          targetType: GoalTargetType.DISTANCE,
          targetValue: 10,
          periodType: GoalPeriodType.WEEKLY,
          sportType: SportType.RUN,
          category: 'test-filter-beginner',
          isPreset: true,
          translations: {
            create: [{ locale: LocaleType.EN, title: 'Beginner Goal', description: 'For beginners' }],
          },
        },
      });

      await prisma.goalTemplate.create({
        data: {
          targetType: GoalTargetType.DISTANCE,
          targetValue: 100,
          periodType: GoalPeriodType.MONTHLY,
          sportType: SportType.RUN,
          category: 'test-filter-advanced',
          isPreset: true,
          translations: {
            create: [{ locale: LocaleType.EN, title: 'Advanced Goal', description: 'For advanced' }],
          },
        },
      });

      const beginnerTemplates = await goalTemplateService.findByCategory('test-filter-beginner', 'en');
      const advancedTemplates = await goalTemplateService.findByCategory('test-filter-advanced', 'en');

      expect(beginnerTemplates.every(t => t.category === 'test-filter-beginner')).toBe(true);
      expect(advancedTemplates.every(t => t.category === 'test-filter-advanced')).toBe(true);
    });

    it('should return empty array for non-existent category', async () => {
      const templates = await goalTemplateService.findByCategory('non-existent-category-xyz', 'en');

      expect(templates).toEqual([]);
    });
  });

  describe('Create From Template with Database', () => {
    it('should create goal from template with default title', async () => {
      const { user } = await seedTestUser();

      await prisma.userPreferences.update({
        where: { userId: user.id },
        data: { locale: LocaleType.EN },
      });

      const template = await prisma.goalTemplate.create({
        data: {
          targetType: GoalTargetType.DISTANCE,
          targetValue: 25,
          periodType: GoalPeriodType.WEEKLY,
          sportType: SportType.RUN,
          category: 'test-create',
          isPreset: true,
          translations: {
            create: [
              {
                locale: LocaleType.EN,
                title: 'Run 25km weekly',
                description: 'Weekly running target',
              },
            ],
          },
        },
      });

      const goal = await goalTemplateService.createFromTemplate(template.id, user.id, '2025-01-06');

      expect(goal.title).toBe('Run 25km weekly');
      expect(goal.description).toBe('Weekly running target');
      expect(goal.targetType).toBe(GoalTargetType.DISTANCE);
      expect(goal.targetValue).toBe(25);
    });

    it('should create goal from template with custom title', async () => {
      const { user } = await seedTestUser();

      await prisma.userPreferences.update({
        where: { userId: user.id },
        data: { locale: LocaleType.EN },
      });

      const template = await prisma.goalTemplate.create({
        data: {
          targetType: GoalTargetType.DURATION,
          targetValue: 10,
          periodType: GoalPeriodType.MONTHLY,
          sportType: null,
          category: 'test-custom',
          isPreset: true,
          translations: {
            create: [
              {
                locale: LocaleType.EN,
                title: '10 hours this month',
                description: 'Monthly duration goal',
              },
            ],
          },
        },
      });

      const customTitle = 'My Custom Training Goal';
      const goal = await goalTemplateService.createFromTemplate(template.id, user.id, '2025-01-01', customTitle);

      expect(goal.title).toBe(customTitle);
      expect(goal.description).toBe('Monthly duration goal');
      expect(goal.targetType).toBe(GoalTargetType.DURATION);
    });

    it('should use user locale preference when creating from template', async () => {
      const { user } = await seedTestUser();

      await prisma.userPreferences.update({
        where: { userId: user.id },
        data: { locale: LocaleType.FR },
      });

      const template = await prisma.goalTemplate.create({
        data: {
          targetType: GoalTargetType.FREQUENCY,
          targetValue: 3,
          periodType: GoalPeriodType.WEEKLY,
          sportType: null,
          category: 'test-locale',
          isPreset: true,
          translations: {
            create: [
              {
                locale: LocaleType.EN,
                title: '3 workouts per week',
                description: 'Weekly frequency',
              },
              {
                locale: LocaleType.FR,
                title: '3 sorties par semaine',
                description: 'Fréquence hebdomadaire',
              },
            ],
          },
        },
      });

      const goal = await goalTemplateService.createFromTemplate(template.id, user.id, '2025-01-06');

      expect(goal.title).toBe('3 sorties par semaine');
      expect(goal.description).toBe('Fréquence hebdomadaire');
    });

    it('should throw NotFoundException for invalid template ID', async () => {
      const { user } = await seedTestUser();

      await expect(goalTemplateService.createFromTemplate(99999, user.id, '2025-01-01')).rejects.toThrow(
        'Template with ID 99999 not found',
      );
    });
  });
});
