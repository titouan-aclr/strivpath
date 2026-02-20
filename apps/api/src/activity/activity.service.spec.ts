import { Test, TestingModule } from '@nestjs/testing';
import { ActivityService } from './activity.service';
import { PrismaService } from '../database/prisma.service';
import { StravaService } from '../strava/strava.service';
import { SyncHistoryService } from '../sync-history/sync-history.service';
import { GoalProgressUpdateService } from '../goal/goal-progress-update.service';
import { BadRequestException } from '@nestjs/common';
import { SyncStatus } from '../sync-history/enums/sync-status.enum';
import { SyncStage } from '../sync-history/enums/sync-stage.enum';
import { SportType } from '../user-preferences/enums/sport-type.enum';
import { ActivityType } from './enums/activity-type.enum';
import { OrderBy } from './enums/order-by.enum';
import { OrderDirection } from './enums/order-direction.enum';

describe('ActivityService', () => {
  let service: ActivityService;
  let prismaService: PrismaService;
  let stravaService: StravaService;
  let syncHistoryService: SyncHistoryService;
  let goalProgressUpdateService: GoalProgressUpdateService;

  const mockPrismaService = {
    userPreferences: {
      findUnique: jest.fn(),
    },
    activity: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      upsert: jest.fn(),
      update: jest.fn(),
      deleteMany: jest.fn(),
    },
  };

  const mockStravaService = {
    getActivities: jest.fn(),
    getActivityDetail: jest.fn(),
  };

  const mockSyncHistoryService = {
    create: jest.fn(),
    update: jest.fn(),
    findById: jest.fn(),
  };

  const mockGoalProgressUpdateService = {
    updateAllGoalsForUser: jest.fn().mockResolvedValue({
      totalGoals: 0,
      successCount: 0,
      failureCount: 0,
      completedGoalIds: [],
      failedGoalIds: [],
      errors: [],
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ActivityService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: StravaService, useValue: mockStravaService },
        { provide: SyncHistoryService, useValue: mockSyncHistoryService },
        { provide: GoalProgressUpdateService, useValue: mockGoalProgressUpdateService },
      ],
    }).compile();

    service = module.get<ActivityService>(ActivityService);
    prismaService = module.get<PrismaService>(PrismaService);
    stravaService = module.get<StravaService>(StravaService);
    syncHistoryService = module.get<SyncHistoryService>(SyncHistoryService);
    goalProgressUpdateService = module.get<GoalProgressUpdateService>(GoalProgressUpdateService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('syncActivities', () => {
    it('should throw BadRequestException if no preferences found', async () => {
      const userId = 1;

      mockPrismaService.userPreferences.findUnique.mockResolvedValue(null);

      await expect(service.syncActivities(userId)).rejects.toThrow(BadRequestException);
      await expect(service.syncActivities(userId)).rejects.toThrow('User preferences not found');
    });

    it('should throw BadRequestException if selectedSports is empty', async () => {
      const userId = 1;
      const mockPreferences = {
        id: 1,
        userId,
        selectedSports: [],
        onboardingCompleted: true,
        locale: 'en',
        theme: 'system',
      };

      mockPrismaService.userPreferences.findUnique.mockResolvedValue(mockPreferences);

      await expect(service.syncActivities(userId)).rejects.toThrow(BadRequestException);
      await expect(service.syncActivities(userId)).rejects.toThrow('User preferences not found or no sports selected');
    });

    it('should perform incremental sync when no newly selected sports', async () => {
      const userId = 1;
      const mockPreferences = {
        id: 1,
        userId,
        selectedSports: [SportType.RUN],
        onboardingCompleted: true,
        locale: 'en',
        theme: 'system',
      };
      const mockSync = {
        id: 1,
        userId,
        status: SyncStatus.PENDING,
        stage: null,
        totalActivities: 0,
        processedActivities: 0,
        startedAt: new Date(),
      };
      const mockExistingActivities = [{ type: 'RUN' }];
      const mockRecentActivities = [
        {
          id: 456,
          name: 'New Run',
          type: 'Run',
          distance: 3000,
          moving_time: 1200,
          elapsed_time: 1300,
          total_elevation_gain: 30,
          start_date: '2025-01-10T08:00:00Z',
          start_date_local: '2025-01-10T09:00:00Z',
          timezone: 'Europe/Paris',
          has_kudoed: false,
          kudos_count: 0,
        },
      ];
      const mockLatestActivity = {
        startDate: new Date('2025-01-09T08:00:00Z'),
      };

      mockPrismaService.userPreferences.findUnique.mockResolvedValue(mockPreferences);
      mockPrismaService.activity.findMany.mockResolvedValue(mockExistingActivities);
      mockPrismaService.activity.findFirst.mockResolvedValue(mockLatestActivity);
      mockSyncHistoryService.create.mockResolvedValue(mockSync);
      mockSyncHistoryService.update.mockResolvedValue(mockSync);
      mockSyncHistoryService.findById.mockResolvedValue({ ...mockSync, status: SyncStatus.COMPLETED });
      mockStravaService.getActivities.mockResolvedValueOnce(mockRecentActivities).mockResolvedValueOnce([]);
      mockPrismaService.activity.upsert.mockResolvedValue({});

      const result = await service.syncActivities(userId);

      expect(prismaService.userPreferences.findUnique).toHaveBeenCalledWith({ where: { userId } });
      expect(stravaService.getActivities).toHaveBeenCalled();
      expect(result.status).toBe(SyncStatus.COMPLETED);
    });

    it('should perform historical + incremental sync when new sports are selected', async () => {
      const userId = 1;
      const mockPreferences = {
        id: 1,
        userId,
        selectedSports: [SportType.RUN, SportType.RIDE],
        onboardingCompleted: true,
        locale: 'en',
        theme: 'system',
      };
      const mockSync = {
        id: 1,
        userId,
        status: SyncStatus.PENDING,
        stage: null,
        totalActivities: 0,
        processedActivities: 0,
        startedAt: new Date(),
      };
      const mockExistingActivities = [{ type: 'RUN' }];
      const mockHistoricalRides = [
        {
          id: 789,
          name: 'Old Ride',
          type: 'Ride',
          distance: 20000,
          moving_time: 3600,
          elapsed_time: 3700,
          total_elevation_gain: 200,
          start_date: '2024-12-01T08:00:00Z',
          start_date_local: '2024-12-01T09:00:00Z',
          timezone: 'Europe/Paris',
          has_kudoed: false,
          kudos_count: 0,
        },
      ];
      const mockRecentActivities = [
        {
          id: 456,
          name: 'New Run',
          type: 'Run',
          distance: 3000,
          moving_time: 1200,
          elapsed_time: 1300,
          total_elevation_gain: 30,
          start_date: '2025-01-10T08:00:00Z',
          start_date_local: '2025-01-10T09:00:00Z',
          timezone: 'Europe/Paris',
          has_kudoed: false,
          kudos_count: 0,
        },
      ];

      mockPrismaService.userPreferences.findUnique.mockResolvedValue(mockPreferences);
      mockPrismaService.activity.findMany.mockResolvedValue(mockExistingActivities);
      mockPrismaService.activity.findFirst.mockResolvedValue({ startDate: new Date('2025-01-09') });
      mockSyncHistoryService.create.mockResolvedValue(mockSync);
      mockSyncHistoryService.update.mockResolvedValue(mockSync);
      mockSyncHistoryService.findById.mockResolvedValue({ ...mockSync, status: SyncStatus.COMPLETED });
      mockStravaService.getActivities
        .mockResolvedValueOnce(mockHistoricalRides)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce(mockRecentActivities)
        .mockResolvedValueOnce([]);
      mockPrismaService.activity.upsert.mockResolvedValue({});

      const result = await service.syncActivities(userId);

      expect(stravaService.getActivities).toHaveBeenCalledTimes(4);
      expect(result.status).toBe(SyncStatus.COMPLETED);
    });

    it('should filter activities by selected sports when storing', async () => {
      const userId = 1;
      const mockPreferences = {
        id: 1,
        userId,
        selectedSports: [SportType.RUN],
        onboardingCompleted: true,
        locale: 'en',
        theme: 'system',
      };
      const mockSync = {
        id: 1,
        userId,
        status: SyncStatus.PENDING,
        stage: null,
        totalActivities: 0,
        processedActivities: 0,
        startedAt: new Date(),
      };
      const mockExistingActivities = [{ type: 'RUN' }];
      const mockRecentActivities = [
        {
          id: 456,
          name: 'New Run',
          type: 'Run',
          distance: 3000,
          moving_time: 1200,
          elapsed_time: 1300,
          total_elevation_gain: 30,
          start_date: '2025-01-10T08:00:00Z',
          start_date_local: '2025-01-10T09:00:00Z',
          timezone: 'Europe/Paris',
          has_kudoed: false,
          kudos_count: 0,
        },
        {
          id: 789,
          name: 'Ride (should be filtered)',
          type: 'Ride',
          distance: 20000,
          moving_time: 3600,
          elapsed_time: 3700,
          total_elevation_gain: 200,
          start_date: '2025-01-10T10:00:00Z',
          start_date_local: '2025-01-10T11:00:00Z',
          timezone: 'Europe/Paris',
          has_kudoed: false,
          kudos_count: 0,
        },
      ];

      mockPrismaService.userPreferences.findUnique.mockResolvedValue(mockPreferences);
      mockPrismaService.activity.findMany.mockResolvedValue(mockExistingActivities);
      mockPrismaService.activity.findFirst.mockResolvedValue({ startDate: new Date('2025-01-09') });
      mockSyncHistoryService.create.mockResolvedValue(mockSync);
      mockSyncHistoryService.update.mockResolvedValue(mockSync);
      mockSyncHistoryService.findById.mockResolvedValue({ ...mockSync, status: SyncStatus.COMPLETED });
      mockStravaService.getActivities.mockResolvedValueOnce(mockRecentActivities).mockResolvedValueOnce([]);
      mockPrismaService.activity.upsert.mockResolvedValue({});

      await service.syncActivities(userId);

      expect(prismaService.activity.upsert).toHaveBeenCalledTimes(1);
      expect(prismaService.activity.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { stravaId: BigInt(456) },
          create: expect.objectContaining({ type: 'RUN' }),
        }),
      );
    });

    it('should mark sync as FAILED on error', async () => {
      const userId = 1;
      const mockPreferences = {
        id: 1,
        userId,
        selectedSports: [SportType.RUN],
        onboardingCompleted: true,
        locale: 'en',
        theme: 'system',
      };
      const mockSync = {
        id: 1,
        userId,
        status: SyncStatus.PENDING,
        stage: null,
        totalActivities: 0,
        processedActivities: 0,
        startedAt: new Date(),
      };

      mockPrismaService.userPreferences.findUnique.mockResolvedValue(mockPreferences);
      mockPrismaService.activity.findMany.mockResolvedValue([]);
      mockSyncHistoryService.create.mockResolvedValue(mockSync);
      mockSyncHistoryService.update.mockResolvedValue(mockSync);
      mockStravaService.getActivities.mockRejectedValue(new Error('Strava API error'));

      await expect(service.syncActivities(userId)).rejects.toThrow(BadRequestException);
      expect(syncHistoryService.update).toHaveBeenCalledWith(mockSync.id, {
        status: SyncStatus.FAILED,
        errorMessage: 'Strava API error',
        completedAt: expect.any(Date),
      });
    });
  });

  describe('findAll', () => {
    it('should return activities with pagination', async () => {
      const userId = 1;
      const mockActivities = [
        {
          id: 1,
          stravaId: BigInt(123),
          userId,
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
          averageHeartrate: null,
          maxHeartrate: null,
          kilojoules: null,
          deviceWatts: null,
          hasKudoed: false,
          kudosCount: 0,
          averageCadence: null,
          raw: {},
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrismaService.activity.findMany.mockResolvedValue(mockActivities);

      const result = await service.findAll(userId, { offset: 0, limit: 10 });

      expect(prismaService.activity.findMany).toHaveBeenCalledWith({
        where: { userId },
        orderBy: { startDate: 'desc' },
        skip: 0,
        take: 10,
      });
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Morning Run');
    });

    it('should filter activities by type', async () => {
      const userId = 1;
      const type = ActivityType.RUN;

      mockPrismaService.activity.findMany.mockResolvedValue([]);

      await service.findAll(userId, { type });

      expect(prismaService.activity.findMany).toHaveBeenCalledWith({
        where: { userId, type },
        orderBy: { startDate: 'desc' },
        skip: 0,
        take: 30,
      });
    });

    it('should filter activities by date range', async () => {
      const userId = 1;
      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-01-31');

      mockPrismaService.activity.findMany.mockResolvedValue([]);

      await service.findAll(userId, { startDate, endDate });

      expect(prismaService.activity.findMany).toHaveBeenCalledWith({
        where: {
          userId,
          startDate: { gte: startDate, lte: endDate },
        },
        orderBy: { startDate: 'desc' },
        skip: 0,
        take: 30,
      });
    });

    it('should filter activities by start date only', async () => {
      const userId = 1;
      const startDate = new Date('2025-01-01');

      mockPrismaService.activity.findMany.mockResolvedValue([]);

      await service.findAll(userId, { startDate });

      expect(prismaService.activity.findMany).toHaveBeenCalledWith({
        where: {
          userId,
          startDate: { gte: startDate },
        },
        orderBy: { startDate: 'desc' },
        skip: 0,
        take: 30,
      });
    });

    it('should filter activities by end date only', async () => {
      const userId = 1;
      const endDate = new Date('2025-01-31');

      mockPrismaService.activity.findMany.mockResolvedValue([]);

      await service.findAll(userId, { endDate });

      expect(prismaService.activity.findMany).toHaveBeenCalledWith({
        where: {
          userId,
          startDate: { lte: endDate },
        },
        orderBy: { startDate: 'desc' },
        skip: 0,
        take: 30,
      });
    });

    it('should throw BadRequestException when startDate is after endDate', async () => {
      const userId = 1;
      const startDate = new Date('2025-01-31');
      const endDate = new Date('2025-01-01');

      await expect(service.findAll(userId, { startDate, endDate })).rejects.toThrow(BadRequestException);
      await expect(service.findAll(userId, { startDate, endDate })).rejects.toThrow(
        'startDate must be before or equal to endDate',
      );
    });

    it('should accept same date for startDate and endDate', async () => {
      const userId = 1;
      const sameDate = new Date('2025-01-15');

      mockPrismaService.activity.findMany.mockResolvedValue([]);

      await service.findAll(userId, { startDate: sameDate, endDate: sameDate });

      expect(prismaService.activity.findMany).toHaveBeenCalledWith({
        where: {
          userId,
          startDate: { gte: sameDate, lte: sameDate },
        },
        orderBy: { startDate: 'desc' },
        skip: 0,
        take: 30,
      });
    });

    it('should sort activities by distance descending', async () => {
      const userId = 1;

      mockPrismaService.activity.findMany.mockResolvedValue([]);

      await service.findAll(userId, {
        orderBy: OrderBy.DISTANCE,
        orderDirection: OrderDirection.DESC,
      });

      expect(prismaService.activity.findMany).toHaveBeenCalledWith({
        where: { userId },
        orderBy: { distance: 'desc' },
        skip: 0,
        take: 30,
      });
    });

    it('should sort activities by duration ascending', async () => {
      const userId = 1;

      mockPrismaService.activity.findMany.mockResolvedValue([]);

      await service.findAll(userId, {
        orderBy: OrderBy.DURATION,
        orderDirection: OrderDirection.ASC,
      });

      expect(prismaService.activity.findMany).toHaveBeenCalledWith({
        where: { userId },
        orderBy: { movingTime: 'asc' },
        skip: 0,
        take: 30,
      });
    });

    it('should apply combined filters with sorting', async () => {
      const userId = 1;
      const type = ActivityType.RUN;
      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-01-31');

      mockPrismaService.activity.findMany.mockResolvedValue([]);

      await service.findAll(userId, {
        type,
        startDate,
        endDate,
        orderBy: OrderBy.DISTANCE,
        orderDirection: OrderDirection.ASC,
        offset: 10,
        limit: 20,
      });

      expect(prismaService.activity.findMany).toHaveBeenCalledWith({
        where: {
          userId,
          type,
          startDate: { gte: startDate, lte: endDate },
        },
        orderBy: { distance: 'asc' },
        skip: 10,
        take: 20,
      });
    });

    it('should use default sorting when not specified', async () => {
      const userId = 1;

      mockPrismaService.activity.findMany.mockResolvedValue([]);

      await service.findAll(userId, {});

      expect(prismaService.activity.findMany).toHaveBeenCalledWith({
        where: { userId },
        orderBy: { startDate: 'desc' },
        skip: 0,
        take: 30,
      });
    });
  });

  describe('findByStravaId', () => {
    it('should return activity by stravaId for user', async () => {
      const stravaId = BigInt(123);
      const userId = 1;
      const mockActivity = {
        id: 1,
        stravaId,
        userId,
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
        averageHeartrate: null,
        maxHeartrate: null,
        kilojoules: null,
        deviceWatts: null,
        hasKudoed: false,
        kudosCount: 0,
        averageCadence: null,
        raw: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.activity.findFirst.mockResolvedValue(mockActivity);

      const result = await service.findByStravaId(stravaId, userId);

      expect(prismaService.activity.findFirst).toHaveBeenCalledWith({
        where: { stravaId, userId },
      });
      expect(result?.name).toBe('Morning Run');
    });

    it('should return null if activity not found', async () => {
      const stravaId = BigInt(999);
      const userId = 1;

      mockPrismaService.activity.findFirst.mockResolvedValue(null);

      const result = await service.findByStravaId(stravaId, userId);

      expect(result).toBeNull();
    });
  });

  describe('fetchActivityDetails', () => {
    it('should fetch and store activity details from Strava', async () => {
      const userId = 1;
      const stravaId = BigInt(123456);
      const mockExistingActivity = {
        id: 1,
        stravaId,
        userId,
        name: 'Morning Run',
        type: 'Run',
        distance: 5000,
        movingTime: 1800,
        elapsedTime: 1900,
        totalElevationGain: 50,
        startDate: new Date(),
        startDateLocal: new Date(),
        timezone: 'Europe/Paris',
        detailsFetched: false,
        detailsFetchedAt: null,
        calories: null,
        splits: null,
        description: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const mockStravaDetail = {
        id: Number(stravaId),
        name: 'Morning Run',
        type: 'Run',
        distance: 5000,
        moving_time: 1800,
        elapsed_time: 1900,
        total_elevation_gain: 50,
        start_date: '2025-01-01T08:00:00Z',
        start_date_local: '2025-01-01T09:00:00Z',
        timezone: 'Europe/Paris',
        calories: 350,
        description: 'Great morning run',
        splits_metric: [
          {
            distance: 1000,
            elapsed_time: 360,
            moving_time: 360,
            split: 1,
            average_speed: 2.78,
          },
        ],
      };
      const mockUpdatedActivity = {
        ...mockExistingActivity,
        calories: 350,
        description: 'Great morning run',
        splits: mockStravaDetail.splits_metric,
        detailsFetched: true,
        detailsFetchedAt: new Date(),
      };

      mockPrismaService.activity.findFirst.mockResolvedValue(mockExistingActivity);
      mockStravaService.getActivityDetail.mockResolvedValue(mockStravaDetail);
      mockPrismaService.activity.update.mockResolvedValue(mockUpdatedActivity);

      const result = await service.fetchActivityDetails(userId, stravaId);

      expect(prismaService.activity.findFirst).toHaveBeenCalledWith({
        where: { stravaId, userId },
      });
      expect(stravaService.getActivityDetail).toHaveBeenCalledWith(userId, Number(stravaId));
      expect(prismaService.activity.update).toHaveBeenCalledWith({
        where: { id: mockExistingActivity.id },
        data: {
          calories: mockStravaDetail.calories,
          splits: mockStravaDetail.splits_metric,
          description: mockStravaDetail.description,
          detailsFetched: true,
          detailsFetchedAt: expect.any(Date),
        },
      });
      expect(result.calories).toBe(350);
      expect(result.description).toBe('Great morning run');
    });

    it('should return cached details if already fetched', async () => {
      const userId = 1;
      const stravaId = BigInt(123456);
      const mockExistingActivity = {
        id: 1,
        stravaId,
        userId,
        name: 'Morning Run',
        type: 'Run',
        distance: 5000,
        movingTime: 1800,
        elapsedTime: 1900,
        totalElevationGain: 50,
        startDate: new Date(),
        startDateLocal: new Date(),
        timezone: 'Europe/Paris',
        detailsFetched: true,
        detailsFetchedAt: new Date(),
        calories: 350,
        description: 'Great morning run',
        splits: [{ distance: 1000, elapsed_time: 360 }],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.activity.findFirst.mockResolvedValue(mockExistingActivity);

      const result = await service.fetchActivityDetails(userId, stravaId);

      expect(prismaService.activity.findFirst).toHaveBeenCalledWith({
        where: { stravaId, userId },
      });
      expect(stravaService.getActivityDetail).not.toHaveBeenCalled();
      expect(prismaService.activity.update).not.toHaveBeenCalled();
      expect(result.calories).toBe(350);
    });

    it('should throw BadRequestException if activity not found', async () => {
      const userId = 1;
      const stravaId = BigInt(999999);

      mockPrismaService.activity.findFirst.mockResolvedValue(null);

      await expect(service.fetchActivityDetails(userId, stravaId)).rejects.toThrow(BadRequestException);
      await expect(service.fetchActivityDetails(userId, stravaId)).rejects.toThrow(
        `Activity with stravaId ${stravaId} not found`,
      );
    });

    it('should handle Strava API errors', async () => {
      const userId = 1;
      const stravaId = BigInt(123456);
      const mockExistingActivity = {
        id: 1,
        stravaId,
        userId,
        detailsFetched: false,
      };

      mockPrismaService.activity.findFirst.mockResolvedValue(mockExistingActivity);
      mockStravaService.getActivityDetail.mockRejectedValue(new Error('Strava API error'));

      await expect(service.fetchActivityDetails(userId, stravaId)).rejects.toThrow('Strava API error');
      expect(prismaService.activity.update).not.toHaveBeenCalled();
    });
  });

  describe('syncActivities - Pagination Edge Cases', () => {
    it('should throw ActivitySyncLimitExceededException when historical sync exceeds MAX_PAGES', async () => {
      const userId = 1;
      const mockPreferences = {
        id: 1,
        userId,
        selectedSports: [SportType.RUN],
        onboardingCompleted: true,
        locale: 'en',
        theme: 'system',
      };
      const mockSync = {
        id: 1,
        userId,
        status: SyncStatus.IN_PROGRESS,
        stage: SyncStage.FETCHING,
        startedAt: new Date(),
      };

      mockPrismaService.userPreferences.findUnique.mockResolvedValue(mockPreferences);
      mockSyncHistoryService.create.mockResolvedValue(mockSync);
      mockPrismaService.activity.findFirst.mockResolvedValue(null);

      const mockActivities = Array.from({ length: 100 }, (_, i) => ({
        id: i + 1,
        type: 'Run',
        name: `Run ${i + 1}`,
        distance: 5000,
        moving_time: 1800,
        elapsed_time: 1900,
        total_elevation_gain: 50,
        start_date: new Date().toISOString(),
        start_date_local: new Date().toISOString(),
        timezone: 'Europe/Paris',
      }));

      mockStravaService.getActivities.mockResolvedValue(mockActivities);

      await expect(service.syncActivities(userId)).rejects.toThrow('Activity sync limit exceeded for user 1');
      await expect(service.syncActivities(userId)).rejects.toThrow('during historical sync');
    });

    it('should throw ActivitySyncLimitExceededException when recent sync exceeds MAX_PAGES', async () => {
      const userId = 1;
      const mockPreferences = {
        id: 1,
        userId,
        selectedSports: [SportType.RUN],
        onboardingCompleted: true,
        locale: 'en',
        theme: 'system',
      };
      const mockSync = {
        id: 1,
        userId,
        status: SyncStatus.IN_PROGRESS,
        stage: SyncStage.FETCHING,
        startedAt: new Date(),
      };
      const mockLastActivity = {
        id: 1,
        stravaId: BigInt(100),
        userId,
        startDate: new Date('2024-01-01'),
      };
      const existingActivities = [{ type: 'RUN' }];

      mockPrismaService.userPreferences.findUnique.mockResolvedValue(mockPreferences);
      mockSyncHistoryService.create.mockResolvedValue(mockSync);
      mockPrismaService.activity.findFirst.mockResolvedValue(mockLastActivity);
      mockPrismaService.activity.findMany.mockResolvedValue(existingActivities as any);

      const mockActivities = Array.from({ length: 100 }, (_, i) => ({
        id: i + 1000,
        type: 'Run',
        name: `Run ${i + 1000}`,
        distance: 5000,
        moving_time: 1800,
        elapsed_time: 1900,
        total_elevation_gain: 50,
        start_date: new Date().toISOString(),
        start_date_local: new Date().toISOString(),
        timezone: 'Europe/Paris',
      }));

      mockStravaService.getActivities.mockResolvedValue(mockActivities);

      await expect(service.syncActivities(userId)).rejects.toThrow('Activity sync limit exceeded for user 1');
      await expect(service.syncActivities(userId)).rejects.toThrow('during recent sync');
    });

    it('should handle just under MAX_PAGES limit without error', async () => {
      const userId = 1;
      const mockPreferences = {
        id: 1,
        userId,
        selectedSports: [SportType.RUN],
        onboardingCompleted: true,
        locale: 'en',
        theme: 'system',
      };
      const mockSync = {
        id: 1,
        userId,
        status: SyncStatus.IN_PROGRESS,
        stage: SyncStage.FETCHING,
        startedAt: new Date(),
      };

      mockPrismaService.userPreferences.findUnique.mockResolvedValue(mockPreferences);
      mockSyncHistoryService.create.mockResolvedValue(mockSync);
      mockPrismaService.activity.findFirst.mockResolvedValue(null);
      mockPrismaService.activity.findMany.mockResolvedValue([]);
      mockPrismaService.activity.upsert.mockResolvedValue({} as any);
      mockSyncHistoryService.update.mockResolvedValue({} as any);
      mockSyncHistoryService.findById.mockResolvedValue({} as any);

      let callCount = 0;
      mockStravaService.getActivities.mockImplementation(() => {
        callCount++;
        if (callCount <= 19) {
          return Promise.resolve(
            Array.from({ length: 100 }, (_, i) => ({
              id: (callCount - 1) * 100 + i + 1,
              type: 'Run',
              name: `Run ${i + 1}`,
              distance: 5000,
              moving_time: 1800,
              elapsed_time: 1900,
              total_elevation_gain: 50,
              start_date: new Date().toISOString(),
              start_date_local: new Date().toISOString(),
              timezone: 'Europe/Paris',
            })),
          );
        }
        return Promise.resolve([]);
      });

      await expect(service.syncActivities(userId)).resolves.not.toThrow();
    });

    it('should correctly detect last page when receiving exactly per_page activities', async () => {
      const userId = 1;
      const mockPreferences = {
        id: 1,
        userId,
        selectedSports: [SportType.RUN],
        onboardingCompleted: true,
        locale: 'en',
        theme: 'system',
      };
      const mockSync = {
        id: 1,
        userId,
        status: SyncStatus.IN_PROGRESS,
        stage: SyncStage.FETCHING,
        startedAt: new Date(),
      };
      const existingActivities = [{ type: 'RUN' }];

      mockPrismaService.userPreferences.findUnique.mockResolvedValue(mockPreferences);
      mockSyncHistoryService.create.mockResolvedValue(mockSync);
      mockPrismaService.activity.findFirst.mockResolvedValue(null);
      mockPrismaService.activity.findMany.mockResolvedValue(existingActivities as any);
      mockPrismaService.activity.upsert.mockResolvedValue({} as any);
      mockSyncHistoryService.update.mockResolvedValue({} as any);
      mockSyncHistoryService.findById.mockResolvedValue({} as any);

      let callCount = 0;
      mockStravaService.getActivities.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve(
            Array.from({ length: 100 }, (_, i) => ({
              id: i + 1,
              type: 'Run',
              name: `Run ${i + 1}`,
              distance: 5000,
              moving_time: 1800,
              elapsed_time: 1900,
              total_elevation_gain: 50,
              start_date: new Date().toISOString(),
              start_date_local: new Date().toISOString(),
              timezone: 'Europe/Paris',
            })),
          );
        }
        return Promise.resolve([]);
      });

      await service.syncActivities(userId);

      expect(stravaService.getActivities).toHaveBeenCalledTimes(2);
    });

    it('should update progress at 10-activity intervals during storage', async () => {
      const userId = 1;
      const mockPreferences = {
        id: 1,
        userId,
        selectedSports: [SportType.RUN],
        onboardingCompleted: true,
        locale: 'en',
        theme: 'system',
      };
      const mockSync = {
        id: 1,
        userId,
        status: SyncStatus.IN_PROGRESS,
        stage: SyncStage.FETCHING,
        startedAt: new Date(),
      };

      mockPrismaService.userPreferences.findUnique.mockResolvedValue(mockPreferences);
      mockSyncHistoryService.create.mockResolvedValue(mockSync);
      mockPrismaService.activity.findFirst.mockResolvedValue(null);
      mockPrismaService.activity.upsert.mockResolvedValue({} as any);
      mockSyncHistoryService.update.mockResolvedValue({} as any);

      const mockActivities = Array.from({ length: 25 }, (_, i) => ({
        id: i + 1,
        type: 'Run',
        name: `Run ${i + 1}`,
        distance: 5000,
        moving_time: 1800,
        elapsed_time: 1900,
        total_elevation_gain: 50,
        start_date: new Date().toISOString(),
        start_date_local: new Date().toISOString(),
        timezone: 'Europe/Paris',
      }));

      mockStravaService.getActivities.mockResolvedValueOnce(mockActivities).mockResolvedValueOnce([]);

      await service.syncActivities(userId);

      const progressUpdateCalls = mockSyncHistoryService.update.mock.calls.filter(
        call => call[1].processedActivities !== undefined,
      );

      expect(progressUpdateCalls.length).toBeGreaterThanOrEqual(3);
      expect(progressUpdateCalls.some(call => call[1].processedActivities === 10)).toBe(true);
      expect(progressUpdateCalls.some(call => call[1].processedActivities === 20)).toBe(true);
      expect(progressUpdateCalls.some(call => call[1].processedActivities === 25)).toBe(true);
    });

    it('should update progress for last activity even if not multiple of 10', async () => {
      const userId = 1;
      const mockPreferences = {
        id: 1,
        userId,
        selectedSports: [SportType.RUN],
        onboardingCompleted: true,
        locale: 'en',
        theme: 'system',
      };
      const mockSync = {
        id: 1,
        userId,
        status: SyncStatus.IN_PROGRESS,
        stage: SyncStage.FETCHING,
        startedAt: new Date(),
      };

      mockPrismaService.userPreferences.findUnique.mockResolvedValue(mockPreferences);
      mockSyncHistoryService.create.mockResolvedValue(mockSync);
      mockPrismaService.activity.findFirst.mockResolvedValue(null);
      mockPrismaService.activity.upsert.mockResolvedValue({} as any);
      mockSyncHistoryService.update.mockResolvedValue({} as any);

      const mockActivities = Array.from({ length: 7 }, (_, i) => ({
        id: i + 1,
        type: 'Run',
        name: `Run ${i + 1}`,
        distance: 5000,
        moving_time: 1800,
        elapsed_time: 1900,
        total_elevation_gain: 50,
        start_date: new Date().toISOString(),
        start_date_local: new Date().toISOString(),
        timezone: 'Europe/Paris',
      }));

      mockStravaService.getActivities.mockResolvedValueOnce(mockActivities).mockResolvedValueOnce([]);

      await service.syncActivities(userId);

      const progressUpdateCalls = mockSyncHistoryService.update.mock.calls.filter(
        call => call[1].processedActivities !== undefined,
      );

      expect(progressUpdateCalls.some(call => call[1].processedActivities === 7)).toBe(true);
    });
  });

  describe('syncActivities - Sport Selection Edge Cases', () => {
    it('should sync only newly selected sports when user adds sport after initial sync', async () => {
      const userId = 1;
      const mockPreferences = {
        id: 1,
        userId,
        selectedSports: [SportType.RUN, SportType.RIDE],
        onboardingCompleted: true,
        locale: 'en',
        theme: 'system',
      };
      const mockSync = {
        id: 1,
        userId,
        status: SyncStatus.IN_PROGRESS,
        stage: SyncStage.FETCHING,
        startedAt: new Date(),
      };
      const mockLastRunActivity = {
        id: 1,
        stravaId: BigInt(100),
        userId,
        type: 'Run',
        startDate: new Date('2024-01-01'),
      };
      const existingRunActivities = [{ type: 'RUN' }];

      mockPrismaService.userPreferences.findUnique.mockResolvedValue(mockPreferences);
      mockSyncHistoryService.create.mockResolvedValue(mockSync);
      mockPrismaService.activity.findFirst.mockResolvedValue(mockLastRunActivity);
      mockPrismaService.activity.findMany.mockResolvedValue(existingRunActivities as any);
      mockPrismaService.activity.upsert.mockResolvedValue({} as any);
      mockSyncHistoryService.update.mockResolvedValue({} as any);
      mockSyncHistoryService.findById.mockResolvedValue({} as any);

      const mockHistoricalRides = Array.from({ length: 10 }, (_, i) => ({
        id: 200 + i,
        type: 'Ride',
        name: `Historical Ride ${i + 1}`,
        distance: 20000,
        moving_time: 3600,
        elapsed_time: 3700,
        total_elevation_gain: 200,
        start_date: new Date('2023-12-01').toISOString(),
        start_date_local: new Date('2023-12-01').toISOString(),
        timezone: 'Europe/Paris',
      }));

      mockStravaService.getActivities
        .mockResolvedValueOnce(mockHistoricalRides)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      await service.syncActivities(userId);

      expect(stravaService.getActivities).toHaveBeenCalledWith(
        userId,
        expect.objectContaining({ page: 1, per_page: 100 }),
      );
    });

    it('should not re-fetch historical activities for already synced sports', async () => {
      const userId = 1;
      const mockPreferences = {
        id: 1,
        userId,
        selectedSports: [SportType.RUN],
        onboardingCompleted: true,
        locale: 'en',
        theme: 'system',
      };
      const mockSync = {
        id: 1,
        userId,
        status: SyncStatus.IN_PROGRESS,
        stage: SyncStage.FETCHING,
        startedAt: new Date(),
      };
      const mockLastRunActivity = {
        id: 1,
        stravaId: BigInt(100),
        userId,
        type: 'Run',
        startDate: new Date('2024-01-01'),
      };
      const existingRunActivities = [{ type: 'RUN' }];

      mockPrismaService.userPreferences.findUnique.mockResolvedValue(mockPreferences);
      mockSyncHistoryService.create.mockResolvedValue(mockSync);
      mockPrismaService.activity.findFirst.mockResolvedValue(mockLastRunActivity);
      mockPrismaService.activity.findMany.mockResolvedValue(existingRunActivities as any);
      mockPrismaService.activity.upsert.mockResolvedValue({} as any);
      mockSyncHistoryService.update.mockResolvedValue({} as any);
      mockSyncHistoryService.findById.mockResolvedValue({} as any);

      mockStravaService.getActivities.mockResolvedValueOnce([]).mockResolvedValueOnce([]);

      await service.syncActivities(userId);

      expect(stravaService.getActivities).toHaveBeenCalledTimes(1);
      expect(stravaService.getActivities).toHaveBeenCalledWith(
        userId,
        expect.objectContaining({ after: expect.any(Number) }),
      );
    });
  });

  describe('deleteByStravaId', () => {
    it('should return true when activity is deleted', async () => {
      const stravaId = BigInt(123);
      const userId = 1;

      mockPrismaService.activity.deleteMany.mockResolvedValue({ count: 1 });

      const result = await service.deleteByStravaId(stravaId, userId);

      expect(result).toBe(true);
    });

    it('should return false when activity not found', async () => {
      const stravaId = BigInt(999);
      const userId = 1;

      mockPrismaService.activity.deleteMany.mockResolvedValue({ count: 0 });

      const result = await service.deleteByStravaId(stravaId, userId);

      expect(result).toBe(false);
    });

    it('should filter by both stravaId and userId', async () => {
      const stravaId = BigInt(555);
      const userId = 7;

      mockPrismaService.activity.deleteMany.mockResolvedValue({ count: 1 });

      await service.deleteByStravaId(stravaId, userId);

      expect(prismaService.activity.deleteMany).toHaveBeenCalledWith({
        where: { stravaId, userId },
      });
    });
  });

  describe('findAll - Edge Cases', () => {
    it('should handle empty result set with filters applied', async () => {
      const userId = 1;
      const options = {
        offset: 0,
        limit: 30,
        type: ActivityType.RUN,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
      };

      mockPrismaService.activity.findMany.mockResolvedValue([]);

      const result = await service.findAll(userId, options);

      expect(result).toEqual([]);
      expect(prismaService.activity.findMany).toHaveBeenCalledWith({
        where: {
          userId,
          type: ActivityType.RUN,
          startDate: {
            gte: new Date('2024-01-01'),
            lte: new Date('2024-12-31'),
          },
        },
        orderBy: { startDate: 'desc' },
        skip: 0,
        take: 30,
      });
    });

    it('should pass through very large offset values to Prisma', async () => {
      const userId = 1;
      const options = {
        offset: 999999,
        limit: 30,
      };

      mockPrismaService.activity.findMany.mockResolvedValue([]);

      const result = await service.findAll(userId, options);

      expect(result).toEqual([]);
      expect(prismaService.activity.findMany).toHaveBeenCalledWith({
        where: { userId },
        orderBy: { startDate: 'desc' },
        skip: 999999,
        take: 30,
      });
    });

    it('should pass through negative offset to Prisma', async () => {
      const userId = 1;
      const options = {
        offset: -10,
        limit: 30,
      };

      mockPrismaService.activity.findMany.mockResolvedValue([]);

      const result = await service.findAll(userId, options);

      expect(result).toEqual([]);
      expect(prismaService.activity.findMany).toHaveBeenCalledWith({
        where: { userId },
        orderBy: { startDate: 'desc' },
        skip: -10,
        take: 30,
      });
    });

    it('should pass through large limit values to Prisma without capping', async () => {
      const userId = 1;
      const options = {
        offset: 0,
        limit: 200,
      };

      mockPrismaService.activity.findMany.mockResolvedValue([]);

      const result = await service.findAll(userId, options);

      expect(result).toEqual([]);
      expect(prismaService.activity.findMany).toHaveBeenCalledWith({
        where: { userId },
        orderBy: { startDate: 'desc' },
        skip: 0,
        take: 200,
      });
    });
  });
});
