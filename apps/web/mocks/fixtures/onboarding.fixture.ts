import { SyncStatus, SyncStage, type SyncHistory } from '@/gql/graphql';

export const createMockSyncHistory = (overrides?: Partial<SyncHistory>): SyncHistory => {
  const now = new Date();

  return {
    __typename: 'SyncHistory',
    id: '1',
    userId: 1,
    status: SyncStatus.Pending,
    stage: null,
    totalActivities: 0,
    processedActivities: 0,
    errorMessage: null,
    startedAt: now,
    completedAt: null,
    goalsUpdatedCount: null,
    goalsCompletedCount: null,
    completedGoalIds: null,
    ...overrides,
  };
};

export const MOCK_SYNC_HISTORIES = {
  pending: createMockSyncHistory({ status: SyncStatus.Pending }),

  fetchingInProgress: createMockSyncHistory({
    status: SyncStatus.InProgress,
    stage: SyncStage.Fetching,
    totalActivities: 100,
    processedActivities: 25,
  }),

  storingInProgress: createMockSyncHistory({
    status: SyncStatus.InProgress,
    stage: SyncStage.Storing,
    totalActivities: 100,
    processedActivities: 50,
  }),

  computingInProgress: createMockSyncHistory({
    status: SyncStatus.InProgress,
    stage: SyncStage.Computing,
    totalActivities: 100,
    processedActivities: 75,
  }),

  completed: createMockSyncHistory({
    status: SyncStatus.Completed,
    stage: SyncStage.Done,
    totalActivities: 100,
    processedActivities: 100,
    completedAt: new Date(),
    goalsUpdatedCount: 3,
    goalsCompletedCount: 1,
    completedGoalIds: [1],
  }),

  failed: createMockSyncHistory({
    status: SyncStatus.Failed,
    stage: SyncStage.Fetching,
    totalActivities: 100,
    processedActivities: 20,
    errorMessage: 'Database connection lost',
  }),
};
