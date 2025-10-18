import { Injectable, BadRequestException } from '@nestjs/common';
import { Activity, SyncHistory, SyncStatus, SyncStage, SportType } from '@repo/graphql-types';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { StravaService } from '../strava/strava.service';
import { SyncHistoryService } from '../sync-history/sync-history.service';
import { ActivityMapper } from './activity.mapper';
import { StravaActivitySummary } from '../strava/types';

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

    while (hasMore) {
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

    while (hasMore) {
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

    if (!preferences || !preferences.selectedSports) {
      throw new BadRequestException('User preferences not found or no sports selected');
    }

    const selectedSports = preferences.selectedSports as string[];

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
      type?: string;
    },
  ): Promise<Activity[]> {
    const { offset = 0, limit = 30, type } = options ?? {};

    const prismaActivities = await this.prisma.activity.findMany({
      where: {
        userId,
        ...(type && { type }),
      },
      orderBy: { startDate: 'desc' },
      skip: offset,
      take: limit,
    });

    return prismaActivities.map(activity => ActivityMapper.toGraphQL(activity));
  }

  async findById(activityId: number, userId: number): Promise<Activity | null> {
    const prismaActivity = await this.prisma.activity.findFirst({
      where: {
        id: activityId,
        userId,
      },
    });

    return prismaActivity ? ActivityMapper.toGraphQL(prismaActivity) : null;
  }
}
