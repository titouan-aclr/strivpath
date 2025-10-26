import { Test, TestingModule } from '@nestjs/testing';
import { ActivityResolver } from './activity.resolver';
import { ActivityService } from './activity.service';
import { SyncHistoryService } from '../sync-history/sync-history.service';
import { Activity, SyncHistory, SyncStatus, SyncStage } from '@repo/graphql-types';
import { TokenPayload } from '../auth/types';

describe('ActivityResolver', () => {
  let resolver: ActivityResolver;
  let activityService: ActivityService;
  let syncHistoryService: SyncHistoryService;

  const mockActivityService = {
    syncActivities: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
  };

  const mockSyncHistoryService = {
    findLatestForUser: jest.fn(),
  };

  const mockTokenPayload: TokenPayload = {
    sub: 1,
    stravaId: 12345,
  };

  const mockActivity: Activity = {
    id: 1,
    stravaId: BigInt(123),
    userId: 1,
    name: 'Morning Run',
    type: 'Run',
    distance: 5000,
    movingTime: 1800,
    elapsedTime: 1900,
    totalElevationGain: 50,
    startDate: new Date(),
    startDateLocal: new Date(),
    timezone: 'Europe/Paris',
    averageSpeed: 2.78,
    maxSpeed: 4.5,
    hasKudoed: false,
    kudosCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockSyncHistory: SyncHistory = {
    id: 1,
    userId: 1,
    status: SyncStatus.COMPLETED,
    stage: SyncStage.DONE,
    totalActivities: 10,
    processedActivities: 10,
    startedAt: new Date(),
    completedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ActivityResolver,
        { provide: ActivityService, useValue: mockActivityService },
        { provide: SyncHistoryService, useValue: mockSyncHistoryService },
      ],
    }).compile();

    resolver = module.get<ActivityResolver>(ActivityResolver);
    activityService = module.get<ActivityService>(ActivityService);
    syncHistoryService = module.get<SyncHistoryService>(SyncHistoryService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('syncActivities', () => {
    it('should trigger activity synchronization', async () => {
      mockActivityService.syncActivities.mockResolvedValue(mockSyncHistory);

      const result = await resolver.syncActivities(mockTokenPayload);

      expect(activityService.syncActivities).toHaveBeenCalledWith(mockTokenPayload.sub);
      expect(result).toEqual(mockSyncHistory);
    });
  });

  describe('activities', () => {
    it('should return activities with default pagination', async () => {
      mockActivityService.findAll.mockResolvedValue([mockActivity]);

      const result = await resolver.activities(mockTokenPayload);

      expect(activityService.findAll).toHaveBeenCalledWith(mockTokenPayload.sub, {
        offset: undefined,
        limit: undefined,
        type: undefined,
      });
      expect(result).toEqual([mockActivity]);
    });

    it('should return activities with custom filter', async () => {
      const filter = { offset: 10, limit: 20, type: 'Run' };
      mockActivityService.findAll.mockResolvedValue([mockActivity]);

      const result = await resolver.activities(mockTokenPayload, filter);

      expect(activityService.findAll).toHaveBeenCalledWith(mockTokenPayload.sub, {
        offset: 10,
        limit: 20,
        type: 'Run',
      });
      expect(result).toEqual([mockActivity]);
    });
  });

  describe('activity', () => {
    it('should return a single activity by id', async () => {
      const activityId = 1;
      mockActivityService.findById.mockResolvedValue(mockActivity);

      const result = await resolver.activity(mockTokenPayload, activityId);

      expect(activityService.findById).toHaveBeenCalledWith(activityId, mockTokenPayload.sub);
      expect(result).toEqual(mockActivity);
    });

    it('should return null if activity not found', async () => {
      const activityId = 999;
      mockActivityService.findById.mockResolvedValue(null);

      const result = await resolver.activity(mockTokenPayload, activityId);

      expect(result).toBeNull();
    });
  });

  describe('syncStatus', () => {
    it('should return the latest sync status', async () => {
      mockSyncHistoryService.findLatestForUser.mockResolvedValue(mockSyncHistory);

      const result = await resolver.syncStatus(mockTokenPayload);

      expect(syncHistoryService.findLatestForUser).toHaveBeenCalledWith(mockTokenPayload.sub);
      expect(result).toEqual(mockSyncHistory);
    });

    it('should return null if no sync found', async () => {
      mockSyncHistoryService.findLatestForUser.mockResolvedValue(null);

      const result = await resolver.syncStatus(mockTokenPayload);

      expect(result).toBeNull();
    });
  });
});
