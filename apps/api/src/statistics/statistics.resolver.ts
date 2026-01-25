import { Resolver, Query, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { TokenPayload } from '../auth/types/token-payload.interface';
import { StatisticsService } from './statistics.service';
import { PeriodStatistics } from './models/period-statistics.model';
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
}
