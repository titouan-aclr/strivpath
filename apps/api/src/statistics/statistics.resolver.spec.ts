import { Test, TestingModule } from '@nestjs/testing';
import { StatisticsResolver } from './statistics.resolver';
import { StatisticsService } from './statistics.service';
import { TokenPayload } from '../auth/types/token-payload.interface';
import { StatisticsPeriod } from './enums/statistics-period.enum';
import { PeriodStatistics } from './models/period-statistics.model';

describe('StatisticsResolver', () => {
  let resolver: StatisticsResolver;
  let statisticsService: jest.Mocked<StatisticsService>;

  const mockStatisticsService = {
    getPeriodStatistics: jest.fn(),
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
});
