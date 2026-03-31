import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, BadRequestException } from '@nestjs/common';
import { AppModule } from '../../src/app.module';
import { ActivityService } from '../../src/activity/activity.service';
import { StravaService } from '../../src/strava/strava.service';
import { PrismaService } from '../../src/database/prisma.service';
import { getTestPrismaClient, seedTestUser } from '../test-db';
import { StravaActivityDetail } from '../../src/strava/types/strava-activity-detail.interface';

describe('Activity Detail Fetch Integration', () => {
  let app: INestApplication;
  let activityService: ActivityService;
  let stravaService: StravaService;
  let prisma: ReturnType<typeof getTestPrismaClient>;

  const createMockStravaActivityDetail = (
    id: number,
    overrides?: Partial<StravaActivityDetail>,
  ): StravaActivityDetail => {
    return {
      id,
      resource_state: 3,
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
      type: 'Run',
      sport_type: 'Run',
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
        resource_state: 3,
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
      calories: 450.5,
      description: 'Great morning run with nice weather',
      splits_metric: [
        {
          distance: 1000,
          elapsed_time: 360,
          elevation_difference: 5,
          moving_time: 355,
          split: 1,
          average_speed: 2.82,
        },
        {
          distance: 1000,
          elapsed_time: 370,
          elevation_difference: -3,
          moving_time: 365,
          split: 2,
          average_speed: 2.74,
        },
      ],
      ...overrides,
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
    prisma = getTestPrismaClient();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await prisma.$executeRaw`TRUNCATE TABLE "Activity" RESTART IDENTITY CASCADE`;
    await prisma.$executeRaw`TRUNCATE TABLE "User" RESTART IDENTITY CASCADE`;
    await prisma.$executeRaw`TRUNCATE TABLE "UserPreferences" RESTART IDENTITY CASCADE`;
  });

  describe('fetchActivityDetails', () => {
    it('should fetch and store activity details via service', async () => {
      const { user } = await seedTestUser({ stravaId: 123456 });
      const activity = await prisma.activity.create({
        data: {
          userId: user.id,
          stravaId: BigInt(789012),
          name: 'Test Activity',
          type: 'Run',
          distance: 5000,
          movingTime: 1800,
          elapsedTime: 1900,
          totalElevationGain: 50,
          startDate: new Date(),
          startDateLocal: new Date(),
          timezone: 'Europe/Paris',
          hasKudoed: false,
          kudosCount: 0,
          detailsFetched: false,
          raw: {},
        } as any,
      });

      const mockDetail = createMockStravaActivityDetail(Number(activity.stravaId));

      jest.spyOn(stravaService, 'getActivityDetail').mockResolvedValue(mockDetail);

      const result = await activityService.fetchActivityDetails(user.id, activity.stravaId);

      expect(result.calories).toBe(450.5);
      expect(result.description).toBe('Great morning run with nice weather');
      expect(result.splits).toHaveLength(2);
      expect(result.detailsFetched).toBe(true);
      expect(result.detailsFetchedAt).toBeDefined();

      const updatedActivity = await prisma.activity.findUnique({
        where: { id: activity.id },
      });

      expect(updatedActivity?.detailsFetched).toBe(true);
      expect(updatedActivity?.calories).toBe(450.5);
      expect(updatedActivity?.description).toBe('Great morning run with nice weather');
      expect(updatedActivity?.splits).toBeDefined();
    });

    it('should return cached details without refetching when already fetched', async () => {
      const { user } = await seedTestUser({ stravaId: 123456 });
      const activity = await prisma.activity.create({
        data: {
          userId: user.id,
          stravaId: BigInt(789012),
          name: 'Test Activity',
          type: 'Run',
          distance: 5000,
          movingTime: 1800,
          elapsedTime: 1900,
          totalElevationGain: 50,
          startDate: new Date(),
          startDateLocal: new Date(),
          timezone: 'Europe/Paris',
          hasKudoed: false,
          kudosCount: 0,
          detailsFetched: false,
          raw: {},
        } as any,
      });

      await prisma.activity.update({
        where: { id: activity.id },
        data: {
          detailsFetched: true,
          detailsFetchedAt: new Date(),
          calories: 450.5,
          description: 'Cached description',
        },
      });

      const startTime = Date.now();
      const result = await activityService.fetchActivityDetails(user.id, activity.stravaId);
      const duration = Date.now() - startTime;

      expect(result.calories).toBe(450.5);
      expect(result.description).toBe('Cached description');
      expect(result.detailsFetched).toBe(true);
      expect(duration).toBeLessThan(100);
    });

    it('should update detailsFetched and detailsFetchedAt fields', async () => {
      const { user } = await seedTestUser({ stravaId: 123456 });
      const activity = await prisma.activity.create({
        data: {
          userId: user.id,
          stravaId: BigInt(789012),
          name: 'Test Activity',
          type: 'Run',
          distance: 5000,
          movingTime: 1800,
          elapsedTime: 1900,
          totalElevationGain: 50,
          startDate: new Date(),
          startDateLocal: new Date(),
          timezone: 'Europe/Paris',
          hasKudoed: false,
          kudosCount: 0,
          detailsFetched: false,
          raw: {},
        } as any,
      });

      const mockDetail = createMockStravaActivityDetail(Number(activity.stravaId));
      jest.spyOn(stravaService, 'getActivityDetail').mockResolvedValue(mockDetail);

      const beforeFetch = new Date();
      await activityService.fetchActivityDetails(user.id, activity.stravaId);
      const afterFetch = new Date();

      const updatedActivity = await prisma.activity.findUnique({
        where: { id: activity.id },
      });

      expect(updatedActivity?.detailsFetched).toBe(true);
      expect(updatedActivity?.detailsFetchedAt).toBeDefined();

      if (updatedActivity?.detailsFetchedAt) {
        const fetchedAt = new Date(updatedActivity.detailsFetchedAt);
        expect(fetchedAt.getTime()).toBeGreaterThanOrEqual(beforeFetch.getTime());
        expect(fetchedAt.getTime()).toBeLessThanOrEqual(afterFetch.getTime());
      }
    });

    it('should handle Strava API rate limit errors gracefully', async () => {
      const { user } = await seedTestUser({ stravaId: 123456 });
      const activity = await prisma.activity.create({
        data: {
          userId: user.id,
          stravaId: BigInt(789012),
          name: 'Test Activity',
          type: 'Run',
          distance: 5000,
          movingTime: 1800,
          elapsedTime: 1900,
          totalElevationGain: 50,
          startDate: new Date(),
          startDateLocal: new Date(),
          timezone: 'Europe/Paris',
          hasKudoed: false,
          kudosCount: 0,
          detailsFetched: false,
          raw: {},
        } as any,
      });

      const rateLimitError = new Error('Rate limit exceeded');
      jest.spyOn(stravaService, 'getActivityDetail').mockRejectedValue(rateLimitError);

      await expect(activityService.fetchActivityDetails(user.id, activity.stravaId)).rejects.toThrow(
        'Rate limit exceeded',
      );

      const unchangedActivity = await prisma.activity.findUnique({
        where: { id: activity.id },
      });

      expect(unchangedActivity?.detailsFetched).toBe(false);
      expect(unchangedActivity?.calories).toBeNull();
    });

    it('should throw BadRequestException for non-existent activity', async () => {
      const { user } = await seedTestUser({ stravaId: 123456 });
      const nonExistentStravaId = BigInt(999999);

      await expect(activityService.fetchActivityDetails(user.id, nonExistentStravaId)).rejects.toThrow(
        BadRequestException,
      );
      await expect(activityService.fetchActivityDetails(user.id, nonExistentStravaId)).rejects.toThrow(
        `Activity with stravaId ${nonExistentStravaId} not found`,
      );
    });

    it('should reject fetch for activity belonging to different user', async () => {
      const { user: user1 } = await seedTestUser({ stravaId: 123456 });
      const { user: user2 } = await seedTestUser({ stravaId: 654321 });
      const activity = await prisma.activity.create({
        data: {
          userId: user1.id,
          stravaId: BigInt(789012),
          name: 'Test Activity',
          type: 'Run',
          distance: 5000,
          movingTime: 1800,
          elapsedTime: 1900,
          totalElevationGain: 50,
          startDate: new Date(),
          startDateLocal: new Date(),
          timezone: 'Europe/Paris',
          hasKudoed: false,
          kudosCount: 0,
          detailsFetched: false,
          raw: {},
        } as any,
      });

      await expect(activityService.fetchActivityDetails(user2.id, activity.stravaId)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should handle partial detail data from Strava (missing splits)', async () => {
      const { user } = await seedTestUser({ stravaId: 123456 });
      const activity = await prisma.activity.create({
        data: {
          userId: user.id,
          stravaId: BigInt(789012),
          name: 'Test Activity',
          type: 'Run',
          distance: 5000,
          movingTime: 1800,
          elapsedTime: 1900,
          totalElevationGain: 50,
          startDate: new Date(),
          startDateLocal: new Date(),
          timezone: 'Europe/Paris',
          hasKudoed: false,
          kudosCount: 0,
          detailsFetched: false,
          raw: {},
        } as any,
      });

      const mockDetailWithoutSplits = createMockStravaActivityDetail(Number(activity.stravaId), {
        splits_metric: undefined,
      });

      jest.spyOn(stravaService, 'getActivityDetail').mockResolvedValue(mockDetailWithoutSplits);

      const result = await activityService.fetchActivityDetails(user.id, activity.stravaId);

      expect(result.calories).toBe(450.5);
      expect(result.description).toBe('Great morning run with nice weather');
      expect(result.splits).toBeUndefined();
      expect(result.detailsFetched).toBe(true);
    });

    it('should handle partial detail data from Strava (missing calories)', async () => {
      const { user } = await seedTestUser({ stravaId: 123456 });
      const activity = await prisma.activity.create({
        data: {
          userId: user.id,
          stravaId: BigInt(789012),
          name: 'Test Activity',
          type: 'Run',
          distance: 5000,
          movingTime: 1800,
          elapsedTime: 1900,
          totalElevationGain: 50,
          startDate: new Date(),
          startDateLocal: new Date(),
          timezone: 'Europe/Paris',
          hasKudoed: false,
          kudosCount: 0,
          detailsFetched: false,
          raw: {},
        } as any,
      });

      const mockDetailWithoutCalories = createMockStravaActivityDetail(Number(activity.stravaId), {
        calories: undefined,
      });

      jest.spyOn(stravaService, 'getActivityDetail').mockResolvedValue(mockDetailWithoutCalories);

      const result = await activityService.fetchActivityDetails(user.id, activity.stravaId);

      expect(result.calories).toBeUndefined();
      expect(result.description).toBe('Great morning run with nice weather');
      expect(result.splits).toHaveLength(2);
      expect(result.detailsFetched).toBe(true);
    });
  });
});
