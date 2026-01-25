import { Test, TestingModule } from '@nestjs/testing';
import { StatisticsResolver } from './statistics.resolver';
import { StatisticsService } from './statistics.service';
import { TokenPayload } from '../auth/types/token-payload.interface';
import { StatisticsPeriod } from './enums/statistics-period.enum';
import { PeriodStatistics } from './models/period-statistics.model';
import { ActivityCalendarDay } from './models/activity-calendar-day.model';

describe('StatisticsResolver', () => {
  let resolver: StatisticsResolver;
  let statisticsService: jest.Mocked<StatisticsService>;

  const mockStatisticsService = {
    getPeriodStatistics: jest.fn(),
    getActivityCalendar: jest.fn(),
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
});
