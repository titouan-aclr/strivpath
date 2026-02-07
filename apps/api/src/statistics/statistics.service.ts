import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { getStravaTypesForSport } from '../common/utils/sport-type.utils';
import { SportType } from '../user-preferences/enums/sport-type.enum';
import { StatisticsPeriod } from './enums/statistics-period.enum';
import { ProgressionMetric } from './enums/progression-metric.enum';
import { IntervalType } from './enums/interval-type.enum';
import { PeriodStatistics } from './models/period-statistics.model';
import { ActivityCalendarDay } from './models/activity-calendar-day.model';
import { SportDistribution } from './models/sport-distribution.model';
import { SportPeriodStatistics } from './models/sport-period-statistics.model';
import { SportAverageMetrics } from './models/sport-average-metrics.model';
import { ProgressionDataPoint } from './models/progression-data-point.model';
import { PersonalRecord } from './models/personal-record.model';

interface DateInterval {
  index: number;
  intervalType: IntervalType;
  startDate: Date;
  endDate: Date;
}

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

  async getActivityCalendar(userId: number, year: number, month?: number | null): Promise<ActivityCalendarDay[]> {
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

  private calculateCalendarDates(year: number, month?: number | null): { startDate: Date; endDate: Date } {
    let startDate: Date;
    let endDate: Date;

    if (month != null) {
      startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
      const lastDayOfMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
      endDate = new Date(Date.UTC(year, month - 1, lastDayOfMonth, 23, 59, 59, 999));
    } else {
      startDate = new Date(Date.UTC(year, 0, 1, 0, 0, 0, 0));
      endDate = new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999));
    }

    return { startDate, endDate };
  }

  private formatDateKey(date: Date): string {
    return date.toISOString().split('T')[0];
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
      currentDate.setUTCDate(currentDate.getUTCDate() + 1);
    }

    return calendarDays;
  }

  async getSportDistribution(userId: number): Promise<SportDistribution[]> {
    const { startDate, endDate } = this.calculateCurrentMonthDates();

    const activitiesByType = await this.prisma.activity.groupBy({
      by: ['type'],
      where: {
        userId,
        startDate: { gte: startDate, lte: endDate },
      },
      _sum: { movingTime: true },
    });

    const sportTimeMap = this.aggregateBySportType(activitiesByType);
    const totalTime = this.calculateTotalTime(sportTimeMap);

    return this.buildSportDistribution(sportTimeMap, totalTime);
  }

  private calculateCurrentMonthDates(): { startDate: Date; endDate: Date } {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    endDate.setHours(23, 59, 59, 999);

    return { startDate, endDate };
  }

  private aggregateBySportType(
    activitiesByType: { type: string; _sum: { movingTime: number | null } }[],
  ): Map<SportType, number> {
    const sportTimeMap = new Map<SportType, number>();

    for (const activity of activitiesByType) {
      const sportType = activity.type as SportType;
      if (!Object.values(SportType).includes(sportType)) continue;

      const currentTime = sportTimeMap.get(sportType) ?? 0;
      const activityTime = activity._sum.movingTime ?? 0;
      sportTimeMap.set(sportType, currentTime + activityTime);
    }

    return sportTimeMap;
  }

  private calculateTotalTime(sportTimeMap: Map<SportType, number>): number {
    let total = 0;
    for (const time of sportTimeMap.values()) {
      total += time;
    }
    return total;
  }

  private buildSportDistribution(sportTimeMap: Map<SportType, number>, totalTime: number): SportDistribution[] {
    const distribution: SportDistribution[] = [];

    for (const [sport, time] of sportTimeMap) {
      const percentage = totalTime > 0 ? Number(((time / totalTime) * 100).toFixed(2)) : 0;
      distribution.push({
        sport,
        percentage,
        totalTime: time,
      });
    }

    return distribution.sort((a, b) => b.totalTime - a.totalTime);
  }

  async getSportPeriodStatistics(
    userId: number,
    sportType: SportType,
    period: StatisticsPeriod,
  ): Promise<SportPeriodStatistics> {
    const stravaTypes = getStravaTypesForSport(sportType);
    const { startDate, endDate } = this.calculatePeriodDates(period);
    const { startDate: prevStartDate, endDate: prevEndDate } = this.calculatePreviousPeriodDates(period);

    const [currentResult, previousResult] = await Promise.all([
      this.prisma.activity.aggregate({
        where: {
          userId,
          type: { in: stravaTypes },
          startDate: { gte: startDate, lte: endDate },
        },
        _sum: { distance: true, movingTime: true, totalElevationGain: true },
        _count: true,
      }),
      this.prisma.activity.aggregate({
        where: {
          userId,
          type: { in: stravaTypes },
          startDate: { gte: prevStartDate, lte: prevEndDate },
        },
        _sum: { distance: true, movingTime: true, totalElevationGain: true },
        _count: true,
      }),
    ]);

    const totalDistance = currentResult._sum.distance ?? 0;
    const totalDuration = currentResult._sum.movingTime ?? 0;
    const activityCount = currentResult._count;
    const totalElevation = currentResult._sum.totalElevationGain ?? 0;

    const prevDistance = previousResult._sum.distance ?? 0;
    const prevDuration = previousResult._sum.movingTime ?? 0;
    const prevActivityCount = previousResult._count;
    const prevElevation = previousResult._sum.totalElevationGain ?? 0;

    return {
      totalDistance,
      totalDuration,
      activityCount,
      totalElevation,
      distanceTrend: this.calculateTrend(totalDistance, prevDistance),
      durationTrend: this.calculateTrend(totalDuration, prevDuration),
      activityTrend: this.calculateTrend(activityCount, prevActivityCount),
      elevationTrend: this.calculateTrend(totalElevation, prevElevation),
    };
  }

  async getSportProgressionData(
    userId: number,
    sportType: SportType,
    period: StatisticsPeriod,
    metric: ProgressionMetric,
  ): Promise<ProgressionDataPoint[]> {
    const stravaTypes = getStravaTypesForSport(sportType);
    const intervals = this.generateProgressionIntervals(period);

    const dataPoints: ProgressionDataPoint[] = [];

    for (const interval of intervals) {
      const activities = await this.prisma.activity.findMany({
        where: {
          userId,
          type: { in: stravaTypes },
          startDate: { gte: interval.startDate, lte: interval.endDate },
        },
        select: {
          distance: true,
          movingTime: true,
          totalElevationGain: true,
        },
      });

      const value = this.calculateMetricValue(activities, metric, sportType);

      dataPoints.push({
        index: interval.index,
        intervalType: interval.intervalType,
        value,
      });
    }

    return dataPoints;
  }

  async getSportAverageMetrics(
    userId: number,
    sportType: SportType,
    period: StatisticsPeriod,
  ): Promise<SportAverageMetrics> {
    const stravaTypes = getStravaTypesForSport(sportType);
    const { startDate, endDate } = this.calculatePeriodDates(period);

    const activities = await this.prisma.activity.findMany({
      where: {
        userId,
        type: { in: stravaTypes },
        startDate: { gte: startDate, lte: endDate },
      },
      select: {
        distance: true,
        movingTime: true,
        averageHeartrate: true,
        averageCadence: true,
        averageWatts: true,
        averageSpeed: true,
      },
    });

    if (activities.length === 0) {
      return {
        averagePace: undefined,
        averageSpeed: undefined,
        averageHeartRate: undefined,
        averageCadence: undefined,
        averagePower: undefined,
      };
    }

    const totalDistance = activities.reduce((sum, a) => sum + (a.distance ?? 0), 0);
    const totalTime = activities.reduce((sum, a) => sum + (a.movingTime ?? 0), 0);

    let weightedHrSum = 0;
    let weightedCadenceSum = 0;
    let weightedPowerSum = 0;
    let hrTimeSum = 0;
    let cadenceTimeSum = 0;
    let powerTimeSum = 0;

    for (const activity of activities) {
      const time = activity.movingTime ?? 0;
      if (activity.averageHeartrate != null) {
        weightedHrSum += activity.averageHeartrate * time;
        hrTimeSum += time;
      }
      if (activity.averageCadence != null) {
        weightedCadenceSum += activity.averageCadence * time;
        cadenceTimeSum += time;
      }
      if (activity.averageWatts != null) {
        weightedPowerSum += activity.averageWatts * time;
        powerTimeSum += time;
      }
    }

    const averageHeartRate = hrTimeSum > 0 ? weightedHrSum / hrTimeSum : undefined;
    const averageCadence = cadenceTimeSum > 0 ? weightedCadenceSum / cadenceTimeSum : undefined;
    const averagePower = powerTimeSum > 0 ? weightedPowerSum / powerTimeSum : undefined;

    let averagePace: number | undefined;
    let averageSpeed: number | undefined;

    if (sportType === SportType.RUN || sportType === SportType.SWIM) {
      averagePace = totalDistance > 0 ? (totalTime / totalDistance) * 1000 : undefined;
    }

    if (sportType === SportType.RIDE) {
      averageSpeed = totalTime > 0 ? totalDistance / totalTime : undefined;
    }

    return {
      averagePace,
      averageSpeed,
      averageHeartRate,
      averageCadence,
      averagePower: sportType === SportType.RIDE ? averagePower : undefined,
    };
  }

  async getPersonalRecords(userId: number, sportType: SportType): Promise<PersonalRecord[]> {
    const stravaTypes = getStravaTypesForSport(sportType);
    const records: PersonalRecord[] = [];

    const longestDistance = await this.prisma.activity.findFirst({
      where: { userId, type: { in: stravaTypes } },
      orderBy: { distance: 'desc' },
      select: { id: true, distance: true, startDate: true },
    });

    if (longestDistance && longestDistance.distance > 0) {
      records.push({
        type: 'longest_distance',
        value: longestDistance.distance,
        achievedAt: longestDistance.startDate,
        activityId: longestDistance.id.toString(),
      });
    }

    const longestDuration = await this.prisma.activity.findFirst({
      where: { userId, type: { in: stravaTypes } },
      orderBy: { movingTime: 'desc' },
      select: { id: true, movingTime: true, startDate: true },
    });

    if (longestDuration && longestDuration.movingTime > 0) {
      records.push({
        type: 'longest_duration',
        value: longestDuration.movingTime,
        achievedAt: longestDuration.startDate,
        activityId: longestDuration.id.toString(),
      });
    }

    const mostElevation = await this.prisma.activity.findFirst({
      where: { userId, type: { in: stravaTypes } },
      orderBy: { totalElevationGain: 'desc' },
      select: { id: true, totalElevationGain: true, startDate: true },
    });

    if (mostElevation && mostElevation.totalElevationGain > 0) {
      records.push({
        type: 'most_elevation',
        value: mostElevation.totalElevationGain,
        achievedAt: mostElevation.startDate,
        activityId: mostElevation.id.toString(),
      });
    }

    if (sportType === SportType.RUN || sportType === SportType.SWIM) {
      const activitiesForPace = await this.prisma.activity.findMany({
        where: {
          userId,
          type: { in: stravaTypes },
          distance: { gte: 1000 },
        },
        select: { id: true, distance: true, movingTime: true, startDate: true },
      });

      let bestPaceActivity: { id: number; pace: number; startDate: Date } | null = null;

      for (const activity of activitiesForPace) {
        if (activity.distance > 0 && activity.movingTime > 0) {
          const pace = (activity.movingTime / activity.distance) * 1000;
          if (!bestPaceActivity || pace < bestPaceActivity.pace) {
            bestPaceActivity = { id: activity.id, pace, startDate: activity.startDate };
          }
        }
      }

      if (bestPaceActivity) {
        records.push({
          type: 'best_pace',
          value: bestPaceActivity.pace,
          achievedAt: bestPaceActivity.startDate,
          activityId: bestPaceActivity.id.toString(),
        });
      }
    }

    if (sportType === SportType.RIDE) {
      const bestSpeed = await this.prisma.activity.findFirst({
        where: {
          userId,
          type: { in: stravaTypes },
          averageSpeed: { gt: 0 },
        },
        orderBy: { averageSpeed: 'desc' },
        select: { id: true, averageSpeed: true, startDate: true },
      });

      if (bestSpeed && bestSpeed.averageSpeed) {
        records.push({
          type: 'best_speed',
          value: bestSpeed.averageSpeed,
          achievedAt: bestSpeed.startDate,
          activityId: bestSpeed.id.toString(),
        });
      }
    }

    return records;
  }

  private calculatePreviousPeriodDates(period: StatisticsPeriod): { startDate: Date; endDate: Date } {
    const { startDate: currentStart } = this.calculatePeriodDates(period);
    let startDate: Date;
    let endDate: Date;

    switch (period) {
      case StatisticsPeriod.WEEK: {
        startDate = new Date(currentStart);
        startDate.setDate(startDate.getDate() - 7);
        startDate.setHours(0, 0, 0, 0);

        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
        break;
      }

      case StatisticsPeriod.MONTH: {
        startDate = new Date(currentStart.getFullYear(), currentStart.getMonth() - 1, 1);
        startDate.setHours(0, 0, 0, 0);

        endDate = new Date(currentStart.getFullYear(), currentStart.getMonth(), 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      }

      case StatisticsPeriod.YEAR: {
        startDate = new Date(currentStart.getFullYear() - 1, 0, 1);
        startDate.setHours(0, 0, 0, 0);

        endDate = new Date(currentStart.getFullYear() - 1, 11, 31);
        endDate.setHours(23, 59, 59, 999);
        break;
      }
    }

    return { startDate, endDate };
  }

  private calculateTrend(current: number, previous: number): number | undefined {
    if (previous === 0) return undefined;
    return Number((((current - previous) / previous) * 100).toFixed(1));
  }

  private generateProgressionIntervals(period: StatisticsPeriod): DateInterval[] {
    const now = new Date();
    const year = now.getFullYear();
    const intervals: DateInterval[] = [];

    switch (period) {
      case StatisticsPeriod.WEEK: {
        const jan1 = new Date(year, 0, 1);
        const dayOfWeek = jan1.getDay();
        const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        let weekStart = new Date(year, 0, 1 + mondayOffset);
        weekStart.setHours(0, 0, 0, 0);

        let weekNumber = 1;

        while (weekStart.getFullYear() <= year) {
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekStart.getDate() + 6);
          weekEnd.setHours(23, 59, 59, 999);

          intervals.push({
            index: weekNumber,
            intervalType: IntervalType.WEEK,
            startDate: new Date(weekStart),
            endDate: new Date(weekEnd),
          });

          weekStart = new Date(weekEnd);
          weekStart.setDate(weekStart.getDate() + 1);
          weekStart.setHours(0, 0, 0, 0);
          weekNumber++;

          if (weekStart.getFullYear() > year) break;
        }
        break;
      }

      case StatisticsPeriod.MONTH:
      case StatisticsPeriod.YEAR: {
        for (let i = 0; i < 12; i++) {
          const monthStart = new Date(year, i, 1);
          monthStart.setHours(0, 0, 0, 0);

          const monthEnd = new Date(year, i + 1, 0);
          monthEnd.setHours(23, 59, 59, 999);

          intervals.push({
            index: i,
            intervalType: IntervalType.MONTH,
            startDate: monthStart,
            endDate: monthEnd,
          });
        }
        break;
      }
    }

    return intervals;
  }

  private calculateMetricValue(
    activities: { distance: number; movingTime: number; totalElevationGain: number }[],
    metric: ProgressionMetric,
    sportType: SportType,
  ): number {
    if (activities.length === 0) return 0;

    switch (metric) {
      case ProgressionMetric.DISTANCE:
        return activities.reduce((sum, a) => sum + (a.distance ?? 0), 0);

      case ProgressionMetric.DURATION:
        return activities.reduce((sum, a) => sum + (a.movingTime ?? 0), 0);

      case ProgressionMetric.SESSIONS:
        return activities.length;

      case ProgressionMetric.ELEVATION:
        return activities.reduce((sum, a) => sum + (a.totalElevationGain ?? 0), 0);

      case ProgressionMetric.PACE: {
        if (sportType !== SportType.RUN && sportType !== SportType.SWIM) return 0;
        const totalDistance = activities.reduce((sum, a) => sum + (a.distance ?? 0), 0);
        const totalTime = activities.reduce((sum, a) => sum + (a.movingTime ?? 0), 0);
        return totalDistance > 0 ? (totalTime / totalDistance) * 1000 : 0;
      }

      case ProgressionMetric.SPEED: {
        if (sportType !== SportType.RIDE) return 0;
        const totalDistance = activities.reduce((sum, a) => sum + (a.distance ?? 0), 0);
        const totalTime = activities.reduce((sum, a) => sum + (a.movingTime ?? 0), 0);
        return totalTime > 0 ? (totalDistance / totalTime) * 3.6 : 0;
      }

      default:
        return 0;
    }
  }
}
