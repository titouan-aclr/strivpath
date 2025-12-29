import { Goal as PrismaGoal } from '@prisma/client';
import { Goal as GraphQLGoal } from './models/goal.model';
import { GoalTargetType } from './enums/goal-target-type.enum';
import { GoalPeriodType } from './enums/goal-period-type.enum';
import { GoalStatus } from './enums/goal-status.enum';

export class GoalMapper {
  static toGraphQL(prismaGoal: PrismaGoal): GraphQLGoal {
    return {
      id: prismaGoal.id,
      userId: prismaGoal.userId,
      title: prismaGoal.title,
      description: prismaGoal.description ?? undefined,
      targetType: prismaGoal.targetType as GoalTargetType,
      targetValue: prismaGoal.targetValue,
      periodType: prismaGoal.periodType as GoalPeriodType,
      startDate: prismaGoal.startDate,
      endDate: prismaGoal.endDate,
      templateId: prismaGoal.templateId ?? undefined,
      sportType: prismaGoal.sportType ?? undefined,
      status: prismaGoal.status as GoalStatus,
      currentValue: prismaGoal.currentValue,
      completedAt: prismaGoal.completedAt ?? undefined,
      createdAt: prismaGoal.createdAt,
      updatedAt: prismaGoal.updatedAt,
    };
  }
}
