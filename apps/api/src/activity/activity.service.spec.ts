import { Test, TestingModule } from '@nestjs/testing';
import { ActivityService } from './activity.service';
import { PrismaService } from '../database/prisma.service';
import { StravaService } from '../strava/strava.service';
import { SyncHistoryService } from '../sync-history/sync-history.service';
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

  const mockPrismaService = {
    userPreferences: {
      findUnique: jest.fn(),
    },
    activity: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      upsert: jest.fn(),
    },
  };

  const mockStravaService = {
    getActivities: jest.fn(),
  };

  const mockSyncHistoryService = {
    create: jest.fn(),
    update: jest.fn(),
    findById: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ActivityService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: StravaService, useValue: mockStravaService },
        { provide: SyncHistoryService, useValue: mockSyncHistoryService },
      ],
    }).compile();

    service = module.get<ActivityService>(ActivityService);
    prismaService = module.get<PrismaService>(PrismaService);
    stravaService = module.get<StravaService>(StravaService);
    syncHistoryService = module.get<SyncHistoryService>(SyncHistoryService);
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
      const mockExistingActivities = [{ type: 'Run' }];
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
      const mockExistingActivities = [{ type: 'Run' }];
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
      const mockExistingActivities = [{ type: 'Run' }];
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
          create: expect.objectContaining({ type: 'Run' }),
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

  describe('findById', () => {
    it('should return activity by id for user', async () => {
      const activityId = 1;
      const userId = 1;
      const mockActivity = {
        id: activityId,
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
      };

      mockPrismaService.activity.findFirst.mockResolvedValue(mockActivity);

      const result = await service.findById(activityId, userId);

      expect(prismaService.activity.findFirst).toHaveBeenCalledWith({
        where: { id: activityId, userId },
      });
      expect(result?.name).toBe('Morning Run');
    });

    it('should return null if activity not found', async () => {
      const activityId = 999;
      const userId = 1;

      mockPrismaService.activity.findFirst.mockResolvedValue(null);

      const result = await service.findById(activityId, userId);

      expect(result).toBeNull();
    });
  });
});
