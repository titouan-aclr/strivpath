import { SyncHistoryMapper } from './sync-history.mapper';
import { createMockPrismaSyncHistory } from '../../test/mocks/factories';
import { SyncStatus } from './enums/sync-status.enum';
import { SyncStage } from './enums/sync-stage.enum';

describe('SyncHistoryMapper', () => {
  describe('toGraphQL', () => {
    it('should map all required fields correctly', () => {
      const prismaSyncHistory = createMockPrismaSyncHistory({
        id: 1,
        userId: 10,
        status: 'COMPLETED',
        stage: 'COMPLETED',
        totalActivities: 100,
        processedActivities: 100,
        errorMessage: null,
        startedAt: new Date('2024-01-01T10:00:00Z'),
        completedAt: new Date('2024-01-01T10:05:00Z'),
      });

      const result = SyncHistoryMapper.toGraphQL(prismaSyncHistory);

      expect(result).toEqual({
        id: 1,
        userId: 10,
        status: 'COMPLETED' as SyncStatus,
        stage: 'COMPLETED' as SyncStage,
        totalActivities: 100,
        processedActivities: 100,
        errorMessage: undefined,
        startedAt: new Date('2024-01-01T10:00:00Z'),
        completedAt: new Date('2024-01-01T10:05:00Z'),
      });
    });

    it('should convert null to undefined for optional fields', () => {
      const prismaSyncHistory = createMockPrismaSyncHistory({
        errorMessage: null,
        completedAt: null,
        stage: null,
      });

      const result = SyncHistoryMapper.toGraphQL(prismaSyncHistory);

      expect(result.errorMessage).toBeUndefined();
      expect(result.completedAt).toBeUndefined();
      expect(result.stage).toBeUndefined();
    });

    it('should map status enum correctly', () => {
      const pendingSync = createMockPrismaSyncHistory({ status: 'PENDING' });
      const inProgressSync = createMockPrismaSyncHistory({ status: 'IN_PROGRESS' });
      const completedSync = createMockPrismaSyncHistory({ status: 'COMPLETED' });
      const failedSync = createMockPrismaSyncHistory({ status: 'FAILED' });

      expect(SyncHistoryMapper.toGraphQL(pendingSync).status).toBe('PENDING');
      expect(SyncHistoryMapper.toGraphQL(inProgressSync).status).toBe('IN_PROGRESS');
      expect(SyncHistoryMapper.toGraphQL(completedSync).status).toBe('COMPLETED');
      expect(SyncHistoryMapper.toGraphQL(failedSync).status).toBe('FAILED');
    });

    it('should map stage enum correctly', () => {
      const fetchingStage = createMockPrismaSyncHistory({ stage: 'FETCHING_ACTIVITIES' });
      const storingStage = createMockPrismaSyncHistory({ stage: 'STORING_DATA' });
      const computingStage = createMockPrismaSyncHistory({ stage: 'COMPUTING_STATISTICS' });
      const completedStage = createMockPrismaSyncHistory({ stage: 'COMPLETED' });

      expect(SyncHistoryMapper.toGraphQL(fetchingStage).stage).toBe('FETCHING_ACTIVITIES');
      expect(SyncHistoryMapper.toGraphQL(storingStage).stage).toBe('STORING_DATA');
      expect(SyncHistoryMapper.toGraphQL(computingStage).stage).toBe('COMPUTING_STATISTICS');
      expect(SyncHistoryMapper.toGraphQL(completedStage).stage).toBe('COMPLETED');
    });

    it('should handle sync history in PENDING state', () => {
      const prismaSyncHistory = createMockPrismaSyncHistory({
        status: 'PENDING',
        stage: null,
        totalActivities: 0,
        processedActivities: 0,
        errorMessage: null,
        completedAt: null,
      });

      const result = SyncHistoryMapper.toGraphQL(prismaSyncHistory);

      expect(result.status).toBe('PENDING');
      expect(result.stage).toBeUndefined();
      expect(result.totalActivities).toBe(0);
      expect(result.processedActivities).toBe(0);
      expect(result.errorMessage).toBeUndefined();
      expect(result.completedAt).toBeUndefined();
      expect(result.startedAt).toBeDefined();
    });

    it('should handle sync history in COMPLETED state', () => {
      const prismaSyncHistory = createMockPrismaSyncHistory({
        status: 'COMPLETED',
        stage: 'COMPLETED',
        totalActivities: 250,
        processedActivities: 250,
        errorMessage: null,
        startedAt: new Date('2024-02-15T08:00:00Z'),
        completedAt: new Date('2024-02-15T08:10:00Z'),
      });

      const result = SyncHistoryMapper.toGraphQL(prismaSyncHistory);

      expect(result.status).toBe('COMPLETED');
      expect(result.stage).toBe('COMPLETED');
      expect(result.totalActivities).toBe(250);
      expect(result.processedActivities).toBe(250);
      expect(result.errorMessage).toBeUndefined();
      expect(result.completedAt).toEqual(new Date('2024-02-15T08:10:00Z'));
    });

    it('should handle sync history in FAILED state with error message', () => {
      const prismaSyncHistory = createMockPrismaSyncHistory({
        status: 'FAILED',
        stage: 'FETCHING_ACTIVITIES',
        totalActivities: 100,
        processedActivities: 42,
        errorMessage: 'Strava API rate limit exceeded',
        startedAt: new Date('2024-03-01T12:00:00Z'),
        completedAt: new Date('2024-03-01T12:02:30Z'),
      });

      const result = SyncHistoryMapper.toGraphQL(prismaSyncHistory);

      expect(result.status).toBe('FAILED');
      expect(result.stage).toBe('FETCHING_ACTIVITIES');
      expect(result.totalActivities).toBe(100);
      expect(result.processedActivities).toBe(42);
      expect(result.errorMessage).toBe('Strava API rate limit exceeded');
      expect(result.completedAt).toEqual(new Date('2024-03-01T12:02:30Z'));
    });

    it('should handle sync history in IN_PROGRESS state', () => {
      const prismaSyncHistory = createMockPrismaSyncHistory({
        status: 'IN_PROGRESS',
        stage: 'STORING_DATA',
        totalActivities: 500,
        processedActivities: 150,
        errorMessage: null,
        completedAt: null,
      });

      const result = SyncHistoryMapper.toGraphQL(prismaSyncHistory);

      expect(result.status).toBe('IN_PROGRESS');
      expect(result.stage).toBe('STORING_DATA');
      expect(result.totalActivities).toBe(500);
      expect(result.processedActivities).toBe(150);
      expect(result.errorMessage).toBeUndefined();
      expect(result.completedAt).toBeUndefined();
    });

    it('should preserve date objects without modification', () => {
      const startedAt = new Date('2024-04-10T14:00:00Z');
      const completedAt = new Date('2024-04-10T14:15:00Z');

      const prismaSyncHistory = createMockPrismaSyncHistory({
        startedAt,
        completedAt,
      });

      const result = SyncHistoryMapper.toGraphQL(prismaSyncHistory);

      expect(result.startedAt).toBe(startedAt);
      expect(result.completedAt).toBe(completedAt);
    });

    it('should handle zero processed activities', () => {
      const prismaSyncHistory = createMockPrismaSyncHistory({
        totalActivities: 100,
        processedActivities: 0,
      });

      const result = SyncHistoryMapper.toGraphQL(prismaSyncHistory);

      expect(result.totalActivities).toBe(100);
      expect(result.processedActivities).toBe(0);
    });

    it('should maintain userId reference correctly', () => {
      const prismaSyncHistory = createMockPrismaSyncHistory({
        userId: 777,
      });

      const result = SyncHistoryMapper.toGraphQL(prismaSyncHistory);

      expect(result.userId).toBe(777);
    });

    it('should handle partial progress during sync', () => {
      const prismaSyncHistory = createMockPrismaSyncHistory({
        status: 'IN_PROGRESS',
        stage: 'COMPUTING_STATISTICS',
        totalActivities: 1000,
        processedActivities: 650,
        errorMessage: null,
        completedAt: null,
      });

      const result = SyncHistoryMapper.toGraphQL(prismaSyncHistory);

      expect(result.status).toBe('IN_PROGRESS');
      expect(result.stage).toBe('COMPUTING_STATISTICS');
      expect(result.totalActivities).toBe(1000);
      expect(result.processedActivities).toBe(650);
      expect(result.errorMessage).toBeUndefined();
      expect(result.completedAt).toBeUndefined();
    });

    it('should handle long error messages', () => {
      const longErrorMessage =
        'Failed to fetch activities from Strava API: Network timeout after 30 seconds. This might be due to poor connection or Strava API being temporarily unavailable. Please try again later.';

      const prismaSyncHistory = createMockPrismaSyncHistory({
        status: 'FAILED',
        errorMessage: longErrorMessage,
      });

      const result = SyncHistoryMapper.toGraphQL(prismaSyncHistory);

      expect(result.errorMessage).toBe(longErrorMessage);
    });
  });
});
