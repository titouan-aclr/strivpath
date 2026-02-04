import { Resolver, Query, Args, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { TokenPayload } from '../auth/types/token-payload.interface';
import { StatisticsService } from './statistics.service';
import { PeriodStatistics } from './models/period-statistics.model';
import { ActivityCalendarDay } from './models/activity-calendar-day.model';
import { SportDistribution } from './models/sport-distribution.model';
import { SportPeriodStatistics } from './models/sport-period-statistics.model';
import { SportAverageMetrics } from './models/sport-average-metrics.model';
import { ProgressionDataPoint } from './models/progression-data-point.model';
import { PersonalRecord } from './models/personal-record.model';
import { StatisticsPeriod } from './enums/statistics-period.enum';
import { ProgressionMetric } from './enums/progression-metric.enum';
import { SportType } from '../user-preferences/enums/sport-type.enum';

@Resolver()
export class StatisticsResolver {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Query(() => PeriodStatistics, {
    description: 'Get aggregated statistics for a specific time period',
  })
  @UseGuards(GqlAuthGuard)
  async periodStatistics(
    @CurrentUser() tokenPayload: TokenPayload,
    @Args('period', { type: () => StatisticsPeriod }) period: StatisticsPeriod,
  ): Promise<PeriodStatistics> {
    return this.statisticsService.getPeriodStatistics(tokenPayload.sub, period);
  }

  @Query(() => [ActivityCalendarDay], {
    description: 'Get activity calendar data for heatmap visualization',
  })
  @UseGuards(GqlAuthGuard)
  async activityCalendar(
    @CurrentUser() tokenPayload: TokenPayload,
    @Args('year', { type: () => Int, description: 'The year to retrieve calendar data for' })
    year: number,
    @Args('month', {
      type: () => Int,
      nullable: true,
      description: 'Optional month (1-12) to limit results to a specific month',
    })
    month?: number,
  ): Promise<ActivityCalendarDay[]> {
    return this.statisticsService.getActivityCalendar(tokenPayload.sub, year, month);
  }

  @Query(() => [SportDistribution], {
    description: 'Get distribution of training time by sport type for the current month',
  })
  @UseGuards(GqlAuthGuard)
  async sportDistribution(@CurrentUser() tokenPayload: TokenPayload): Promise<SportDistribution[]> {
    return this.statisticsService.getSportDistribution(tokenPayload.sub);
  }

  @Query(() => SportPeriodStatistics, {
    description: 'Get aggregated statistics for a sport over a specific time period with trend comparisons',
  })
  @UseGuards(GqlAuthGuard)
  async sportPeriodStatistics(
    @CurrentUser() tokenPayload: TokenPayload,
    @Args('sportType', { type: () => SportType }) sportType: SportType,
    @Args('period', { type: () => StatisticsPeriod }) period: StatisticsPeriod,
  ): Promise<SportPeriodStatistics> {
    return this.statisticsService.getSportPeriodStatistics(tokenPayload.sub, sportType, period);
  }

  @Query(() => [ProgressionDataPoint], {
    description: 'Get progression data points for chart visualization',
  })
  @UseGuards(GqlAuthGuard)
  async sportProgressionData(
    @CurrentUser() tokenPayload: TokenPayload,
    @Args('sportType', { type: () => SportType }) sportType: SportType,
    @Args('period', { type: () => StatisticsPeriod }) period: StatisticsPeriod,
    @Args('metric', { type: () => ProgressionMetric }) metric: ProgressionMetric,
  ): Promise<ProgressionDataPoint[]> {
    return this.statisticsService.getSportProgressionData(tokenPayload.sub, sportType, period, metric);
  }

  @Query(() => SportAverageMetrics, {
    description: 'Get average performance metrics for a sport over a time period',
  })
  @UseGuards(GqlAuthGuard)
  async sportAverageMetrics(
    @CurrentUser() tokenPayload: TokenPayload,
    @Args('sportType', { type: () => SportType }) sportType: SportType,
    @Args('period', { type: () => StatisticsPeriod }) period: StatisticsPeriod,
  ): Promise<SportAverageMetrics> {
    return this.statisticsService.getSportAverageMetrics(tokenPayload.sub, sportType, period);
  }

  @Query(() => [PersonalRecord], {
    description: 'Get personal records for a specific sport',
  })
  @UseGuards(GqlAuthGuard)
  async personalRecords(
    @CurrentUser() tokenPayload: TokenPayload,
    @Args('sportType', { type: () => SportType }) sportType: SportType,
  ): Promise<PersonalRecord[]> {
    return this.statisticsService.getPersonalRecords(tokenPayload.sub, sportType);
  }
}
