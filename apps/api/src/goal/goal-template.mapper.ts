import { GoalTemplate as PrismaGoalTemplate, GoalTemplateTranslation } from '@prisma/client';
import { GoalTemplate as GraphQLGoalTemplate } from './models/goal-template.model';
import { GoalTargetType } from './enums/goal-target-type.enum';
import { GoalPeriodType } from './enums/goal-period-type.enum';
import { Locale } from './enums/locale.enum';
import { SportType } from '../user-preferences/enums/sport-type.enum';
import { TranslationHelper } from './helpers/translation.helper';

type PrismaGoalTemplateWithTranslations = PrismaGoalTemplate & {
  translations: GoalTemplateTranslation[];
};

export class GoalTemplateMapper {
  static toGraphQL(prismaTemplate: PrismaGoalTemplateWithTranslations, locale: Locale): GraphQLGoalTemplate {
    const { title, description } = TranslationHelper.selectTranslation(prismaTemplate.translations, locale);

    return {
      id: prismaTemplate.id,
      targetType: prismaTemplate.targetType as GoalTargetType,
      targetValue: prismaTemplate.targetValue,
      periodType: prismaTemplate.periodType as GoalPeriodType,
      sportType: prismaTemplate.sportType ? (prismaTemplate.sportType as SportType) : undefined,
      category: prismaTemplate.category,
      isPreset: prismaTemplate.isPreset,
      title,
      description,
      createdAt: prismaTemplate.createdAt,
      updatedAt: prismaTemplate.updatedAt,
    };
  }
}
