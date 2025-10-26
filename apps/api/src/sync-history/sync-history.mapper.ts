import { SyncHistory as PrismaSyncHistory } from '@prisma/client';
import { SyncHistory as GraphQLSyncHistory, SyncStatus, SyncStage } from '@repo/graphql-types';

export class SyncHistoryMapper {
  static toGraphQL(prismaSyncHistory: PrismaSyncHistory): GraphQLSyncHistory {
    return {
      id: prismaSyncHistory.id,
      userId: prismaSyncHistory.userId,
      status: prismaSyncHistory.status as SyncStatus,
      stage: prismaSyncHistory.stage ? (prismaSyncHistory.stage as SyncStage) : undefined,
      totalActivities: prismaSyncHistory.totalActivities,
      processedActivities: prismaSyncHistory.processedActivities,
      errorMessage: prismaSyncHistory.errorMessage ?? undefined,
      startedAt: prismaSyncHistory.startedAt,
      completedAt: prismaSyncHistory.completedAt ?? undefined,
    };
  }
}
