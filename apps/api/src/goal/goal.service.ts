import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { GoalMapper } from './goal.mapper';
import { Goal } from './models/goal.model';
import { CreateGoalInput, UpdateGoalInput } from './dto/goal.input';
import { GoalPeriodHelper } from './helpers/goal-period.helper';
import { GoalTargetType } from './enums/goal-target-type.enum';
import { GoalStatus } from './enums/goal-status.enum';
import { Prisma } from '@prisma/client';

@Injectable()
export class GoalService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: number, input: CreateGoalInput): Promise<Goal> {
    const startDate = new Date(input.startDate);
    const endDate = GoalPeriodHelper.calculateEndDate(
      input.periodType,
      startDate,
      input.endDate ? new Date(input.endDate) : undefined,
    );

    const prismaGoal = await this.prisma.goal.create({
      data: {
        userId,
        title: input.title,
        description: input.description,
        targetType: input.targetType,
        targetValue: input.targetValue,
        periodType: input.periodType,
        startDate,
        endDate,
        sportType: input.sportType,
        status: GoalStatus.ACTIVE,
        currentValue: 0,
      },
    });

    await this.updateGoalProgress(prismaGoal.id);

    const updatedGoal = await this.prisma.goal.findUnique({
      where: { id: prismaGoal.id },
    });

    return GoalMapper.toGraphQL(updatedGoal!);
  }

  async update(id: number, userId: number, input: UpdateGoalInput): Promise<Goal> {
    const existingGoal = await this.findByIdOrThrow(id, userId);

    const updateData: Prisma.GoalUpdateInput = {
      ...(input.title && { title: input.title }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.targetValue !== undefined && { targetValue: input.targetValue }),
      ...(input.endDate && { endDate: new Date(input.endDate) }),
    };

    if (input.endDate) {
      const startDate = new Date(existingGoal.startDate);
      const newEndDate = new Date(input.endDate);
      GoalPeriodHelper.validateDateRange(startDate, newEndDate);
    }

    await this.prisma.goal.update({
      where: { id },
      data: updateData,
    });

    await this.updateGoalProgress(id);

    const updatedGoal = await this.prisma.goal.findUnique({
      where: { id },
    });

    return GoalMapper.toGraphQL(updatedGoal!);
  }

  async delete(id: number, userId: number): Promise<Goal> {
    await this.findByIdOrThrow(id, userId);

    const prismaGoal = await this.prisma.goal.delete({
      where: { id },
    });

    return GoalMapper.toGraphQL(prismaGoal);
  }

  async archive(id: number, userId: number): Promise<Goal> {
    await this.findByIdOrThrow(id, userId);

    const prismaGoal = await this.prisma.goal.update({
      where: { id },
      data: { status: GoalStatus.ARCHIVED },
    });

    return GoalMapper.toGraphQL(prismaGoal);
  }

  async findById(id: number, userId: number): Promise<Goal | null> {
    const prismaGoal = await this.prisma.goal.findFirst({
      where: { id, userId },
    });

    return prismaGoal ? GoalMapper.toGraphQL(prismaGoal) : null;
  }

  async findAll(
    userId: number,
    options?: {
      status?: GoalStatus;
      sportType?: string;
      includeArchived?: boolean;
    },
  ): Promise<Goal[]> {
    const { status, sportType, includeArchived = false } = options ?? {};

    const where: Prisma.GoalWhereInput = {
      userId,
      ...(status && { status }),
      ...(sportType && { sportType }),
      ...(!status && !includeArchived && { status: { not: GoalStatus.ARCHIVED } }),
    };

    const prismaGoals = await this.prisma.goal.findMany({
      where,
      orderBy: [{ status: 'asc' }, { endDate: 'asc' }],
    });

    return prismaGoals.map(goal => GoalMapper.toGraphQL(goal));
  }

  async findActiveGoals(userId: number): Promise<Goal[]> {
    return this.findAll(userId, { status: GoalStatus.ACTIVE });
  }

  async findByTemplate(templateId: number, userId: number): Promise<Goal[]> {
    const prismaGoals = await this.prisma.goal.findMany({
      where: { templateId, userId },
      orderBy: { createdAt: 'desc' },
    });

    return prismaGoals.map(goal => GoalMapper.toGraphQL(goal));
  }

  async updateGoalProgress(goalId: number): Promise<void> {
    const goal = await this.prisma.goal.findUnique({
      where: { id: goalId },
    });

    if (!goal) {
      throw new NotFoundException(`Goal with ID ${goalId} not found`);
    }

    const currentValue = await this.calculateProgress(goal);

    const shouldComplete = currentValue >= goal.targetValue && (goal.status as GoalStatus) === GoalStatus.ACTIVE;
    const shouldFail =
      new Date() > goal.endDate && currentValue < goal.targetValue && (goal.status as GoalStatus) === GoalStatus.ACTIVE;

    await this.prisma.goal.update({
      where: { id: goalId },
      data: {
        currentValue,
        ...(shouldComplete && {
          status: GoalStatus.COMPLETED,
          completedAt: new Date(),
        }),
        ...(shouldFail && {
          status: GoalStatus.FAILED,
        }),
      },
    });
  }

  private async calculateProgress(goal: {
    userId: number;
    targetType: string;
    startDate: Date;
    endDate: Date;
    sportType: string | null;
  }): Promise<number> {
    const activityFilter: Prisma.ActivityWhereInput = {
      userId: goal.userId,
      startDate: {
        gte: goal.startDate,
        lte: goal.endDate,
      },
      ...(goal.sportType && { type: goal.sportType }),
    };

    switch (goal.targetType as GoalTargetType) {
      case GoalTargetType.DISTANCE: {
        const result = await this.prisma.activity.aggregate({
          where: activityFilter,
          _sum: { distance: true },
        });
        return (result._sum.distance ?? 0) / 1000;
      }

      case GoalTargetType.DURATION: {
        const result = await this.prisma.activity.aggregate({
          where: activityFilter,
          _sum: { movingTime: true },
        });
        return (result._sum.movingTime ?? 0) / 3600;
      }

      case GoalTargetType.ELEVATION: {
        const result = await this.prisma.activity.aggregate({
          where: activityFilter,
          _sum: { totalElevationGain: true },
        });
        return result._sum.totalElevationGain ?? 0;
      }

      case GoalTargetType.FREQUENCY: {
        const count = await this.prisma.activity.count({
          where: activityFilter,
        });
        return count;
      }

      default:
        throw new BadRequestException(`Unsupported target type: ${goal.targetType}`);
    }
  }

  private async findByIdOrThrow(id: number, userId: number): Promise<Goal> {
    const goal = await this.findById(id, userId);
    if (!goal) {
      throw new NotFoundException(`Goal with ID ${id} not found or does not belong to user ${userId}`);
    }
    return goal;
  }
}
