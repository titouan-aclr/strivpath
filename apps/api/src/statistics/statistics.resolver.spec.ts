import { Test, TestingModule } from '@nestjs/testing';
import { StatisticsResolver } from './statistics.resolver';
import { StatisticsService } from './statistics.service';
import { TokenPayload } from '../auth/types/token-payload.interface';
import { StatisticsPeriod } from './enums/statistics-period.enum';
import { ProgressionMetric } from './enums/progression-metric.enum';
import { IntervalType } from './enums/interval-type.enum';
import { PeriodStatistics } from './models/period-statistics.model';
import { ActivityCalendarDay } from './models/activity-calendar-day.model';
import { SportDistribution } from './models/sport-distribution.model';
import { SportPeriodStatistics } from './models/sport-period-statistics.model';
import { SportAverageMetrics } from './models/sport-average-metrics.model';
import { ProgressionDataPoint } from './models/progression-data-point.model';
import { PersonalRecord } from './models/personal-record.model';
import { SportType } from '../user-preferences/enums/sport-type.enum';

describe('StatisticsResolver', () => {
  let resolver: StatisticsResolver;
  let statisticsService: jest.Mocked<StatisticsService>;

  const mockStatisticsService = {
    getPeriodStatistics: jest.fn(),
    getActivityCalendar: jest.fn(),
    getSportDistribution: jest.fn(),
    getSportPeriodStatistics: jest.fn(),
    getSportProgressionData: jest.fn(),
    getSportAverageMetrics: jest.fn(),
    getPersonalRecords: jest.fn(),
  };

  const mockTokenPayload: TokenPayload = {
    sub: 1,
    stravaId: 12345,
  };

  const createMockPeriodStatistics = (overrides?: Partial<PeriodStatistics>): PeriodStatistics => ({
    totalTime: 7200,
    activityCount: 3,
    averageTimePerSession: 2400,
    periodStart: new Date('2025-01-20'),
    periodEnd: new Date('2025-01-26'),
    ...overrides,
  });

  const createMockCalendarDay = (date: Date, hasActivity: boolean): ActivityCalendarDay => ({
    date,
    hasActivity,
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StatisticsResolver,
        {
          provide: StatisticsService,
          useValue: mockStatisticsService,
        },
      ],
    }).compile();

    resolver = module.get<StatisticsResolver>(StatisticsResolver);
    statisticsService = module.get(StatisticsService) as jest.Mocked<StatisticsService>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('periodStatistics', () => {
    it('should return period statistics for WEEK', async () => {
      const mockStats = createMockPeriodStatistics();
      mockStatisticsService.getPeriodStatistics.mockResolvedValue(mockStats);

      const result = await resolver.periodStatistics(mockTokenPayload, StatisticsPeriod.WEEK);

      expect(statisticsService.getPeriodStatistics).toHaveBeenCalledWith(mockTokenPayload.sub, StatisticsPeriod.WEEK);
      expect(result).toEqual(mockStats);
    });

    it('should return period statistics for MONTH', async () => {
      const mockStats = createMockPeriodStatistics({
        totalTime: 36000,
        activityCount: 10,
        averageTimePerSession: 3600,
        periodStart: new Date('2025-01-01'),
        periodEnd: new Date('2025-01-31'),
      });
      mockStatisticsService.getPeriodStatistics.mockResolvedValue(mockStats);

      const result = await resolver.periodStatistics(mockTokenPayload, StatisticsPeriod.MONTH);

      expect(statisticsService.getPeriodStatistics).toHaveBeenCalledWith(mockTokenPayload.sub, StatisticsPeriod.MONTH);
      expect(result).toEqual(mockStats);
    });

    it('should return period statistics for YEAR', async () => {
      const mockStats = createMockPeriodStatistics({
        totalTime: 360000,
        activityCount: 100,
        averageTimePerSession: 3600,
        periodStart: new Date('2025-01-01'),
        periodEnd: new Date('2025-12-31'),
      });
      mockStatisticsService.getPeriodStatistics.mockResolvedValue(mockStats);

      const result = await resolver.periodStatistics(mockTokenPayload, StatisticsPeriod.YEAR);

      expect(statisticsService.getPeriodStatistics).toHaveBeenCalledWith(mockTokenPayload.sub, StatisticsPeriod.YEAR);
      expect(result).toEqual(mockStats);
    });

    it('should pass correct user ID from token payload', async () => {
      const customTokenPayload: TokenPayload = {
        sub: 42,
        stravaId: 99999,
      };
      const mockStats = createMockPeriodStatistics();
      mockStatisticsService.getPeriodStatistics.mockResolvedValue(mockStats);

      await resolver.periodStatistics(customTokenPayload, StatisticsPeriod.WEEK);

      expect(statisticsService.getPeriodStatistics).toHaveBeenCalledWith(42, StatisticsPeriod.WEEK);
    });

    it('should return statistics with zero activities', async () => {
      const emptyStats = createMockPeriodStatistics({
        totalTime: 0,
        activityCount: 0,
        averageTimePerSession: 0,
      });
      mockStatisticsService.getPeriodStatistics.mockResolvedValue(emptyStats);

      const result = await resolver.periodStatistics(mockTokenPayload, StatisticsPeriod.WEEK);

      expect(result.totalTime).toBe(0);
      expect(result.activityCount).toBe(0);
      expect(result.averageTimePerSession).toBe(0);
    });

    it('should call service exactly once per query', async () => {
      const mockStats = createMockPeriodStatistics();
      mockStatisticsService.getPeriodStatistics.mockResolvedValue(mockStats);

      await resolver.periodStatistics(mockTokenPayload, StatisticsPeriod.MONTH);

      expect(statisticsService.getPeriodStatistics).toHaveBeenCalledTimes(1);
    });

    it('should propagate service errors', async () => {
      const error = new Error('Database connection failed');
      mockStatisticsService.getPeriodStatistics.mockRejectedValue(error);

      await expect(resolver.periodStatistics(mockTokenPayload, StatisticsPeriod.WEEK)).rejects.toThrow(
        'Database connection failed',
      );
    });

    it('should return correct period dates from service', async () => {
      const periodStart = new Date('2025-01-20T00:00:00.000Z');
      const periodEnd = new Date('2025-01-26T23:59:59.999Z');
      const mockStats = createMockPeriodStatistics({ periodStart, periodEnd });
      mockStatisticsService.getPeriodStatistics.mockResolvedValue(mockStats);

      const result = await resolver.periodStatistics(mockTokenPayload, StatisticsPeriod.WEEK);

      expect(result.periodStart).toEqual(periodStart);
      expect(result.periodEnd).toEqual(periodEnd);
    });
  });

  describe('activityCalendar', () => {
    it('should return activity calendar for a full year', async () => {
      const mockCalendar = [
        createMockCalendarDay(new Date('2024-01-01'), false),
        createMockCalendarDay(new Date('2024-01-02'), true),
        createMockCalendarDay(new Date('2024-01-03'), false),
      ];
      mockStatisticsService.getActivityCalendar.mockResolvedValue(mockCalendar);

      const result = await resolver.activityCalendar(mockTokenPayload, 2024);

      expect(statisticsService.getActivityCalendar).toHaveBeenCalledWith(mockTokenPayload.sub, 2024, undefined);
      expect(result).toEqual(mockCalendar);
    });

    it('should return activity calendar for a specific month', async () => {
      const mockCalendar = [
        createMockCalendarDay(new Date('2024-03-01'), true),
        createMockCalendarDay(new Date('2024-03-02'), false),
      ];
      mockStatisticsService.getActivityCalendar.mockResolvedValue(mockCalendar);

      const result = await resolver.activityCalendar(mockTokenPayload, 2024, 3);

      expect(statisticsService.getActivityCalendar).toHaveBeenCalledWith(mockTokenPayload.sub, 2024, 3);
      expect(result).toEqual(mockCalendar);
    });

    it('should pass correct user ID from token payload', async () => {
      const customTokenPayload: TokenPayload = {
        sub: 99,
        stravaId: 88888,
      };
      mockStatisticsService.getActivityCalendar.mockResolvedValue([]);

      await resolver.activityCalendar(customTokenPayload, 2024);

      expect(statisticsService.getActivityCalendar).toHaveBeenCalledWith(99, 2024, undefined);
    });

    it('should return empty array when no activities', async () => {
      const emptyCalendar: ActivityCalendarDay[] = [];
      mockStatisticsService.getActivityCalendar.mockResolvedValue(emptyCalendar);

      const result = await resolver.activityCalendar(mockTokenPayload, 2024, 6);

      expect(result).toEqual([]);
    });

    it('should call service exactly once per query', async () => {
      mockStatisticsService.getActivityCalendar.mockResolvedValue([]);

      await resolver.activityCalendar(mockTokenPayload, 2024, 12);

      expect(statisticsService.getActivityCalendar).toHaveBeenCalledTimes(1);
    });

    it('should propagate service errors', async () => {
      const error = new Error('Database connection failed');
      mockStatisticsService.getActivityCalendar.mockRejectedValue(error);

      await expect(resolver.activityCalendar(mockTokenPayload, 2024)).rejects.toThrow('Database connection failed');
    });

    it('should handle December (month 12) correctly', async () => {
      const mockCalendar = [createMockCalendarDay(new Date('2024-12-25'), true)];
      mockStatisticsService.getActivityCalendar.mockResolvedValue(mockCalendar);

      const result = await resolver.activityCalendar(mockTokenPayload, 2024, 12);

      expect(statisticsService.getActivityCalendar).toHaveBeenCalledWith(mockTokenPayload.sub, 2024, 12);
      expect(result).toEqual(mockCalendar);
    });

    it('should handle January (month 1) correctly', async () => {
      const mockCalendar = [createMockCalendarDay(new Date('2024-01-01'), true)];
      mockStatisticsService.getActivityCalendar.mockResolvedValue(mockCalendar);

      const result = await resolver.activityCalendar(mockTokenPayload, 2024, 1);

      expect(statisticsService.getActivityCalendar).toHaveBeenCalledWith(mockTokenPayload.sub, 2024, 1);
      expect(result).toEqual(mockCalendar);
    });
  });

  describe('sportDistribution', () => {
    const createMockSportDistribution = (
      sport: SportType,
      percentage: number,
      totalTime: number,
    ): SportDistribution => ({
      sport,
      percentage,
      totalTime,
    });

    it('should return sport distribution for current month', async () => {
      const mockDistribution = [
        createMockSportDistribution(SportType.RIDE, 60, 7200),
        createMockSportDistribution(SportType.RUN, 40, 4800),
      ];
      mockStatisticsService.getSportDistribution.mockResolvedValue(mockDistribution);

      const result = await resolver.sportDistribution(mockTokenPayload);

      expect(statisticsService.getSportDistribution).toHaveBeenCalledWith(mockTokenPayload.sub);
      expect(result).toEqual(mockDistribution);
    });

    it('should pass correct user ID from token payload', async () => {
      const customTokenPayload: TokenPayload = {
        sub: 77,
        stravaId: 55555,
      };
      mockStatisticsService.getSportDistribution.mockResolvedValue([]);

      await resolver.sportDistribution(customTokenPayload);

      expect(statisticsService.getSportDistribution).toHaveBeenCalledWith(77);
    });

    it('should return empty array when no activities', async () => {
      mockStatisticsService.getSportDistribution.mockResolvedValue([]);

      const result = await resolver.sportDistribution(mockTokenPayload);

      expect(result).toEqual([]);
    });

    it('should return single sport distribution', async () => {
      const mockDistribution = [createMockSportDistribution(SportType.SWIM, 100, 3600)];
      mockStatisticsService.getSportDistribution.mockResolvedValue(mockDistribution);

      const result = await resolver.sportDistribution(mockTokenPayload);

      expect(result).toHaveLength(1);
      expect(result[0].sport).toBe(SportType.SWIM);
      expect(result[0].percentage).toBe(100);
    });

    it('should call service exactly once per query', async () => {
      mockStatisticsService.getSportDistribution.mockResolvedValue([]);

      await resolver.sportDistribution(mockTokenPayload);

      expect(statisticsService.getSportDistribution).toHaveBeenCalledTimes(1);
    });

    it('should propagate service errors', async () => {
      const error = new Error('Database connection failed');
      mockStatisticsService.getSportDistribution.mockRejectedValue(error);

      await expect(resolver.sportDistribution(mockTokenPayload)).rejects.toThrow('Database connection failed');
    });
  });

  describe('sportPeriodStatistics', () => {
    const createMockSportPeriodStatistics = (overrides?: Partial<SportPeriodStatistics>): SportPeriodStatistics => ({
      totalDistance: 42195,
      totalDuration: 14400,
      activityCount: 5,
      totalElevation: 850,
      distanceTrend: 12.5,
      durationTrend: 8.2,
      activityTrend: 25.0,
      elevationTrend: -5.3,
      ...overrides,
    });

    it('should return sport period statistics for RUN/WEEK', async () => {
      const mockStats = createMockSportPeriodStatistics();
      mockStatisticsService.getSportPeriodStatistics.mockResolvedValue(mockStats);

      const result = await resolver.sportPeriodStatistics(mockTokenPayload, SportType.RUN, StatisticsPeriod.WEEK);

      expect(statisticsService.getSportPeriodStatistics).toHaveBeenCalledWith(
        mockTokenPayload.sub,
        SportType.RUN,
        StatisticsPeriod.WEEK,
      );
      expect(result).toEqual(mockStats);
    });

    it('should return sport period statistics for RIDE/MONTH', async () => {
      const mockStats = createMockSportPeriodStatistics({
        totalDistance: 150000,
        totalDuration: 36000,
        activityCount: 8,
        totalElevation: 2500,
      });
      mockStatisticsService.getSportPeriodStatistics.mockResolvedValue(mockStats);

      const result = await resolver.sportPeriodStatistics(mockTokenPayload, SportType.RIDE, StatisticsPeriod.MONTH);

      expect(statisticsService.getSportPeriodStatistics).toHaveBeenCalledWith(
        mockTokenPayload.sub,
        SportType.RIDE,
        StatisticsPeriod.MONTH,
      );
      expect(result).toEqual(mockStats);
    });

    it('should return sport period statistics for SWIM/YEAR', async () => {
      const mockStats = createMockSportPeriodStatistics({
        totalDistance: 50000,
        totalDuration: 72000,
        activityCount: 50,
        totalElevation: 0,
      });
      mockStatisticsService.getSportPeriodStatistics.mockResolvedValue(mockStats);

      const result = await resolver.sportPeriodStatistics(mockTokenPayload, SportType.SWIM, StatisticsPeriod.YEAR);

      expect(statisticsService.getSportPeriodStatistics).toHaveBeenCalledWith(
        mockTokenPayload.sub,
        SportType.SWIM,
        StatisticsPeriod.YEAR,
      );
      expect(result).toEqual(mockStats);
    });

    it('should pass correct user ID from token payload', async () => {
      const customTokenPayload: TokenPayload = {
        sub: 42,
        stravaId: 99999,
      };
      const mockStats = createMockSportPeriodStatistics();
      mockStatisticsService.getSportPeriodStatistics.mockResolvedValue(mockStats);

      await resolver.sportPeriodStatistics(customTokenPayload, SportType.RUN, StatisticsPeriod.WEEK);

      expect(statisticsService.getSportPeriodStatistics).toHaveBeenCalledWith(42, SportType.RUN, StatisticsPeriod.WEEK);
    });

    it('should handle null trends', async () => {
      const mockStats = createMockSportPeriodStatistics({
        distanceTrend: undefined,
        durationTrend: undefined,
        activityTrend: undefined,
        elevationTrend: undefined,
      });
      mockStatisticsService.getSportPeriodStatistics.mockResolvedValue(mockStats);

      const result = await resolver.sportPeriodStatistics(mockTokenPayload, SportType.RUN, StatisticsPeriod.WEEK);

      expect(result.distanceTrend).toBeUndefined();
      expect(result.durationTrend).toBeUndefined();
      expect(result.activityTrend).toBeUndefined();
      expect(result.elevationTrend).toBeUndefined();
    });

    it('should handle zero stats (no activities)', async () => {
      const mockStats = createMockSportPeriodStatistics({
        totalDistance: 0,
        totalDuration: 0,
        activityCount: 0,
        totalElevation: 0,
      });
      mockStatisticsService.getSportPeriodStatistics.mockResolvedValue(mockStats);

      const result = await resolver.sportPeriodStatistics(mockTokenPayload, SportType.RUN, StatisticsPeriod.WEEK);

      expect(result.totalDistance).toBe(0);
      expect(result.totalDuration).toBe(0);
      expect(result.activityCount).toBe(0);
      expect(result.totalElevation).toBe(0);
    });

    it('should call service exactly once per query', async () => {
      const mockStats = createMockSportPeriodStatistics();
      mockStatisticsService.getSportPeriodStatistics.mockResolvedValue(mockStats);

      await resolver.sportPeriodStatistics(mockTokenPayload, SportType.RUN, StatisticsPeriod.MONTH);

      expect(statisticsService.getSportPeriodStatistics).toHaveBeenCalledTimes(1);
    });

    it('should propagate service errors', async () => {
      const error = new Error('Database connection failed');
      mockStatisticsService.getSportPeriodStatistics.mockRejectedValue(error);

      await expect(
        resolver.sportPeriodStatistics(mockTokenPayload, SportType.RUN, StatisticsPeriod.WEEK),
      ).rejects.toThrow('Database connection failed');
    });
  });

  describe('sportProgressionData', () => {
    const createMockProgressionDataPoint = (
      index: number,
      value: number,
      intervalType: IntervalType = IntervalType.DAY,
    ): ProgressionDataPoint => ({
      index,
      intervalType,
      value,
    });

    it('should return progression data for RUN/WEEK/DISTANCE', async () => {
      const mockData = [
        createMockProgressionDataPoint(0, 5000),
        createMockProgressionDataPoint(1, 0),
        createMockProgressionDataPoint(2, 10000),
        createMockProgressionDataPoint(3, 0),
        createMockProgressionDataPoint(4, 8000),
        createMockProgressionDataPoint(5, 0),
        createMockProgressionDataPoint(6, 12000),
      ];
      mockStatisticsService.getSportProgressionData.mockResolvedValue(mockData);

      const result = await resolver.sportProgressionData(
        mockTokenPayload,
        SportType.RUN,
        StatisticsPeriod.WEEK,
        ProgressionMetric.DISTANCE,
      );

      expect(statisticsService.getSportProgressionData).toHaveBeenCalledWith(
        mockTokenPayload.sub,
        SportType.RUN,
        StatisticsPeriod.WEEK,
        ProgressionMetric.DISTANCE,
      );
      expect(result).toEqual(mockData);
    });

    it('should return progression data for RIDE/MONTH/SPEED', async () => {
      const mockData = [
        createMockProgressionDataPoint(1, 25.5, IntervalType.WEEK),
        createMockProgressionDataPoint(2, 27.2, IntervalType.WEEK),
        createMockProgressionDataPoint(3, 26.8, IntervalType.WEEK),
        createMockProgressionDataPoint(4, 28.0, IntervalType.WEEK),
      ];
      mockStatisticsService.getSportProgressionData.mockResolvedValue(mockData);

      const result = await resolver.sportProgressionData(
        mockTokenPayload,
        SportType.RIDE,
        StatisticsPeriod.MONTH,
        ProgressionMetric.SPEED,
      );

      expect(statisticsService.getSportProgressionData).toHaveBeenCalledWith(
        mockTokenPayload.sub,
        SportType.RIDE,
        StatisticsPeriod.MONTH,
        ProgressionMetric.SPEED,
      );
      expect(result).toEqual(mockData);
    });

    it('should return progression data for SWIM/YEAR/SESSIONS', async () => {
      const mockData = Array.from({ length: 12 }, (_, i) =>
        createMockProgressionDataPoint(i, i + 2, IntervalType.MONTH),
      );
      mockStatisticsService.getSportProgressionData.mockResolvedValue(mockData);

      const result = await resolver.sportProgressionData(
        mockTokenPayload,
        SportType.SWIM,
        StatisticsPeriod.YEAR,
        ProgressionMetric.SESSIONS,
      );

      expect(statisticsService.getSportProgressionData).toHaveBeenCalledWith(
        mockTokenPayload.sub,
        SportType.SWIM,
        StatisticsPeriod.YEAR,
        ProgressionMetric.SESSIONS,
      );
      expect(result).toHaveLength(12);
    });

    it('should pass correct user ID from token payload', async () => {
      const customTokenPayload: TokenPayload = {
        sub: 55,
        stravaId: 77777,
      };
      mockStatisticsService.getSportProgressionData.mockResolvedValue([]);

      await resolver.sportProgressionData(
        customTokenPayload,
        SportType.RUN,
        StatisticsPeriod.WEEK,
        ProgressionMetric.DISTANCE,
      );

      expect(statisticsService.getSportProgressionData).toHaveBeenCalledWith(
        55,
        SportType.RUN,
        StatisticsPeriod.WEEK,
        ProgressionMetric.DISTANCE,
      );
    });

    it('should return empty array when no data', async () => {
      mockStatisticsService.getSportProgressionData.mockResolvedValue([]);

      const result = await resolver.sportProgressionData(
        mockTokenPayload,
        SportType.RUN,
        StatisticsPeriod.WEEK,
        ProgressionMetric.DISTANCE,
      );

      expect(result).toEqual([]);
    });

    it('should call service exactly once per query', async () => {
      mockStatisticsService.getSportProgressionData.mockResolvedValue([]);

      await resolver.sportProgressionData(
        mockTokenPayload,
        SportType.RUN,
        StatisticsPeriod.WEEK,
        ProgressionMetric.DISTANCE,
      );

      expect(statisticsService.getSportProgressionData).toHaveBeenCalledTimes(1);
    });

    it('should propagate service errors', async () => {
      const error = new Error('Database connection failed');
      mockStatisticsService.getSportProgressionData.mockRejectedValue(error);

      await expect(
        resolver.sportProgressionData(
          mockTokenPayload,
          SportType.RUN,
          StatisticsPeriod.WEEK,
          ProgressionMetric.DISTANCE,
        ),
      ).rejects.toThrow('Database connection failed');
    });

    it('should verify all parameters passed to service', async () => {
      mockStatisticsService.getSportProgressionData.mockResolvedValue([]);

      await resolver.sportProgressionData(
        mockTokenPayload,
        SportType.RIDE,
        StatisticsPeriod.YEAR,
        ProgressionMetric.ELEVATION,
      );

      expect(statisticsService.getSportProgressionData).toHaveBeenCalledWith(
        mockTokenPayload.sub,
        SportType.RIDE,
        StatisticsPeriod.YEAR,
        ProgressionMetric.ELEVATION,
      );
    });
  });

  describe('sportAverageMetrics', () => {
    const createMockSportAverageMetrics = (overrides?: Partial<SportAverageMetrics>): SportAverageMetrics => ({
      averagePace: 300,
      averageSpeed: undefined,
      averageHeartRate: 155,
      averageCadence: 172,
      averagePower: undefined,
      ...overrides,
    });

    it('should return average metrics for RUN (with pace)', async () => {
      const mockMetrics = createMockSportAverageMetrics();
      mockStatisticsService.getSportAverageMetrics.mockResolvedValue(mockMetrics);

      const result = await resolver.sportAverageMetrics(mockTokenPayload, SportType.RUN, StatisticsPeriod.MONTH);

      expect(statisticsService.getSportAverageMetrics).toHaveBeenCalledWith(
        mockTokenPayload.sub,
        SportType.RUN,
        StatisticsPeriod.MONTH,
      );
      expect(result).toEqual(mockMetrics);
      expect(result.averagePace).toBe(300);
    });

    it('should return average metrics for RIDE (with speed/power)', async () => {
      const mockMetrics = createMockSportAverageMetrics({
        averagePace: undefined,
        averageSpeed: 8.5,
        averagePower: 220,
      });
      mockStatisticsService.getSportAverageMetrics.mockResolvedValue(mockMetrics);

      const result = await resolver.sportAverageMetrics(mockTokenPayload, SportType.RIDE, StatisticsPeriod.MONTH);

      expect(statisticsService.getSportAverageMetrics).toHaveBeenCalledWith(
        mockTokenPayload.sub,
        SportType.RIDE,
        StatisticsPeriod.MONTH,
      );
      expect(result.averageSpeed).toBe(8.5);
      expect(result.averagePower).toBe(220);
    });

    it('should return average metrics for SWIM', async () => {
      const mockMetrics = createMockSportAverageMetrics({
        averagePace: 120,
        averageSpeed: undefined,
        averageCadence: 28,
        averagePower: undefined,
      });
      mockStatisticsService.getSportAverageMetrics.mockResolvedValue(mockMetrics);

      const result = await resolver.sportAverageMetrics(mockTokenPayload, SportType.SWIM, StatisticsPeriod.WEEK);

      expect(statisticsService.getSportAverageMetrics).toHaveBeenCalledWith(
        mockTokenPayload.sub,
        SportType.SWIM,
        StatisticsPeriod.WEEK,
      );
      expect(result).toEqual(mockMetrics);
    });

    it('should pass correct user ID from token payload', async () => {
      const customTokenPayload: TokenPayload = {
        sub: 88,
        stravaId: 66666,
      };
      const mockMetrics = createMockSportAverageMetrics();
      mockStatisticsService.getSportAverageMetrics.mockResolvedValue(mockMetrics);

      await resolver.sportAverageMetrics(customTokenPayload, SportType.RUN, StatisticsPeriod.MONTH);

      expect(statisticsService.getSportAverageMetrics).toHaveBeenCalledWith(88, SportType.RUN, StatisticsPeriod.MONTH);
    });

    it('should handle all metrics being null (no data)', async () => {
      const mockMetrics = createMockSportAverageMetrics({
        averagePace: undefined,
        averageSpeed: undefined,
        averageHeartRate: undefined,
        averageCadence: undefined,
        averagePower: undefined,
      });
      mockStatisticsService.getSportAverageMetrics.mockResolvedValue(mockMetrics);

      const result = await resolver.sportAverageMetrics(mockTokenPayload, SportType.RUN, StatisticsPeriod.WEEK);

      expect(result.averagePace).toBeUndefined();
      expect(result.averageSpeed).toBeUndefined();
      expect(result.averageHeartRate).toBeUndefined();
      expect(result.averageCadence).toBeUndefined();
      expect(result.averagePower).toBeUndefined();
    });

    it('should call service exactly once per query', async () => {
      const mockMetrics = createMockSportAverageMetrics();
      mockStatisticsService.getSportAverageMetrics.mockResolvedValue(mockMetrics);

      await resolver.sportAverageMetrics(mockTokenPayload, SportType.RUN, StatisticsPeriod.MONTH);

      expect(statisticsService.getSportAverageMetrics).toHaveBeenCalledTimes(1);
    });

    it('should propagate service errors', async () => {
      const error = new Error('Database connection failed');
      mockStatisticsService.getSportAverageMetrics.mockRejectedValue(error);

      await expect(
        resolver.sportAverageMetrics(mockTokenPayload, SportType.RUN, StatisticsPeriod.WEEK),
      ).rejects.toThrow('Database connection failed');
    });

    it('should handle different periods correctly', async () => {
      const mockMetrics = createMockSportAverageMetrics();
      mockStatisticsService.getSportAverageMetrics.mockResolvedValue(mockMetrics);

      await resolver.sportAverageMetrics(mockTokenPayload, SportType.RUN, StatisticsPeriod.YEAR);

      expect(statisticsService.getSportAverageMetrics).toHaveBeenCalledWith(
        mockTokenPayload.sub,
        SportType.RUN,
        StatisticsPeriod.YEAR,
      );
    });
  });

  describe('personalRecords', () => {
    const createMockPersonalRecord = (type: string, value: number, activityId: string): PersonalRecord => ({
      type,
      value,
      achievedAt: new Date('2025-01-15'),
      activityId,
    });

    it('should return personal records for RUN', async () => {
      const mockRecords = [
        createMockPersonalRecord('longest_distance', 42195, '12345'),
        createMockPersonalRecord('best_pace', 240, '12346'),
        createMockPersonalRecord('longest_duration', 14400, '12345'),
      ];
      mockStatisticsService.getPersonalRecords.mockResolvedValue(mockRecords);

      const result = await resolver.personalRecords(mockTokenPayload, SportType.RUN);

      expect(statisticsService.getPersonalRecords).toHaveBeenCalledWith(mockTokenPayload.sub, SportType.RUN);
      expect(result).toEqual(mockRecords);
    });

    it('should return personal records for RIDE', async () => {
      const mockRecords = [
        createMockPersonalRecord('longest_distance', 150000, '22345'),
        createMockPersonalRecord('best_speed', 15.5, '22346'),
        createMockPersonalRecord('highest_elevation', 2500, '22347'),
      ];
      mockStatisticsService.getPersonalRecords.mockResolvedValue(mockRecords);

      const result = await resolver.personalRecords(mockTokenPayload, SportType.RIDE);

      expect(statisticsService.getPersonalRecords).toHaveBeenCalledWith(mockTokenPayload.sub, SportType.RIDE);
      expect(result).toEqual(mockRecords);
    });

    it('should return personal records for SWIM', async () => {
      const mockRecords = [
        createMockPersonalRecord('longest_distance', 5000, '32345'),
        createMockPersonalRecord('best_pace', 90, '32346'),
      ];
      mockStatisticsService.getPersonalRecords.mockResolvedValue(mockRecords);

      const result = await resolver.personalRecords(mockTokenPayload, SportType.SWIM);

      expect(statisticsService.getPersonalRecords).toHaveBeenCalledWith(mockTokenPayload.sub, SportType.SWIM);
      expect(result).toEqual(mockRecords);
    });

    it('should pass correct user ID from token payload', async () => {
      const customTokenPayload: TokenPayload = {
        sub: 33,
        stravaId: 44444,
      };
      mockStatisticsService.getPersonalRecords.mockResolvedValue([]);

      await resolver.personalRecords(customTokenPayload, SportType.RUN);

      expect(statisticsService.getPersonalRecords).toHaveBeenCalledWith(33, SportType.RUN);
    });

    it('should return empty array when no records', async () => {
      mockStatisticsService.getPersonalRecords.mockResolvedValue([]);

      const result = await resolver.personalRecords(mockTokenPayload, SportType.SWIM);

      expect(result).toEqual([]);
    });

    it('should call service exactly once per query', async () => {
      mockStatisticsService.getPersonalRecords.mockResolvedValue([]);

      await resolver.personalRecords(mockTokenPayload, SportType.RUN);

      expect(statisticsService.getPersonalRecords).toHaveBeenCalledTimes(1);
    });

    it('should propagate service errors', async () => {
      const error = new Error('Database connection failed');
      mockStatisticsService.getPersonalRecords.mockRejectedValue(error);

      await expect(resolver.personalRecords(mockTokenPayload, SportType.RUN)).rejects.toThrow(
        'Database connection failed',
      );
    });

    it('should return records with correct date format', async () => {
      const achievedAt = new Date('2025-01-20T14:30:00.000Z');
      const mockRecords = [
        {
          type: 'longest_distance',
          value: 42195,
          achievedAt,
          activityId: '12345',
        },
      ];
      mockStatisticsService.getPersonalRecords.mockResolvedValue(mockRecords);

      const result = await resolver.personalRecords(mockTokenPayload, SportType.RUN);

      expect(result[0].achievedAt).toEqual(achievedAt);
    });
  });
});
