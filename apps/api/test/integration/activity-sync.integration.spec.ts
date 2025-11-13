import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, BadRequestException } from '@nestjs/common';
import { AppModule } from '../../src/app.module';
import { ActivityService } from '../../src/activity/activity.service';
import { StravaService } from '../../src/strava/strava.service';
import { SyncHistoryService } from '../../src/sync-history/sync-history.service';
import { PrismaService } from '../../src/database/prisma.service';
import { getTestPrismaClient, seedTestUser, seedTestActivity } from '../test-db';
import { StravaActivitySummary } from '../../src/strava/types';
import { SyncStatus } from '../../src/sync-history/enums/sync-status.enum';
import { SyncStage } from '../../src/sync-history/enums/sync-stage.enum';
import { SportType } from '../../src/user-preferences/enums/sport-type.enum';

describe('Activity Sync Integration', () => {
  let app: INestApplication;
  let activityService: ActivityService;
  let stravaService: StravaService;
  let syncHistoryService: SyncHistoryService;
  let prisma: ReturnType<typeof getTestPrismaClient>;

  const createMockStravaActivity = (
    id: number,
    type: string = 'Run',
    overrides?: Partial<StravaActivitySummary>,
  ): StravaActivitySummary => {
    return {
      id,
      resource_state: 2,
      external_id: `external_${id}`,
      upload_id: id + 1000,
      athlete: {
        id: 123456,
        resource_state: 1,
      },
      name: `Activity ${id}`,
      distance: 5000,
      moving_time: 1800,
      elapsed_time: 1900,
      total_elevation_gain: 50,
      type,
      sport_type: type,
      workout_type: null,
      start_date: '2024-01-01T08:00:00Z',
      start_date_local: '2024-01-01T09:00:00+01:00',
      timezone: '(GMT+01:00) Europe/Paris',
      utc_offset: 3600,
      location_city: 'Test City',
      location_state: null,
      location_country: 'Test Country',
      achievement_count: 0,
      kudos_count: 5,
      comment_count: 2,
      athlete_count: 1,
      photo_count: 0,
      map: {
        id: `map_${id}`,
        summary_polyline: 'encoded_polyline',
        resource_state: 2,
      },
      trainer: false,
      commute: false,
      manual: false,
      private: false,
      visibility: 'everyone',
      flagged: false,
      gear_id: null,
      start_latlng: null,
      end_latlng: null,
      average_speed: 2.78,
      max_speed: 3.5,
      average_cadence: 85,
      average_heartrate: 145,
      max_heartrate: 165,
      has_heartrate: true,
      heartrate_opt_out: false,
      display_hide_heartrate_option: false,
      pr_count: 0,
      total_photo_count: 0,
      has_kudoed: false,
      kilojoules: 500,
      device_watts: false,
      ...overrides,
    };
  };

  const createPaginatedMock = (activities: StravaActivitySummary[]) => {
    return async (
      userId: number,
      options: { page?: number; per_page?: number; before?: number; after?: number } = {},
    ): Promise<StravaActivitySummary[]> => {
      const { page = 1, per_page = 100 } = options;
      const startIndex = (page - 1) * per_page;
      const endIndex = startIndex + per_page;
      return activities.slice(startIndex, endIndex);
    };
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    activityService = moduleFixture.get<ActivityService>(ActivityService);
    stravaService = moduleFixture.get<StravaService>(StravaService);
    syncHistoryService = moduleFixture.get<SyncHistoryService>(SyncHistoryService);
    prisma = getTestPrismaClient();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('syncActivities', () => {
    it('should import activities and create sync history', async () => {
      const { user } = await seedTestUser();

      await prisma.userPreferences.update({
        where: { userId: user.id },
        data: { selectedSports: [SportType.RUN] },
      });

      jest
        .spyOn(stravaService, 'getActivities')
        .mockImplementation(
          async (
            userId: number,
            options: { page?: number; per_page?: number; before?: number; after?: number } = {},
          ): Promise<StravaActivitySummary[]> => {
            const { page = 1 } = options;

            if (page === 1) return [createMockStravaActivity(1), createMockStravaActivity(2)];
            if (page === 2) return [createMockStravaActivity(3)];
            return [];
          },
        );

      const syncHistory = await activityService.syncActivities(user.id);

      expect(syncHistory).toBeDefined();
      expect(syncHistory.status).toBe(SyncStatus.COMPLETED);
      expect(syncHistory.stage).toBe(SyncStage.DONE);
      expect(syncHistory.totalActivities).toBe(6);
      expect(syncHistory.processedActivities).toBe(6);
      expect(syncHistory.completedAt).toBeInstanceOf(Date);

      const dbActivities = await prisma.activity.findMany({
        where: { userId: user.id },
      });

      expect(dbActivities).toHaveLength(3);
      expect(dbActivities[0].name).toBe('Activity 1');
      expect(dbActivities[0].type).toBe('Run');
      expect(dbActivities[0].distance).toBe(5000);
      expect(dbActivities[0].movingTime).toBe(1800);
    });

    it('should update sync history stages during import', async () => {
      const { user } = await seedTestUser();

      await prisma.userPreferences.update({
        where: { userId: user.id },
        data: { selectedSports: [SportType.RUN] },
      });

      await seedTestActivity(user.id, {
        stravaId: BigInt(2000),
        type: 'Run',
        startDate: new Date('2024-01-01T08:00:00Z'),
      });

      const mockActivities = [createMockStravaActivity(2001, 'Run')];

      jest.spyOn(stravaService, 'getActivities').mockImplementation(createPaginatedMock(mockActivities));

      const syncHistory = await activityService.syncActivities(user.id);

      const dbSyncHistory = await prisma.syncHistory.findUnique({
        where: { id: syncHistory.id },
      });

      expect(dbSyncHistory).toBeDefined();
      expect(dbSyncHistory?.status).toBe(SyncStatus.COMPLETED);
      expect(dbSyncHistory?.stage).toBe(SyncStage.DONE);
      expect(dbSyncHistory?.processedActivities).toBe(1);
    });

    it('should handle incremental sync', async () => {
      const { user } = await seedTestUser();

      await prisma.userPreferences.update({
        where: { userId: user.id },
        data: { selectedSports: [SportType.RUN] },
      });

      const existingActivity = await seedTestActivity(user.id, {
        stravaId: BigInt(3001),
        name: 'Existing Activity',
        startDate: new Date('2024-01-01T08:00:00Z'),
      });

      const newMockActivities = [
        createMockStravaActivity(3001, 'Run'),
        createMockStravaActivity(3002, 'Run', { start_date: '2024-01-02T08:00:00Z' }),
        createMockStravaActivity(3003, 'Run', { start_date: '2024-01-03T08:00:00Z' }),
      ];

      jest.spyOn(stravaService, 'getActivities').mockImplementation(async (userId, params = {}) => {
        const { page = 1, per_page = 100, after } = params;

        if (after) {
          const recentActivities = newMockActivities;
          return createPaginatedMock(recentActivities)(userId, { page, per_page });
        }

        return createPaginatedMock(newMockActivities)(userId, { page, per_page });
      });

      await activityService.syncActivities(user.id);

      const dbActivities = await prisma.activity.findMany({
        where: { userId: user.id },
        orderBy: { stravaId: 'asc' },
      });

      expect(dbActivities.length).toBeGreaterThanOrEqual(1);

      const existingActivityUpdated = dbActivities.find(a => a.id === existingActivity.id);
      expect(existingActivityUpdated).toBeDefined();
      expect(existingActivityUpdated?.name).toBe('Activity 3001');
    });

    it('should filter activities by sport type', async () => {
      const { user } = await seedTestUser();

      await prisma.userPreferences.update({
        where: { userId: user.id },
        data: { selectedSports: [SportType.RUN] },
      });

      const mockActivities = [
        createMockStravaActivity(4001, 'Run'),
        createMockStravaActivity(4002, 'Ride'),
        createMockStravaActivity(4003, 'Run'),
        createMockStravaActivity(4004, 'Swim'),
      ];

      jest.spyOn(stravaService, 'getActivities').mockImplementation(createPaginatedMock(mockActivities));

      await activityService.syncActivities(user.id);

      const dbActivities = await prisma.activity.findMany({
        where: { userId: user.id },
      });

      expect(dbActivities).toHaveLength(2);
      expect(dbActivities.every(a => a.type === 'Run')).toBe(true);
    });

    it('should handle sync failure and store error', async () => {
      const { user } = await seedTestUser();

      await prisma.userPreferences.update({
        where: { userId: user.id },
        data: { selectedSports: [SportType.RUN] },
      });

      jest.spyOn(stravaService, 'getActivities').mockRejectedValue(new Error('Strava API error'));

      await expect(activityService.syncActivities(user.id)).rejects.toThrow('Activity sync failed');

      const syncHistories = await prisma.syncHistory.findMany({
        where: { userId: user.id },
        orderBy: { startedAt: 'desc' },
      });

      expect(syncHistories).toHaveLength(1);
      expect(syncHistories[0].status).toBe(SyncStatus.FAILED);
      expect(syncHistories[0].errorMessage).toContain('Strava API error');
      expect(syncHistories[0].completedAt).toBeInstanceOf(Date);
    });

    it('should respect user-scoped activities', async () => {
      const { user: user1 } = await seedTestUser({ stravaId: 111111 });
      const { user: user2 } = await seedTestUser({ stravaId: 222222 });

      await prisma.userPreferences.update({
        where: { userId: user1.id },
        data: { selectedSports: [SportType.RUN] },
      });

      await prisma.userPreferences.update({
        where: { userId: user2.id },
        data: { selectedSports: [SportType.RUN] },
      });

      const user1Activities = [createMockStravaActivity(5001, 'Run'), createMockStravaActivity(5002, 'Run')];

      const user2Activities = [createMockStravaActivity(6001, 'Run'), createMockStravaActivity(6002, 'Run')];

      jest.spyOn(stravaService, 'getActivities').mockImplementation(async (userId, options = {}) => {
        const activities = userId === user1.id ? user1Activities : userId === user2.id ? user2Activities : [];
        return createPaginatedMock(activities)(userId, options);
      });

      await activityService.syncActivities(user1.id);
      await activityService.syncActivities(user2.id);

      const user1DbActivities = await prisma.activity.findMany({
        where: { userId: user1.id },
      });

      expect(user1DbActivities).toHaveLength(2);
      expect(user1DbActivities.every(a => a.userId === user1.id)).toBe(true);

      const user2DbActivities = await prisma.activity.findMany({
        where: { userId: user2.id },
      });

      expect(user2DbActivities).toHaveLength(2);
      expect(user2DbActivities.every(a => a.userId === user2.id)).toBe(true);

      const user1Activities2 = await activityService.findAll(user1.id);
      expect(user1Activities2).toHaveLength(2);
      expect(user1Activities2.every(a => a.id === user1.id || a.id === user1.id)).toBe(false);
    });

    it('should handle activities with optional fields', async () => {
      const { user } = await seedTestUser();

      await prisma.userPreferences.update({
        where: { userId: user.id },
        data: { selectedSports: [SportType.RUN] },
      });

      const minimalActivity = createMockStravaActivity(7001, 'Run', {
        average_heartrate: undefined,
        max_heartrate: undefined,
        average_cadence: undefined,
        kilojoules: undefined,
        device_watts: undefined,
      });

      jest.spyOn(stravaService, 'getActivities').mockImplementation(createPaginatedMock([minimalActivity]));

      await activityService.syncActivities(user.id);

      const dbActivities = await prisma.activity.findMany({
        where: { userId: user.id },
      });

      expect(dbActivities).toHaveLength(1);
      expect(dbActivities[0].averageHeartrate).toBeNull();
      expect(dbActivities[0].maxHeartrate).toBeNull();
      expect(dbActivities[0].averageCadence).toBeNull();
      expect(dbActivities[0].kilojoules).toBeNull();
      expect(dbActivities[0].deviceWatts).toBeNull();
    });

    it('should preserve BigInt stravaId', async () => {
      const { user } = await seedTestUser();

      await prisma.userPreferences.update({
        where: { userId: user.id },
        data: { selectedSports: [SportType.RUN] },
      });

      const largeId = 9007199254740992;
      const activityWithLargeId = createMockStravaActivity(largeId, 'Run');

      jest.spyOn(stravaService, 'getActivities').mockImplementation(createPaginatedMock([activityWithLargeId]));

      await activityService.syncActivities(user.id);

      const dbActivities = await prisma.activity.findMany({
        where: { userId: user.id },
      });

      expect(dbActivities).toHaveLength(1);
      expect(dbActivities[0].stravaId.toString()).toBe(largeId.toString());

      const activityById = await prisma.activity.findUnique({
        where: { stravaId: BigInt(largeId) },
      });

      expect(activityById).toBeDefined();
      expect(activityById?.id).toBe(dbActivities[0].id);
    });

    it('should throw error when user preferences not found', async () => {
      const { user } = await seedTestUser();

      await prisma.userPreferences.delete({
        where: { userId: user.id },
      });

      await expect(activityService.syncActivities(user.id)).rejects.toThrow(BadRequestException);
      await expect(activityService.syncActivities(user.id)).rejects.toThrow('User preferences not found');
    });

    it('should throw error when no sports selected', async () => {
      const { user } = await seedTestUser();

      await prisma.userPreferences.update({
        where: { userId: user.id },
        data: { selectedSports: [] },
      });

      await expect(activityService.syncActivities(user.id)).rejects.toThrow(BadRequestException);
      await expect(activityService.syncActivities(user.id)).rejects.toThrow('no sports selected');
    });

    it('should throw error when exceeding MAX_PAGES limit during historical sync', async () => {
      const { user } = await seedTestUser();

      await prisma.userPreferences.update({
        where: { userId: user.id },
        data: { selectedSports: [SportType.RUN] },
      });

      jest.spyOn(stravaService, 'getActivities').mockImplementation(async (userId, options = {}) => {
        const { page = 1, per_page = 100 } = options;
        const activities = Array.from({ length: per_page }, (_, i) => createMockStravaActivity(page * 1000 + i, 'Run'));
        return activities;
      });

      await expect(activityService.syncActivities(user.id)).rejects.toThrow(
        /Activity sync limit exceeded for user.*historical sync/,
      );

      const syncHistories = await prisma.syncHistory.findMany({
        where: { userId: user.id },
        orderBy: { startedAt: 'desc' },
      });

      expect(syncHistories).toHaveLength(1);
      expect(syncHistories[0].status).toBe(SyncStatus.FAILED);
      expect(syncHistories[0].errorMessage).toContain('Activity sync limit exceeded');
      expect(syncHistories[0].errorMessage).toContain('20 pages');
      expect(syncHistories[0].completedAt).toBeInstanceOf(Date);
    });
  });

  describe('findAll', () => {
    it('should return activities with pagination', async () => {
      const { user } = await seedTestUser();

      for (let i = 0; i < 5; i++) {
        await seedTestActivity(user.id, {
          stravaId: BigInt(8001 + i),
          name: `Activity ${i}`,
        });
      }

      const page1 = await activityService.findAll(user.id, { limit: 2, offset: 0 });
      expect(page1).toHaveLength(2);

      const page2 = await activityService.findAll(user.id, { limit: 2, offset: 2 });
      expect(page2).toHaveLength(2);

      const page3 = await activityService.findAll(user.id, { limit: 2, offset: 4 });
      expect(page3).toHaveLength(1);
    });

    it('should filter activities by type', async () => {
      const { user } = await seedTestUser();

      await seedTestActivity(user.id, { stravaId: BigInt(9001), type: 'Run' });
      await seedTestActivity(user.id, { stravaId: BigInt(9002), type: 'Ride' });
      await seedTestActivity(user.id, { stravaId: BigInt(9003), type: 'Run' });

      const runActivities = await activityService.findAll(user.id, { type: 'Run' });
      expect(runActivities).toHaveLength(2);
      expect(runActivities.every(a => a.type === 'Run')).toBe(true);

      const rideActivities = await activityService.findAll(user.id, { type: 'Ride' });
      expect(rideActivities).toHaveLength(1);
      expect(rideActivities[0].type).toBe('Ride');
    });

    it('should order activities by start date descending', async () => {
      const { user } = await seedTestUser();

      await seedTestActivity(user.id, {
        stravaId: BigInt(10001),
        startDate: new Date('2024-01-01T08:00:00Z'),
      });
      await seedTestActivity(user.id, {
        stravaId: BigInt(10002),
        startDate: new Date('2024-01-03T08:00:00Z'),
      });
      await seedTestActivity(user.id, {
        stravaId: BigInt(10003),
        startDate: new Date('2024-01-02T08:00:00Z'),
      });

      const activities = await activityService.findAll(user.id);

      expect(activities).toHaveLength(3);
      expect(new Date(activities[0].startDate).getTime()).toBeGreaterThan(new Date(activities[1].startDate).getTime());
      expect(new Date(activities[1].startDate).getTime()).toBeGreaterThan(new Date(activities[2].startDate).getTime());
    });
  });

  describe('findById', () => {
    it('should return activity by id for correct user', async () => {
      const { user } = await seedTestUser();

      const createdActivity = await seedTestActivity(user.id, {
        stravaId: BigInt(11001),
        name: 'Test Activity',
      });

      const activity = await activityService.findById(createdActivity.id, user.id);

      expect(activity).toBeDefined();
      expect(activity?.id).toBe(createdActivity.id);
      expect(activity?.name).toBe('Test Activity');
    });

    it('should return null for activity of different user', async () => {
      const { user: user1 } = await seedTestUser({ stravaId: 111111 });
      const { user: user2 } = await seedTestUser({ stravaId: 222222 });

      const user1Activity = await seedTestActivity(user1.id, {
        stravaId: BigInt(12001),
      });

      const activity = await activityService.findById(user1Activity.id, user2.id);

      expect(activity).toBeNull();
    });
  });
});
