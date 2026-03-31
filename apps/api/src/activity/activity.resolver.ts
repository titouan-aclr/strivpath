import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { TokenPayload } from '../auth/types';
import { SyncHistory } from '../sync-history/models/sync-history.model';
import { SyncHistoryService } from '../sync-history/sync-history.service';
import { ActivityService } from './activity.service';
import { ActivitiesFilterInput } from './dto/activity.input';
import { Activity } from './models/activity.model';

@Resolver(() => Activity)
export class ActivityResolver {
  constructor(
    private readonly activityService: ActivityService,
    private readonly syncHistoryService: SyncHistoryService,
  ) {}

  @Mutation(() => SyncHistory, { description: 'Synchronize activities from Strava' })
  @UseGuards(GqlAuthGuard)
  async syncActivities(@CurrentUser() tokenPayload: TokenPayload): Promise<SyncHistory> {
    return this.activityService.syncActivities(tokenPayload.sub);
  }

  @Query(() => [Activity], { description: 'Get activities with optional filtering and pagination' })
  @UseGuards(GqlAuthGuard)
  async activities(
    @CurrentUser() tokenPayload: TokenPayload,
    @Args('filter', { type: () => ActivitiesFilterInput, nullable: true }) filter?: ActivitiesFilterInput,
  ): Promise<Activity[]> {
    return this.activityService.findAll(tokenPayload.sub, {
      offset: filter?.offset,
      limit: filter?.limit,
      type: filter?.type,
      startDate: filter?.startDate,
      endDate: filter?.endDate,
      orderBy: filter?.orderBy,
      orderDirection: filter?.orderDirection,
    });
  }

  @Query(() => Activity, { nullable: true, description: 'Get a single activity by Strava ID' })
  @UseGuards(GqlAuthGuard)
  async activity(
    @CurrentUser() tokenPayload: TokenPayload,
    @Args('stravaId', { type: () => String }) stravaId: string,
  ): Promise<Activity | null> {
    return this.activityService.findByStravaId(BigInt(stravaId), tokenPayload.sub);
  }

  @Query(() => SyncHistory, { nullable: true, description: 'Get the latest sync status' })
  @UseGuards(GqlAuthGuard)
  async syncStatus(@CurrentUser() tokenPayload: TokenPayload): Promise<SyncHistory | null> {
    return this.syncHistoryService.findLatestForUser(tokenPayload.sub);
  }

  @Mutation(() => Activity, {
    description: 'Fetch detailed activity data from Strava on-demand (calories, splits, description)',
  })
  @UseGuards(GqlAuthGuard)
  async fetchActivityDetails(
    @Args('stravaId', { type: () => String }) stravaId: string,
    @CurrentUser() tokenPayload: TokenPayload,
  ): Promise<Activity> {
    return this.activityService.fetchActivityDetails(tokenPayload.sub, BigInt(stravaId));
  }
}
