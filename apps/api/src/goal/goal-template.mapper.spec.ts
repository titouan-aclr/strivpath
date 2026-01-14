import { GoalTemplateMapper } from './goal-template.mapper';
import { GoalTemplate as PrismaGoalTemplate, GoalTemplateTranslation } from '@prisma/client';
import { GoalTargetType } from './enums/goal-target-type.enum';
import { GoalPeriodType } from './enums/goal-period-type.enum';

describe('GoalTemplateMapper', () => {
  describe('toGraphQL', () => {
    it('should map Prisma GoalTemplate with translations to GraphQL', () => {
      const prismaTemplate: PrismaGoalTemplate & { translations: GoalTemplateTranslation[] } = {
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
            description: 'A beginner-friendly monthly running goal',
            createdAt: new Date('2025-01-01T00:00:00Z'),
            updatedAt: new Date('2025-01-01T00:00:00Z'),
          },
          {
            id: 2,
            templateId: 1,
            locale: 'fr',
            title: 'Courir 50km ce mois',
            description: 'Un objectif mensuel de course pour débutants',
            createdAt: new Date('2025-01-01T00:00:00Z'),
            updatedAt: new Date('2025-01-01T00:00:00Z'),
          },
        ],
      };

      const result = GoalTemplateMapper.toGraphQL(prismaTemplate, 'en');

      expect(result.id).toBe(1);
      expect(result.targetType).toBe(GoalTargetType.DISTANCE);
      expect(result.targetValue).toBe(50);
      expect(result.periodType).toBe(GoalPeriodType.MONTHLY);
      expect(result.sportType).toBe('Run');
      expect(result.category).toBe('beginner');
      expect(result.isPreset).toBe(true);
      expect(result.title).toBe('Run 50km this month');
      expect(result.description).toBe('A beginner-friendly monthly running goal');
    });

    it('should use French translation when locale is fr', () => {
      const prismaTemplate: PrismaGoalTemplate & { translations: GoalTemplateTranslation[] } = {
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
            description: 'A beginner-friendly monthly running goal',
            createdAt: new Date('2025-01-01T00:00:00Z'),
            updatedAt: new Date('2025-01-01T00:00:00Z'),
          },
          {
            id: 2,
            templateId: 1,
            locale: 'fr',
            title: 'Courir 50km ce mois',
            description: 'Un objectif mensuel de course pour débutants',
            createdAt: new Date('2025-01-01T00:00:00Z'),
            updatedAt: new Date('2025-01-01T00:00:00Z'),
          },
        ],
      };

      const result = GoalTemplateMapper.toGraphQL(prismaTemplate, 'fr');

      expect(result.title).toBe('Courir 50km ce mois');
      expect(result.description).toBe('Un objectif mensuel de course pour débutants');
    });

    it('should handle null sportType', () => {
      const prismaTemplate: PrismaGoalTemplate & { translations: GoalTemplateTranslation[] } = {
        id: 2,
        targetType: 'FREQUENCY',
        targetValue: 10,
        periodType: 'WEEKLY',
        sportType: null,
        category: 'intermediate',
        isPreset: true,
        createdAt: new Date('2025-01-01T00:00:00Z'),
        updatedAt: new Date('2025-01-01T00:00:00Z'),
        translations: [
          {
            id: 3,
            templateId: 2,
            locale: 'en',
            title: '10 workouts this week',
            description: null,
            createdAt: new Date('2025-01-01T00:00:00Z'),
            updatedAt: new Date('2025-01-01T00:00:00Z'),
          },
        ],
      };

      const result = GoalTemplateMapper.toGraphQL(prismaTemplate, 'en');

      expect(result.sportType).toBeUndefined();
      expect(result.description).toBeUndefined();
    });
  });
});
