import { Resolver, Query, Args, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { TokenPayload } from '../auth/types/token-payload.interface';
import { StatisticsService } from './statistics.service';
import { PeriodStatistics } from './models/period-statistics.model';
import { ActivityCalendarDay } from './models/activity-calendar-day.model';
import { StatisticsPeriod } from './enums/statistics-period.enum';

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
}
