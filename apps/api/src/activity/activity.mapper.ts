import { Activity as PrismaActivity } from '@prisma/client';
import { Activity as GraphQLActivity } from './models/activity.model';
import { Split } from './types/split.type';

interface StravaSplitRaw {
  distance?: number;
  moving_time?: number;
  elapsed_time?: number;
  average_speed?: number;
  elevation_difference?: number;
}

export class ActivityMapper {
  private static mapSplit(this: void, rawSplit: StravaSplitRaw): Split {
    return {
      distance: rawSplit.distance,
      movingTime: rawSplit.moving_time,
      elapsedTime: rawSplit.elapsed_time,
      averageSpeed: rawSplit.average_speed,
      elevationDifference: rawSplit.elevation_difference,
    };
  }

  static toGraphQL(prismaActivity: PrismaActivity): GraphQLActivity {
    return {
      id: prismaActivity.id,
      stravaId: prismaActivity.stravaId,
      userId: prismaActivity.userId,
      name: prismaActivity.name,
      type: prismaActivity.type,
      distance: prismaActivity.distance,
      movingTime: prismaActivity.movingTime,
      elapsedTime: prismaActivity.elapsedTime,
      totalElevationGain: prismaActivity.totalElevationGain,
      startDate: prismaActivity.startDate,
      startDateLocal: prismaActivity.startDateLocal,
      timezone: prismaActivity.timezone,
      averageSpeed: prismaActivity.averageSpeed ?? undefined,
      maxSpeed: prismaActivity.maxSpeed ?? undefined,
      averageHeartrate: prismaActivity.averageHeartrate ?? undefined,
      maxHeartrate: prismaActivity.maxHeartrate ?? undefined,
      kilojoules: prismaActivity.kilojoules ?? undefined,
      deviceWatts: prismaActivity.deviceWatts ?? undefined,
      hasKudoed: prismaActivity.hasKudoed,
      kudosCount: prismaActivity.kudosCount,
      averageCadence: prismaActivity.averageCadence ?? undefined,
      elevHigh: prismaActivity.elevHigh ?? undefined,
      elevLow: prismaActivity.elevLow ?? undefined,
      calories: prismaActivity.calories ?? undefined,
      splits: prismaActivity.splits
        ? (prismaActivity.splits as unknown as StravaSplitRaw[]).map(ActivityMapper.mapSplit)
        : undefined,
      averageWatts: prismaActivity.averageWatts ?? undefined,
      weightedAverageWatts: prismaActivity.weightedAverageWatts ?? undefined,
      maxWatts: prismaActivity.maxWatts ?? undefined,
      description: prismaActivity.description ?? undefined,
      detailsFetched: prismaActivity.detailsFetched,
      detailsFetchedAt: prismaActivity.detailsFetchedAt ?? undefined,
      createdAt: prismaActivity.createdAt,
      updatedAt: prismaActivity.updatedAt,
    };
  }
}
