import { Activity as PrismaActivity } from '@prisma/client';
import { Activity as GraphQLActivity } from './models/activity.model';

export class ActivityMapper {
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
      createdAt: prismaActivity.createdAt,
      updatedAt: prismaActivity.updatedAt,
    };
  }
}
