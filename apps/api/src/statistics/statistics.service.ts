import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { StatisticsPeriod } from './enums/statistics-period.enum';
import { PeriodStatistics } from './models/period-statistics.model';
import { ActivityCalendarDay } from './models/activity-calendar-day.model';

@Injectable()
export class StatisticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getPeriodStatistics(userId: number, period: StatisticsPeriod): Promise<PeriodStatistics> {
    const { startDate, endDate } = this.calculatePeriodDates(period);

    const result = await this.prisma.activity.aggregate({
      where: {
        userId,
        startDate: { gte: startDate, lte: endDate },
      },
      _sum: { movingTime: true },
      _count: true,
    });

    const totalTime = result._sum.movingTime ?? 0;
    const activityCount = result._count;
    const averageTimePerSession = activityCount > 0 ? totalTime / activityCount : 0;

    return {
      totalTime,
      activityCount,
      averageTimePerSession,
      periodStart: startDate,
      periodEnd: endDate,
    };
  }

  private calculatePeriodDates(period: StatisticsPeriod): { startDate: Date; endDate: Date } {
    const now = new Date();
    let startDate: Date;
    let endDate: Date;

    switch (period) {
      case StatisticsPeriod.WEEK: {
        const dayOfWeek = now.getDay();
        const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        startDate = new Date(now);
        startDate.setDate(now.getDate() + mondayOffset);
        startDate.setHours(0, 0, 0, 0);

        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
        break;
      }

      case StatisticsPeriod.MONTH: {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        startDate.setHours(0, 0, 0, 0);

        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      }

      case StatisticsPeriod.YEAR: {
        startDate = new Date(now.getFullYear(), 0, 1);
        startDate.setHours(0, 0, 0, 0);

        endDate = new Date(now.getFullYear(), 11, 31);
        endDate.setHours(23, 59, 59, 999);
        break;
      }
    }

    return { startDate, endDate };
  }

  async getActivityCalendar(userId: number, year: number, month?: number): Promise<ActivityCalendarDay[]> {
    const { startDate, endDate } = this.calculateCalendarDates(year, month);

    const activities = await this.prisma.activity.findMany({
      where: {
        userId,
        startDate: { gte: startDate, lte: endDate },
      },
      select: { startDate: true },
    });

    const daysWithActivity = new Set(activities.map(activity => this.formatDateKey(activity.startDate)));

    return this.buildCalendarDays(startDate, endDate, daysWithActivity);
  }

  private calculateCalendarDates(year: number, month?: number): { startDate: Date; endDate: Date } {
    let startDate: Date;
    let endDate: Date;

    if (month !== undefined) {
      startDate = new Date(year, month - 1, 1);
      startDate.setHours(0, 0, 0, 0);

      endDate = new Date(year, month, 0);
      endDate.setHours(23, 59, 59, 999);
    } else {
      startDate = new Date(year, 0, 1);
      startDate.setHours(0, 0, 0, 0);

      endDate = new Date(year, 11, 31);
      endDate.setHours(23, 59, 59, 999);
    }

    return { startDate, endDate };
  }

  private formatDateKey(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private buildCalendarDays(startDate: Date, endDate: Date, daysWithActivity: Set<string>): ActivityCalendarDay[] {
    const calendarDays: ActivityCalendarDay[] = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dateKey = this.formatDateKey(currentDate);
      calendarDays.push({
        date: new Date(currentDate),
        hasActivity: daysWithActivity.has(dateKey),
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return calendarDays;
  }
}
