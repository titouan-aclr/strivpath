import { GoalPeriodType } from '../enums/goal-period-type.enum';
import { BadRequestException } from '@nestjs/common';

export class GoalPeriodHelper {
  static calculateEndDate(periodType: GoalPeriodType, startDate: Date, customEndDate?: Date): Date {
    const start = new Date(startDate);

    switch (periodType) {
      case GoalPeriodType.WEEKLY: {
        const endDate = new Date(start);
        endDate.setDate(start.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
        return endDate;
      }

      case GoalPeriodType.MONTHLY: {
        const endDate = new Date(start.getFullYear(), start.getMonth() + 1, 0);
        endDate.setHours(23, 59, 59, 999);
        return endDate;
      }

      case GoalPeriodType.YEARLY: {
        const endDate = new Date(start.getFullYear(), 11, 31);
        endDate.setHours(23, 59, 59, 999);
        return endDate;
      }

      case GoalPeriodType.CUSTOM: {
        if (!customEndDate) {
          throw new BadRequestException('Custom end date is required for CUSTOM period type');
        }
        const endDate = new Date(customEndDate);
        if (endDate <= start) {
          throw new BadRequestException('End date must be after start date');
        }
        return endDate;
      }

      default:
        throw new BadRequestException(`Unsupported period type: ${String(periodType)}`);
    }
  }

  static validateDateRange(startDate: Date, endDate: Date): void {
    if (endDate <= startDate) {
      throw new BadRequestException('End date must be after start date');
    }
  }
}
