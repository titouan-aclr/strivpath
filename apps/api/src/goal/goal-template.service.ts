import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { UserPreferencesService } from '../user-preferences/user-preferences.service';
import { GoalTemplateMapper } from './goal-template.mapper';
import { GoalTemplate } from './models/goal-template.model';
import { Goal } from './models/goal.model';
import { GoalMapper } from './goal.mapper';
import { GoalPeriodHelper } from './helpers/goal-period.helper';
import { TranslationHelper } from './helpers/translation.helper';
import { GoalStatus } from './enums/goal-status.enum';
import { GoalPeriodType } from './enums/goal-period-type.enum';

@Injectable()
export class GoalTemplateService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userPreferencesService: UserPreferencesService,
  ) {}

  async findAll(locale = 'en'): Promise<GoalTemplate[]> {
    const prismaTemplates = await this.prisma.goalTemplate.findMany({
      include: { translations: true },
      orderBy: [{ category: 'asc' }, { targetValue: 'asc' }],
    });

    return prismaTemplates.map(template => GoalTemplateMapper.toGraphQL(template, locale));
  }

  async findById(id: number, locale = 'en'): Promise<GoalTemplate | null> {
    const prismaTemplate = await this.prisma.goalTemplate.findUnique({
      where: { id },
      include: { translations: true },
    });

    return prismaTemplate ? GoalTemplateMapper.toGraphQL(prismaTemplate, locale) : null;
  }

  async findByCategory(category: string, locale = 'en'): Promise<GoalTemplate[]> {
    const prismaTemplates = await this.prisma.goalTemplate.findMany({
      where: { category },
      include: { translations: true },
      orderBy: { targetValue: 'asc' },
    });

    return prismaTemplates.map(template => GoalTemplateMapper.toGraphQL(template, locale));
  }

  async createFromTemplate(templateId: number, userId: number, startDate: string, customTitle?: string): Promise<Goal> {
    const prismaTemplate = await this.prisma.goalTemplate.findUnique({
      where: { id: templateId },
      include: { translations: true },
    });

    if (!prismaTemplate) {
      throw new NotFoundException(`Template with ID ${templateId} not found`);
    }

    if (prismaTemplate.translations.length === 0) {
      throw new BadRequestException(`Template ${templateId} has no translations`);
    }

    const userPreferences = await this.userPreferencesService.findByUserId(userId);
    const locale = userPreferences?.locale ?? 'en';

    const { title, description } = TranslationHelper.selectTranslation(prismaTemplate.translations, locale);

    const start = new Date(startDate);
    const endDate = GoalPeriodHelper.calculateEndDate(prismaTemplate.periodType as GoalPeriodType, start);

    const prismaGoal = await this.prisma.goal.create({
      data: {
        userId,
        templateId,
        title: customTitle ?? title,
        description,
        targetType: prismaTemplate.targetType,
        targetValue: prismaTemplate.targetValue,
        periodType: prismaTemplate.periodType,
        sportType: prismaTemplate.sportType,
        startDate: start,
        endDate,
        status: GoalStatus.ACTIVE,
        currentValue: 0,
      },
    });

    return GoalMapper.toGraphQL(prismaGoal);
  }
}
