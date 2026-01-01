import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../../src/app.module';
import { ActivityService } from '../../src/activity/activity.service';
import { StravaService } from '../../src/strava/strava.service';
import { PrismaService } from '../../src/database/prisma.service';
import { getTestPrismaClient, seedTestUser } from '../test-db';
import { StravaActivitySummary } from '../../src/strava/types';
import { SportType } from '../../src/user-preferences/enums/sport-type.enum';
import { GoalTargetType } from '../../src/goal/enums/goal-target-type.enum';
import { GoalPeriodType } from '../../src/goal/enums/goal-period-type.enum';
import { GoalStatus } from '../../src/goal/enums/goal-status.enum';

describe('Goal Auto-Update on Activity Sync', () => {
  let app: INestApplication;
  let activityService: ActivityService;
  let stravaService: StravaService;
  let prisma: ReturnType<typeof getTestPrismaClient>;

  const getTestDates = () => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    const testActivityDate = new Date(now.getFullYear(), now.getMonth(), 15);

    return {
      startOfMonth,
      endOfMonth,
      testActivityDate: testActivityDate.toISOString(),
    };
  };

  const createMockStravaActivity = (id: number, overrides?: Partial<StravaActivitySummary>): StravaActivitySummary => {
    return {
      id,
      resource_state: 2,
      external_id: `external_${id}`,
      upload_id: id + 1000,
      athlete: { id: 123456, resource_state: 1 },
      name: `Activity ${id}`,
      distance: 10000,
      moving_time: 3600,
      elapsed_time: 3700,
      total_elevation_gain: 100,
      type: 'Run',
      sport_type: 'Run',
      workout_type: null,
      start_date: '2025-01-15T10:00:00Z',
      start_date_local: '2025-01-15T11:00:00+01:00',
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
      map: { id: `map_${id}`, summary_polyline: 'encoded_polyline', resource_state: 2 },
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

  it('should update goal progress after activity sync', async () => {
    const { user } = await seedTestUser();
    const { startOfMonth, endOfMonth, testActivityDate } = getTestDates();

    await prisma.userPreferences.update({
      where: { userId: user.id },
      data: { selectedSports: [SportType.RUN] },
    });

    const goal = await prisma.goal.create({
      data: {
        userId: user.id,
        title: 'Run 50km this month',
        targetType: GoalTargetType.DISTANCE,
        targetValue: 50,
        periodType: GoalPeriodType.MONTHLY,
        startDate: startOfMonth,
        endDate: endOfMonth,
        isRecurring: false,
        sportType: SportType.RUN,
        status: GoalStatus.ACTIVE,
        currentValue: 0,
      },
    });

    jest
      .spyOn(stravaService, 'getActivities')
      .mockImplementation(
        async (
          userId: number,
          options: { page?: number; per_page?: number; before?: number; after?: number } = {},
        ): Promise<StravaActivitySummary[]> => {
          const { page = 1 } = options;
          if (page === 1) {
            return [
              createMockStravaActivity(1, { distance: 10000, moving_time: 3600, start_date: testActivityDate }),
              createMockStravaActivity(2, { distance: 15000, moving_time: 5400, start_date: testActivityDate }),
            ];
          }
          return [];
        },
      );

    await activityService.syncActivities(user.id);

    const updatedGoal = await prisma.goal.findUnique({ where: { id: goal.id } });

    expect(updatedGoal).toBeDefined();
    expect(updatedGoal!.currentValue).toBe(25);
    expect(updatedGoal!.status).toBe(GoalStatus.ACTIVE);
  });

  it('should mark goal as completed when target is reached', async () => {
    const { user } = await seedTestUser();
    const { startOfMonth, endOfMonth, testActivityDate } = getTestDates();

    await prisma.userPreferences.update({
      where: { userId: user.id },
      data: { selectedSports: [SportType.RUN] },
    });

    const goal = await prisma.goal.create({
      data: {
        userId: user.id,
        title: 'Run 50km this month',
        targetType: GoalTargetType.DISTANCE,
        targetValue: 50,
        periodType: GoalPeriodType.MONTHLY,
        startDate: startOfMonth,
        endDate: endOfMonth,
        isRecurring: false,
        sportType: SportType.RUN,
        status: GoalStatus.ACTIVE,
        currentValue: 0,
      },
    });

    jest
      .spyOn(stravaService, 'getActivities')
      .mockImplementation(
        async (
          userId: number,
          options: { page?: number; per_page?: number; before?: number; after?: number } = {},
        ): Promise<StravaActivitySummary[]> => {
          const { page = 1 } = options;
          if (page === 1) {
            return [
              createMockStravaActivity(101, { distance: 30000, moving_time: 10800, start_date: testActivityDate }),
              createMockStravaActivity(102, { distance: 25000, moving_time: 9000, start_date: testActivityDate }),
            ];
          }
          return [];
        },
      );

    await activityService.syncActivities(user.id);

    const updatedGoal = await prisma.goal.findUnique({ where: { id: goal.id } });

    expect(updatedGoal).toBeDefined();
    expect(updatedGoal!.currentValue).toBe(55);
    expect(updatedGoal!.status).toBe(GoalStatus.COMPLETED);
    expect(updatedGoal!.completedAt).toBeInstanceOf(Date);
  });

  it('should update multiple goals simultaneously', async () => {
    const { user } = await seedTestUser();
    const { startOfMonth, endOfMonth, testActivityDate } = getTestDates();

    await prisma.userPreferences.update({
      where: { userId: user.id },
      data: { selectedSports: [SportType.RUN] },
    });

    const distanceGoal = await prisma.goal.create({
      data: {
        userId: user.id,
        title: 'Run 50km',
        targetType: GoalTargetType.DISTANCE,
        targetValue: 50,
        periodType: GoalPeriodType.MONTHLY,
        startDate: startOfMonth,
        endDate: endOfMonth,
        isRecurring: false,
        sportType: SportType.RUN,
        status: GoalStatus.ACTIVE,
        currentValue: 0,
      },
    });

    const durationGoal = await prisma.goal.create({
      data: {
        userId: user.id,
        title: 'Run 10 hours',
        targetType: GoalTargetType.DURATION,
        targetValue: 10,
        periodType: GoalPeriodType.MONTHLY,
        startDate: startOfMonth,
        endDate: endOfMonth,
        isRecurring: false,
        sportType: SportType.RUN,
        status: GoalStatus.ACTIVE,
        currentValue: 0,
      },
    });

    const frequencyGoal = await prisma.goal.create({
      data: {
        userId: user.id,
        title: '10 runs this month',
        targetType: GoalTargetType.FREQUENCY,
        targetValue: 10,
        periodType: GoalPeriodType.MONTHLY,
        startDate: startOfMonth,
        endDate: endOfMonth,
        isRecurring: false,
        sportType: SportType.RUN,
        status: GoalStatus.ACTIVE,
        currentValue: 0,
      },
    });

    jest
      .spyOn(stravaService, 'getActivities')
      .mockImplementation(
        async (
          userId: number,
          options: { page?: number; per_page?: number; before?: number; after?: number } = {},
        ): Promise<StravaActivitySummary[]> => {
          const { page = 1 } = options;
          if (page === 1) {
            return [
              createMockStravaActivity(201, { distance: 10000, moving_time: 3600, start_date: testActivityDate }),
              createMockStravaActivity(202, { distance: 8000, moving_time: 2880, start_date: testActivityDate }),
              createMockStravaActivity(203, { distance: 12000, moving_time: 4320, start_date: testActivityDate }),
            ];
          }
          return [];
        },
      );

    await activityService.syncActivities(user.id);

    const updatedDistanceGoal = await prisma.goal.findUnique({ where: { id: distanceGoal.id } });
    const updatedDurationGoal = await prisma.goal.findUnique({ where: { id: durationGoal.id } });
    const updatedFrequencyGoal = await prisma.goal.findUnique({ where: { id: frequencyGoal.id } });

    expect(updatedDistanceGoal!.currentValue).toBe(30);
    expect(updatedDurationGoal!.currentValue).toBe(3);
    expect(updatedFrequencyGoal!.currentValue).toBe(3);

    expect(updatedDistanceGoal!.status).toBe(GoalStatus.ACTIVE);
    expect(updatedDurationGoal!.status).toBe(GoalStatus.ACTIVE);
    expect(updatedFrequencyGoal!.status).toBe(GoalStatus.ACTIVE);
  });

  it('should only update goals in date range of synced activities', async () => {
    const { user } = await seedTestUser();
    const { startOfMonth, endOfMonth, testActivityDate } = getTestDates();

    await prisma.userPreferences.update({
      where: { userId: user.id },
      data: { selectedSports: [SportType.RUN] },
    });

    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    const expiredGoal = await prisma.goal.create({
      data: {
        userId: user.id,
        title: 'Goal that ended before sync',
        targetType: GoalTargetType.DISTANCE,
        targetValue: 50,
        periodType: GoalPeriodType.CUSTOM,
        startDate: lastMonth,
        endDate: endOfLastMonth,
        isRecurring: false,
        sportType: SportType.RUN,
        status: GoalStatus.ACTIVE,
        currentValue: 0,
      },
    });

    const futureEnd = new Date(now.getFullYear(), now.getMonth() + 2, 0, 23, 59, 59);

    const activeGoal = await prisma.goal.create({
      data: {
        userId: user.id,
        title: 'Active goal',
        targetType: GoalTargetType.DISTANCE,
        targetValue: 50,
        periodType: GoalPeriodType.MONTHLY,
        startDate: startOfMonth,
        endDate: futureEnd,
        isRecurring: false,
        sportType: SportType.RUN,
        status: GoalStatus.ACTIVE,
        currentValue: 0,
      },
    });

    jest
      .spyOn(stravaService, 'getActivities')
      .mockImplementation(
        async (
          userId: number,
          options: { page?: number; per_page?: number; before?: number; after?: number } = {},
        ): Promise<StravaActivitySummary[]> => {
          const { page = 1 } = options;
          if (page === 1) {
            return [createMockStravaActivity(301, { distance: 10000, start_date: testActivityDate })];
          }
          return [];
        },
      );

    await activityService.syncActivities(user.id);

    const updatedExpiredGoal = await prisma.goal.findUnique({ where: { id: expiredGoal.id } });
    const updatedActiveGoal = await prisma.goal.findUnique({ where: { id: activeGoal.id } });

    expect(updatedExpiredGoal!.currentValue).toBe(0);
    expect(updatedExpiredGoal!.status).toBe(GoalStatus.ACTIVE);

    expect(updatedActiveGoal!.currentValue).toBe(10);
    expect(updatedActiveGoal!.status).toBe(GoalStatus.ACTIVE);
  });
});
