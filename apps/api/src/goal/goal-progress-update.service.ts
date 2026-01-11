import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { GoalService } from './goal.service';
import { GoalStatus } from './enums/goal-status.enum';

export interface GoalProgressUpdateResult {
  totalGoals: number;
  successCount: number;
  failureCount: number;
  completedGoalIds: number[];
  failedGoalIds: number[];
  errors: Array<{ goalId: number; error: string }>;
}

@Injectable()
export class GoalProgressUpdateService {
  private readonly BATCH_SIZE = 5;

  constructor(
    private readonly prisma: PrismaService,
    private readonly goalService: GoalService,
  ) {}

  async updateAllGoalsForUser(userId: number, earliestActivityDate?: Date): Promise<GoalProgressUpdateResult> {
    const goalIds = await this.getActiveGoalsInDateRange(userId, earliestActivityDate);

    const result: GoalProgressUpdateResult = {
      totalGoals: goalIds.length,
      successCount: 0,
      failureCount: 0,
      completedGoalIds: [],
      failedGoalIds: [],
      errors: [],
    };

    if (goalIds.length === 0) {
      return result;
    }

    for (let i = 0; i < goalIds.length; i += this.BATCH_SIZE) {
      const batch = goalIds.slice(i, i + this.BATCH_SIZE);
      const batchResults = await Promise.allSettled(batch.map(id => this.updateGoalProgressWithStatusTracking(id)));

      batchResults.forEach((batchResult, index) => {
        if (batchResult.status === 'fulfilled') {
          result.successCount++;
          const statusChange = batchResult.value;
          if (statusChange === 'completed') {
            result.completedGoalIds.push(batch[index]);
          } else if (statusChange === 'failed') {
            result.failedGoalIds.push(batch[index]);
          }
        } else {
          result.failureCount++;
          const errorMessage =
            batchResult.reason instanceof Error && batchResult.reason.message
              ? batchResult.reason.message
              : 'Unknown error';
          result.errors.push({
            goalId: batch[index],
            error: errorMessage,
          });
        }
      });
    }

    return result;
  }

  private async updateGoalProgressWithStatusTracking(goalId: number): Promise<'completed' | 'failed' | 'none'> {
    const goalBefore = await this.prisma.goal.findUnique({
      where: { id: goalId },
      select: { status: true },
    });

    if (!goalBefore) {
      throw new Error(`Goal with ID ${goalId} not found`);
    }

    await this.goalService.updateGoalProgress(goalId);

    const goalAfter = await this.prisma.goal.findUnique({
      where: { id: goalId },
      select: { status: true },
    });

    if (!goalAfter) {
      throw new Error(`Goal with ID ${goalId} not found after update`);
    }

    if (goalBefore.status === 'ACTIVE' && goalAfter.status === 'COMPLETED') {
      return 'completed';
    }

    if (goalBefore.status === 'ACTIVE' && goalAfter.status === 'FAILED') {
      return 'failed';
    }

    return 'none';
  }

  private async getActiveGoalsInDateRange(userId: number, earliestActivityDate?: Date): Promise<number[]> {
    const activeGoals = await this.prisma.goal.findMany({
      where: {
        userId,
        status: GoalStatus.ACTIVE,
        ...(earliestActivityDate && {
          endDate: { gte: earliestActivityDate },
        }),
      },
      select: { id: true },
    });

    return activeGoals.map(goal => goal.id);
  }
}
