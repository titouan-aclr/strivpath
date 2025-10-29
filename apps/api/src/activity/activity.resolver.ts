import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { Activity } from './models/activity.model';
import { SyncHistory } from '../sync-history/models/sync-history.model';
import { ActivitiesFilterInput } from './dto/activity.input';
import { ActivityService } from './activity.service';
import { SyncHistoryService } from '../sync-history/sync-history.service';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { TokenPayload } from '../auth/types';

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
    });
  }

  @Query(() => Activity, { nullable: true, description: 'Get a single activity by ID' })
  @UseGuards(GqlAuthGuard)
  async activity(
    @CurrentUser() tokenPayload: TokenPayload,
    @Args('id', { type: () => Int }) id: number,
  ): Promise<Activity | null> {
    return this.activityService.findById(id, tokenPayload.sub);
  }

  @Query(() => SyncHistory, { nullable: true, description: 'Get the latest sync status' })
  @UseGuards(GqlAuthGuard)
  async syncStatus(@CurrentUser() tokenPayload: TokenPayload): Promise<SyncHistory | null> {
    return this.syncHistoryService.findLatestForUser(tokenPayload.sub);
  }
}
