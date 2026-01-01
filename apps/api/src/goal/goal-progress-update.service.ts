import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { GoalService } from './goal.service';
import { GoalStatus } from './enums/goal-status.enum';

export interface GoalProgressUpdateResult {
  totalGoals: number;
  successCount: number;
  failureCount: number;
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
      errors: [],
    };

    if (goalIds.length === 0) {
      return result;
    }

    for (let i = 0; i < goalIds.length; i += this.BATCH_SIZE) {
      const batch = goalIds.slice(i, i + this.BATCH_SIZE);
      const batchResults = await Promise.allSettled(batch.map(id => this.goalService.updateGoalProgress(id)));

      batchResults.forEach((batchResult, index) => {
        if (batchResult.status === 'fulfilled') {
          result.successCount++;
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
