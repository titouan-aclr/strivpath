import { Injectable, BadRequestException } from '@nestjs/common';
import { Activity } from './models/activity.model';
import { SyncHistory } from '../sync-history/models/sync-history.model';
import { SyncStatus } from '../sync-history/enums/sync-status.enum';
import { SyncStage } from '../sync-history/enums/sync-stage.enum';
import { SportType } from '../user-preferences/enums/sport-type.enum';
import { ActivityType } from './enums/activity-type.enum';
import { OrderBy } from './enums/order-by.enum';
import { OrderDirection } from './enums/order-direction.enum';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { StravaService } from '../strava/strava.service';
import { SyncHistoryService } from '../sync-history/sync-history.service';
import { ActivityMapper } from './activity.mapper';
import { StravaActivitySummary } from '../strava/types';
import { StravaActivityDetail } from '../strava/types/strava-activity-detail.interface';
import { ActivitySyncLimitExceededException } from './exceptions/activity-sync-limit-exceeded.exception';

const STRAVA_SPORT_TYPE_MAPPING: Record<SportType, Set<string>> = {
  [SportType.RUN]: new Set(['Run', 'TrailRun', 'VirtualRun']),
  [SportType.RIDE]: new Set([
    'Ride',
    'MountainBikeRide',
    'VirtualRide',
    'EBikeRide',
    'EMountainBikeRide',
    'Velomobile',
  ]),
  [SportType.SWIM]: new Set(['Swim']),
};

@Injectable()
export class ActivityService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stravaService: StravaService,
    private readonly syncHistoryService: SyncHistoryService,
  ) {}

  private getActivitySportType(stravaType: string): SportType | null {
    for (const [sportType, stravaTypes] of Object.entries(STRAVA_SPORT_TYPE_MAPPING)) {
      if (stravaTypes.has(stravaType)) {
        return sportType as SportType;
      }
    }
    return null;
  }

  private shouldIncludeActivity(activityType: string, selectedSports: SportType[]): boolean {
    const sportType = this.getActivitySportType(activityType);
    if (!sportType) {
      return false;
    }
    return selectedSports.includes(sportType);
  }

  private async detectNewlySelectedSports(userId: number): Promise<SportType[]> {
    const preferences = await this.prisma.userPreferences.findUnique({
      where: { userId },
    });

    if (!preferences || !preferences.selectedSports) {
      return [];
    }

    const selectedSports = preferences.selectedSports as string[];

    const existingActivityTypes = await this.prisma.activity.findMany({
      where: { userId },
      select: { type: true },
      distinct: ['type'],
    });

    const existingSportTypes = new Set(
      existingActivityTypes
        .map(activity => this.getActivitySportType(activity.type))
        .filter((sportType): sportType is SportType => sportType !== null),
    );

    const newlySelectedSports = selectedSports.filter(
      sport => !existingSportTypes.has(sport as SportType),
    ) as SportType[];

    return newlySelectedSports;
  }

  private async syncHistoricalActivitiesForSports(
    userId: number,
    sports: SportType[],
  ): Promise<StravaActivitySummary[]> {
    const allActivities: StravaActivitySummary[] = [];
    let page = 1;
    const perPage = 100;
    let hasMore = true;
    const MAX_PAGES = 20;

    while (hasMore && page <= MAX_PAGES) {
      const activities = await this.stravaService.getActivities(userId, {
        page,
        per_page: perPage,
      });

      if (activities.length === 0) {
        hasMore = false;
      } else {
        const filteredActivities = activities.filter(activity => this.shouldIncludeActivity(activity.type, sports));
        allActivities.push(...filteredActivities);
        page++;
      }
    }

    if (page > MAX_PAGES) {
      throw new ActivitySyncLimitExceededException(userId, MAX_PAGES, allActivities.length, 'historical');
    }

    return allActivities;
  }

  private async syncRecentActivities(userId: number): Promise<StravaActivitySummary[]> {
    const latestActivity = await this.prisma.activity.findFirst({
      where: { userId },
      orderBy: { startDate: 'desc' },
    });

    const after = latestActivity ? Math.floor(new Date(latestActivity.startDate).getTime() / 1000) : undefined;

    const allActivities: StravaActivitySummary[] = [];
    let page = 1;
    const perPage = 100;
    let hasMore = true;
    const MAX_PAGES = 20;

    while (hasMore && page <= MAX_PAGES) {
      const activities = await this.stravaService.getActivities(userId, {
        page,
        per_page: perPage,
        ...(after && { after }),
      });

      if (activities.length === 0) {
        hasMore = false;
      } else {
        allActivities.push(...activities);
        page++;
      }
    }

    if (page > MAX_PAGES) {
      throw new ActivitySyncLimitExceededException(userId, MAX_PAGES, allActivities.length, 'recent');
    }

    return allActivities;
  }

  private async storeActivities(
    activities: StravaActivitySummary[],
    userId: number,
    selectedSports: SportType[],
    syncId: number,
  ): Promise<void> {
    await this.syncHistoryService.update(syncId, {
      stage: SyncStage.STORING,
      totalActivities: activities.length,
    });

    for (let i = 0; i < activities.length; i++) {
      const stravaActivity = activities[i];

      if (!this.shouldIncludeActivity(stravaActivity.type, selectedSports)) {
        continue;
      }

      await this.prisma.activity.upsert({
        where: { stravaId: BigInt(stravaActivity.id) },
        create: {
          stravaId: BigInt(stravaActivity.id),
          userId,
          name: stravaActivity.name,
          type: stravaActivity.type,
          distance: stravaActivity.distance,
          movingTime: stravaActivity.moving_time,
          elapsedTime: stravaActivity.elapsed_time,
          totalElevationGain: stravaActivity.total_elevation_gain,
          startDate: new Date(stravaActivity.start_date),
          startDateLocal: new Date(stravaActivity.start_date_local),
          timezone: stravaActivity.timezone,
          averageSpeed: stravaActivity.average_speed,
          maxSpeed: stravaActivity.max_speed,
          averageHeartrate: stravaActivity.average_heartrate,
          maxHeartrate: stravaActivity.max_heartrate,
          kilojoules: stravaActivity.kilojoules,
          deviceWatts: stravaActivity.device_watts,
          hasKudoed: stravaActivity.has_kudoed,
          kudosCount: stravaActivity.kudos_count,
          averageCadence: stravaActivity.average_cadence,
          elevHigh: stravaActivity.elev_high,
          elevLow: stravaActivity.elev_low,
          averageWatts: stravaActivity.average_watts,
          weightedAverageWatts: stravaActivity.weighted_average_watts,
          maxWatts: stravaActivity.max_watts,
          raw: stravaActivity as unknown as Prisma.InputJsonValue,
        },
        update: {
          name: stravaActivity.name,
          type: stravaActivity.type,
          distance: stravaActivity.distance,
          movingTime: stravaActivity.moving_time,
          elapsedTime: stravaActivity.elapsed_time,
          totalElevationGain: stravaActivity.total_elevation_gain,
          startDate: new Date(stravaActivity.start_date),
          startDateLocal: new Date(stravaActivity.start_date_local),
          timezone: stravaActivity.timezone,
          averageSpeed: stravaActivity.average_speed,
          maxSpeed: stravaActivity.max_speed,
          averageHeartrate: stravaActivity.average_heartrate,
          maxHeartrate: stravaActivity.max_heartrate,
          kilojoules: stravaActivity.kilojoules,
          deviceWatts: stravaActivity.device_watts,
          hasKudoed: stravaActivity.has_kudoed,
          kudosCount: stravaActivity.kudos_count,
          averageCadence: stravaActivity.average_cadence,
          elevHigh: stravaActivity.elev_high,
          elevLow: stravaActivity.elev_low,
          averageWatts: stravaActivity.average_watts,
          weightedAverageWatts: stravaActivity.weighted_average_watts,
          maxWatts: stravaActivity.max_watts,
          raw: stravaActivity as unknown as Prisma.InputJsonValue,
        },
      });

      if ((i + 1) % 10 === 0 || i === activities.length - 1) {
        await this.syncHistoryService.update(syncId, {
          processedActivities: i + 1,
        });
      }
    }
  }

  async syncActivities(userId: number): Promise<SyncHistory> {
    const preferences = await this.prisma.userPreferences.findUnique({
      where: { userId },
    });

    if (!preferences) {
      throw new BadRequestException('User preferences not found');
    }

    const selectedSports = (preferences.selectedSports as string[]) || [];

    if (selectedSports.length === 0) {
      throw new BadRequestException('User preferences not found or no sports selected');
    }

    const sync = await this.syncHistoryService.create(userId);

    try {
      await this.syncHistoryService.update(sync.id, {
        status: SyncStatus.IN_PROGRESS,
        stage: SyncStage.FETCHING,
      });

      const newlySelectedSports = await this.detectNewlySelectedSports(userId);

      const allActivities: StravaActivitySummary[] = [];

      if (newlySelectedSports.length > 0) {
        const historicalActivities = await this.syncHistoricalActivitiesForSports(userId, newlySelectedSports);
        allActivities.push(...historicalActivities);
      }

      const recentActivities = await this.syncRecentActivities(userId);
      allActivities.push(...recentActivities);

      await this.storeActivities(allActivities, userId, selectedSports as SportType[], sync.id);

      await this.syncHistoryService.update(sync.id, {
        stage: SyncStage.COMPUTING,
      });

      await this.syncHistoryService.update(sync.id, {
        status: SyncStatus.COMPLETED,
        stage: SyncStage.DONE,
        completedAt: new Date(),
      });

      return this.syncHistoryService.findById(sync.id) as Promise<SyncHistory>;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error during sync';

      await this.syncHistoryService.update(sync.id, {
        status: SyncStatus.FAILED,
        errorMessage,
        completedAt: new Date(),
      });

      throw new BadRequestException(`Activity sync failed: ${errorMessage}`);
    }
  }

  async findAll(
    userId: number,
    options?: {
      offset?: number;
      limit?: number;
      type?: ActivityType;
      startDate?: Date;
      endDate?: Date;
      orderBy?: OrderBy;
      orderDirection?: OrderDirection;
    },
  ): Promise<Activity[]> {
    const {
      offset = 0,
      limit = 30,
      type,
      startDate,
      endDate,
      orderBy = OrderBy.DATE,
      orderDirection = OrderDirection.DESC,
    } = options ?? {};

    if (startDate && endDate && startDate > endDate) {
      throw new BadRequestException('startDate must be before or equal to endDate');
    }

    const where: Prisma.ActivityWhereInput = {
      userId,
      ...(type && { type }),
      ...((startDate || endDate) && {
        startDate: {
          ...(startDate && { gte: startDate }),
          ...(endDate && { lte: endDate }),
        },
      }),
    };

    const orderByFieldMap: Record<OrderBy, keyof Prisma.ActivityOrderByWithRelationInput> = {
      [OrderBy.DATE]: 'startDate',
      [OrderBy.DISTANCE]: 'distance',
      [OrderBy.DURATION]: 'movingTime',
    };

    const sortField = orderByFieldMap[orderBy];
    const sortDirection = orderDirection.toLowerCase() as 'asc' | 'desc';

    const prismaActivities = await this.prisma.activity.findMany({
      where,
      orderBy: { [sortField]: sortDirection },
      skip: offset,
      take: limit,
    });

    return prismaActivities.map(activity => ActivityMapper.toGraphQL(activity));
  }

  async findByStravaId(stravaId: bigint, userId: number): Promise<Activity | null> {
    const prismaActivity = await this.prisma.activity.findFirst({
      where: {
        stravaId,
        userId,
      },
    });

    return prismaActivity ? ActivityMapper.toGraphQL(prismaActivity) : null;
  }

  async fetchActivityDetails(userId: number, stravaId: bigint): Promise<Activity> {
    const existingActivity = await this.prisma.activity.findFirst({
      where: { stravaId, userId },
    });

    if (!existingActivity) {
      throw new BadRequestException(`Activity with stravaId ${stravaId} not found`);
    }

    if (existingActivity.detailsFetched) {
      return ActivityMapper.toGraphQL(existingActivity);
    }

    const stravaDetail: StravaActivityDetail = await this.stravaService.getActivityDetail(userId, Number(stravaId));

    const updatedActivity = await this.prisma.activity.update({
      where: { id: existingActivity.id },
      data: {
        calories: stravaDetail.calories,
        splits: stravaDetail.splits_metric as unknown as Prisma.InputJsonValue,
        description: stravaDetail.description,
        detailsFetched: true,
        detailsFetchedAt: new Date(),
      },
    });

    return ActivityMapper.toGraphQL(updatedActivity);
  }
}
