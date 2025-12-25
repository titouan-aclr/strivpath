import { ActivityMapper } from './activity.mapper';
import { createMockPrismaActivity } from '../../test/mocks/factories';

describe('ActivityMapper', () => {
  describe('toGraphQL', () => {
    it('should map all required fields correctly', () => {
      const prismaActivity = createMockPrismaActivity({
        id: 1,
        stravaId: BigInt('1234567890'),
        userId: 10,
        name: 'Evening Ride',
        type: 'Ride',
        distance: 15000,
        movingTime: 3600,
        elapsedTime: 3700,
        totalElevationGain: 250,
        startDate: new Date('2024-01-15T18:00:00Z'),
        startDateLocal: new Date('2024-01-15T19:00:00Z'),
        timezone: '(GMT+01:00) Europe/Paris',
        hasKudoed: true,
        kudosCount: 12,
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-16'),
      });

      const result = ActivityMapper.toGraphQL(prismaActivity);

      expect(result.id).toBe(1);
      expect(result.stravaId).toBe(BigInt('1234567890'));
      expect(result.userId).toBe(10);
      expect(result.name).toBe('Evening Ride');
      expect(result.type).toBe('Ride');
      expect(result.distance).toBe(15000);
      expect(result.movingTime).toBe(3600);
      expect(result.elapsedTime).toBe(3700);
      expect(result.totalElevationGain).toBe(250);
      expect(result.startDate).toEqual(new Date('2024-01-15T18:00:00Z'));
      expect(result.startDateLocal).toEqual(new Date('2024-01-15T19:00:00Z'));
      expect(result.timezone).toBe('(GMT+01:00) Europe/Paris');
      expect(result.hasKudoed).toBe(true);
      expect(result.kudosCount).toBe(12);
      expect(result.createdAt).toEqual(new Date('2024-01-15'));
      expect(result.updatedAt).toEqual(new Date('2024-01-16'));
    });

    it('should handle BigInt stravaId conversion correctly', () => {
      const prismaActivity = createMockPrismaActivity({
        stravaId: BigInt('9999999999999'),
      });

      const result = ActivityMapper.toGraphQL(prismaActivity);

      expect(result.stravaId).toBe(BigInt('9999999999999'));
      expect(typeof result.stravaId).toBe('bigint');
    });

    it('should convert null to undefined for optional fields', () => {
      const prismaActivity = createMockPrismaActivity({
        averageSpeed: null,
        maxSpeed: null,
        averageHeartrate: null,
        maxHeartrate: null,
        kilojoules: null,
        deviceWatts: null,
        averageCadence: null,
        elevHigh: null,
        elevLow: null,
        calories: null,
        splits: null,
        averageWatts: null,
        weightedAverageWatts: null,
        maxWatts: null,
        description: null,
        detailsFetchedAt: null,
      });

      const result = ActivityMapper.toGraphQL(prismaActivity);

      expect(result.averageSpeed).toBeUndefined();
      expect(result.maxSpeed).toBeUndefined();
      expect(result.averageHeartrate).toBeUndefined();
      expect(result.maxHeartrate).toBeUndefined();
      expect(result.kilojoules).toBeUndefined();
      expect(result.deviceWatts).toBeUndefined();
      expect(result.averageCadence).toBeUndefined();
      expect(result.elevHigh).toBeUndefined();
      expect(result.elevLow).toBeUndefined();
      expect(result.calories).toBeUndefined();
      expect(result.splits).toBeUndefined();
      expect(result.averageWatts).toBeUndefined();
      expect(result.weightedAverageWatts).toBeUndefined();
      expect(result.maxWatts).toBeUndefined();
      expect(result.description).toBeUndefined();
      expect(result.detailsFetchedAt).toBeUndefined();
    });

    it('should map numeric fields with correct precision', () => {
      const prismaActivity = createMockPrismaActivity({
        distance: 5432.1,
        averageSpeed: 3.456,
        maxSpeed: 5.789,
        averageHeartrate: 142.5,
        maxHeartrate: 178.3,
        kilojoules: 850.25,
        averageCadence: 87.6,
        totalElevationGain: 123.45,
      });

      const result = ActivityMapper.toGraphQL(prismaActivity);

      expect(result.distance).toBe(5432.1);
      expect(result.averageSpeed).toBe(3.456);
      expect(result.maxSpeed).toBe(5.789);
      expect(result.averageHeartrate).toBe(142.5);
      expect(result.maxHeartrate).toBe(178.3);
      expect(result.kilojoules).toBe(850.25);
      expect(result.averageCadence).toBe(87.6);
      expect(result.totalElevationGain).toBe(123.45);
    });

    it('should handle activity with minimal data', () => {
      const prismaActivity = createMockPrismaActivity({
        id: 1,
        stravaId: BigInt('123'),
        userId: 1,
        name: 'Quick Run',
        type: 'Run',
        distance: 5000,
        movingTime: 1800,
        elapsedTime: 1800,
        totalElevationGain: 0,
        averageSpeed: null,
        maxSpeed: null,
        averageHeartrate: null,
        maxHeartrate: null,
        kilojoules: null,
        deviceWatts: null,
        averageCadence: null,
      });

      const result = ActivityMapper.toGraphQL(prismaActivity);

      expect(result).toMatchObject({
        id: 1,
        stravaId: BigInt('123'),
        userId: 1,
        name: 'Quick Run',
        type: 'Run',
        distance: 5000,
        movingTime: 1800,
        elapsedTime: 1800,
        totalElevationGain: 0,
      });
      expect(result.averageSpeed).toBeUndefined();
      expect(result.maxSpeed).toBeUndefined();
      expect(result.averageHeartrate).toBeUndefined();
      expect(result.maxHeartrate).toBeUndefined();
      expect(result.kilojoules).toBeUndefined();
      expect(result.deviceWatts).toBeUndefined();
      expect(result.averageCadence).toBeUndefined();
    });

    it('should handle activity with all fields populated', () => {
      const prismaActivity = createMockPrismaActivity({
        id: 99,
        stravaId: BigInt('8888888888'),
        userId: 42,
        name: 'Full Data Activity',
        type: 'Ride',
        distance: 50000,
        movingTime: 7200,
        elapsedTime: 7500,
        totalElevationGain: 1200,
        startDate: new Date('2024-05-10T06:00:00Z'),
        startDateLocal: new Date('2024-05-10T08:00:00Z'),
        timezone: '(GMT+02:00) Europe/Berlin',
        averageSpeed: 6.94,
        maxSpeed: 15.3,
        averageHeartrate: 155,
        maxHeartrate: 182,
        kilojoules: 2500,
        deviceWatts: true,
        hasKudoed: false,
        kudosCount: 25,
        averageCadence: 90,
        elevHigh: 850.0,
        elevLow: 320.0,
        calories: 1250.5,
        averageWatts: 210.0,
        weightedAverageWatts: 225.0,
        maxWatts: 750,
        description: 'Amazing ride through the mountains',
        detailsFetched: true,
        detailsFetchedAt: new Date('2024-05-10T10:00:00Z'),
        splits: [{ distance: 1000, moving_time: 300 }] as any,
        createdAt: new Date('2024-05-10'),
        updatedAt: new Date('2024-05-11'),
      });

      const result = ActivityMapper.toGraphQL(prismaActivity);

      expect(result).toEqual({
        id: 99,
        stravaId: BigInt('8888888888'),
        userId: 42,
        name: 'Full Data Activity',
        type: 'Ride',
        distance: 50000,
        movingTime: 7200,
        elapsedTime: 7500,
        totalElevationGain: 1200,
        startDate: new Date('2024-05-10T06:00:00Z'),
        startDateLocal: new Date('2024-05-10T08:00:00Z'),
        timezone: '(GMT+02:00) Europe/Berlin',
        averageSpeed: 6.94,
        maxSpeed: 15.3,
        averageHeartrate: 155,
        maxHeartrate: 182,
        kilojoules: 2500,
        deviceWatts: true,
        hasKudoed: false,
        kudosCount: 25,
        averageCadence: 90,
        elevHigh: 850.0,
        elevLow: 320.0,
        calories: 1250.5,
        splits: [{ distance: 1000, movingTime: 300 }],
        averageWatts: 210.0,
        weightedAverageWatts: 225.0,
        maxWatts: 750,
        description: 'Amazing ride through the mountains',
        detailsFetched: true,
        detailsFetchedAt: new Date('2024-05-10T10:00:00Z'),
        createdAt: new Date('2024-05-10'),
        updatedAt: new Date('2024-05-11'),
      });
    });

    it('should preserve boolean values correctly', () => {
      const activityWithDeviceWatts = createMockPrismaActivity({
        deviceWatts: true,
        hasKudoed: true,
      });

      const resultTrue = ActivityMapper.toGraphQL(activityWithDeviceWatts);

      expect(resultTrue.deviceWatts).toBe(true);
      expect(resultTrue.hasKudoed).toBe(true);

      const activityWithoutDeviceWatts = createMockPrismaActivity({
        deviceWatts: false,
        hasKudoed: false,
      });

      const resultFalse = ActivityMapper.toGraphQL(activityWithoutDeviceWatts);

      expect(resultFalse.deviceWatts).toBe(false);
      expect(resultFalse.hasKudoed).toBe(false);
    });

    it('should handle zero values for numeric fields', () => {
      const prismaActivity = createMockPrismaActivity({
        distance: 0,
        movingTime: 0,
        elapsedTime: 0,
        totalElevationGain: 0,
        kudosCount: 0,
        averageSpeed: 0,
        maxSpeed: 0,
        averageHeartrate: 0,
        maxHeartrate: 0,
        kilojoules: 0,
        averageCadence: 0,
      });

      const result = ActivityMapper.toGraphQL(prismaActivity);

      expect(result.distance).toBe(0);
      expect(result.movingTime).toBe(0);
      expect(result.elapsedTime).toBe(0);
      expect(result.totalElevationGain).toBe(0);
      expect(result.kudosCount).toBe(0);
      expect(result.averageSpeed).toBe(0);
      expect(result.maxSpeed).toBe(0);
      expect(result.averageHeartrate).toBe(0);
      expect(result.maxHeartrate).toBe(0);
      expect(result.kilojoules).toBe(0);
      expect(result.averageCadence).toBe(0);
    });

    it('should handle different activity types correctly', () => {
      const runActivity = createMockPrismaActivity({ type: 'Run' });
      const rideActivity = createMockPrismaActivity({ type: 'Ride' });
      const swimActivity = createMockPrismaActivity({ type: 'Swim' });

      expect(ActivityMapper.toGraphQL(runActivity).type).toBe('Run');
      expect(ActivityMapper.toGraphQL(rideActivity).type).toBe('Ride');
      expect(ActivityMapper.toGraphQL(swimActivity).type).toBe('Swim');
    });

    it('should map new altitude and power fields correctly', () => {
      const prismaActivity = createMockPrismaActivity({
        elevHigh: 1850.5,
        elevLow: 1200.3,
        calories: 450.75,
        averageWatts: 220.5,
        weightedAverageWatts: 235.8,
        maxWatts: 850,
      });

      const result = ActivityMapper.toGraphQL(prismaActivity);

      expect(result.elevHigh).toBe(1850.5);
      expect(result.elevLow).toBe(1200.3);
      expect(result.calories).toBe(450.75);
      expect(result.averageWatts).toBe(220.5);
      expect(result.weightedAverageWatts).toBe(235.8);
      expect(result.maxWatts).toBe(850);
    });

    it('should transform splits JSON to Split array correctly', () => {
      const mockSplits = [
        {
          distance: 1000,
          moving_time: 300,
          elapsed_time: 305,
          average_speed: 3.33,
          elevation_difference: 5,
        },
        {
          distance: 1000,
          moving_time: 290,
          elapsed_time: 295,
          average_speed: 3.45,
          elevation_difference: -3,
        },
      ];

      const prismaActivity = createMockPrismaActivity({
        splits: mockSplits as any,
      });

      const result = ActivityMapper.toGraphQL(prismaActivity);

      expect(result.splits).toBeDefined();
      expect(Array.isArray(result.splits)).toBe(true);
      expect(result.splits).toHaveLength(2);
      expect(result.splits![0]).toEqual({
        distance: 1000,
        movingTime: 300,
        elapsedTime: 305,
        averageSpeed: 3.33,
        elevationDifference: 5,
      });
    });

    it('should handle activity with all new fields populated', () => {
      const mockSplits = [
        {
          distance: 1000,
          moving_time: 300,
          elapsed_time: 305,
          average_speed: 3.33,
        },
      ];

      const prismaActivity = createMockPrismaActivity({
        elevHigh: 450.0,
        elevLow: 200.0,
        calories: 850.5,
        splits: mockSplits as any,
        averageWatts: 180.5,
        weightedAverageWatts: 195.0,
        maxWatts: 650,
      });

      const result = ActivityMapper.toGraphQL(prismaActivity);

      expect(result.elevHigh).toBe(450.0);
      expect(result.elevLow).toBe(200.0);
      expect(result.calories).toBe(850.5);
      expect(result.splits).toBeDefined();
      expect(result.splits).toHaveLength(1);
      expect(result.averageWatts).toBe(180.5);
      expect(result.weightedAverageWatts).toBe(195.0);
      expect(result.maxWatts).toBe(650);
    });

    it('should map detail fields correctly', () => {
      const prismaActivity = createMockPrismaActivity({
        description: 'Amazing morning run with great weather',
        detailsFetched: true,
        detailsFetchedAt: new Date('2024-05-15T10:30:00Z'),
      });

      const result = ActivityMapper.toGraphQL(prismaActivity);

      expect(result.description).toBe('Amazing morning run with great weather');
      expect(result.detailsFetched).toBe(true);
      expect(result.detailsFetchedAt).toEqual(new Date('2024-05-15T10:30:00Z'));
    });

    it('should handle detailsFetched false with no description', () => {
      const prismaActivity = createMockPrismaActivity({
        description: null,
        detailsFetched: false,
        detailsFetchedAt: null,
      });

      const result = ActivityMapper.toGraphQL(prismaActivity);

      expect(result.description).toBeUndefined();
      expect(result.detailsFetched).toBe(false);
      expect(result.detailsFetchedAt).toBeUndefined();
    });

    it('should handle null splits gracefully', () => {
      const prismaActivityWithNullSplits = createMockPrismaActivity({
        splits: null,
      });

      const resultNull = ActivityMapper.toGraphQL(prismaActivityWithNullSplits);
      expect(resultNull.splits).toBeUndefined();
    });

    it('should handle malformed splits with missing fields', () => {
      const prismaActivityWithMalformedSplits = createMockPrismaActivity({
        splits: [{ invalid: 'data' }] as any,
      });

      const resultMalformed = ActivityMapper.toGraphQL(prismaActivityWithMalformedSplits);
      expect(resultMalformed.splits).toBeDefined();
      expect(resultMalformed.splits).toHaveLength(1);
      expect(resultMalformed.splits![0].distance).toBeUndefined();
      expect(resultMalformed.splits![0].movingTime).toBeUndefined();
      expect(resultMalformed.splits![0].elapsedTime).toBeUndefined();
      expect(resultMalformed.splits![0].averageSpeed).toBeUndefined();
      expect(resultMalformed.splits![0].elevationDifference).toBeUndefined();
    });

    it('should transform empty splits array correctly', () => {
      const prismaActivity = createMockPrismaActivity({
        splits: [] as any,
      });

      const result = ActivityMapper.toGraphQL(prismaActivity);

      expect(result.splits).toBeDefined();
      expect(Array.isArray(result.splits)).toBe(true);
      expect(result.splits).toHaveLength(0);
    });

    it('should handle splits with missing optional fields', () => {
      const minimalSplits = [
        {
          distance: 1000,
          moving_time: 300,
        },
        {
          distance: 1000,
          moving_time: 310,
          average_speed: 3.23,
        },
      ];

      const prismaActivity = createMockPrismaActivity({
        splits: minimalSplits as any,
      });

      const result = ActivityMapper.toGraphQL(prismaActivity);

      expect(result.splits).toBeDefined();
      expect(result.splits).toHaveLength(2);
      expect(result.splits![0]).toEqual({
        distance: 1000,
        movingTime: 300,
        elapsedTime: undefined,
        averageSpeed: undefined,
        elevationDifference: undefined,
      });
      expect(result.splits![1]).toEqual({
        distance: 1000,
        movingTime: 310,
        elapsedTime: undefined,
        averageSpeed: 3.23,
        elevationDifference: undefined,
      });
    });
  });
});
