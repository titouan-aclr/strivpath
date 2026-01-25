import { Test, TestingModule } from '@nestjs/testing';
import { StatisticsService } from './statistics.service';
import { PrismaService } from '../database/prisma.service';
import { StatisticsPeriod } from './enums/statistics-period.enum';

const createMockPrismaService = () => ({
  activity: {
    aggregate: jest.fn(),
  },
});

describe('StatisticsService', () => {
  let service: StatisticsService;
  let prisma: ReturnType<typeof createMockPrismaService>;

  beforeEach(async () => {
    const mockPrisma = createMockPrismaService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [StatisticsService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    service = module.get<StatisticsService>(StatisticsService);
    prisma = module.get(PrismaService) as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getPeriodStatistics', () => {
    const userId = 42;

    describe('data aggregation', () => {
      it('should return correct statistics with activities', async () => {
        prisma.activity.aggregate.mockResolvedValue({
          _sum: { movingTime: 7200 },
          _count: 3,
        });

        const result = await service.getPeriodStatistics(userId, StatisticsPeriod.WEEK);

        expect(result.totalTime).toBe(7200);
        expect(result.activityCount).toBe(3);
        expect(result.averageTimePerSession).toBe(2400);
      });

      it('should handle zero activities with null movingTime', async () => {
        prisma.activity.aggregate.mockResolvedValue({
          _sum: { movingTime: null },
          _count: 0,
        });

        const result = await service.getPeriodStatistics(userId, StatisticsPeriod.WEEK);

        expect(result.totalTime).toBe(0);
        expect(result.activityCount).toBe(0);
        expect(result.averageTimePerSession).toBe(0);
      });

      it('should handle single activity correctly', async () => {
        prisma.activity.aggregate.mockResolvedValue({
          _sum: { movingTime: 3600 },
          _count: 1,
        });

        const result = await service.getPeriodStatistics(userId, StatisticsPeriod.MONTH);

        expect(result.totalTime).toBe(3600);
        expect(result.activityCount).toBe(1);
        expect(result.averageTimePerSession).toBe(3600);
      });

      it('should handle large number of activities', async () => {
        prisma.activity.aggregate.mockResolvedValue({
          _sum: { movingTime: 3600000 },
          _count: 1000,
        });

        const result = await service.getPeriodStatistics(userId, StatisticsPeriod.YEAR);

        expect(result.totalTime).toBe(3600000);
        expect(result.activityCount).toBe(1000);
        expect(result.averageTimePerSession).toBe(3600);
      });

      it('should calculate fractional average correctly', async () => {
        prisma.activity.aggregate.mockResolvedValue({
          _sum: { movingTime: 10000 },
          _count: 3,
        });

        const result = await service.getPeriodStatistics(userId, StatisticsPeriod.MONTH);

        expect(result.averageTimePerSession).toBeCloseTo(3333.33, 1);
      });

      it('should pass correct userId to Prisma query', async () => {
        const specificUserId = 12345;
        prisma.activity.aggregate.mockResolvedValue({
          _sum: { movingTime: 0 },
          _count: 0,
        });

        await service.getPeriodStatistics(specificUserId, StatisticsPeriod.WEEK);

        expect(prisma.activity.aggregate).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              userId: specificUserId,
            }),
          }),
        );
      });
    });

    describe('WEEK period calculations', () => {
      it('should set period start to Monday at 00:00:00', async () => {
        prisma.activity.aggregate.mockResolvedValue({
          _sum: { movingTime: 0 },
          _count: 0,
        });

        const result = await service.getPeriodStatistics(userId, StatisticsPeriod.WEEK);

        expect(result.periodStart.getDay()).toBe(1);
        expect(result.periodStart.getHours()).toBe(0);
        expect(result.periodStart.getMinutes()).toBe(0);
        expect(result.periodStart.getSeconds()).toBe(0);
        expect(result.periodStart.getMilliseconds()).toBe(0);
      });

      it('should set period end to Sunday at 23:59:59.999', async () => {
        prisma.activity.aggregate.mockResolvedValue({
          _sum: { movingTime: 0 },
          _count: 0,
        });

        const result = await service.getPeriodStatistics(userId, StatisticsPeriod.WEEK);

        expect(result.periodEnd.getDay()).toBe(0);
        expect(result.periodEnd.getHours()).toBe(23);
        expect(result.periodEnd.getMinutes()).toBe(59);
        expect(result.periodEnd.getSeconds()).toBe(59);
        expect(result.periodEnd.getMilliseconds()).toBe(999);
      });

      it('should query Prisma with correct WEEK date boundaries', async () => {
        prisma.activity.aggregate.mockResolvedValue({
          _sum: { movingTime: 0 },
          _count: 0,
        });

        await service.getPeriodStatistics(userId, StatisticsPeriod.WEEK);

        const callArg = prisma.activity.aggregate.mock.calls[0][0];
        expect(callArg.where.startDate.gte.getDay()).toBe(1);
        expect(callArg.where.startDate.lte.getDay()).toBe(0);
      });
    });

    describe('MONTH period calculations', () => {
      it('should set period start to first day of month at 00:00:00', async () => {
        prisma.activity.aggregate.mockResolvedValue({
          _sum: { movingTime: 0 },
          _count: 0,
        });

        const result = await service.getPeriodStatistics(userId, StatisticsPeriod.MONTH);

        expect(result.periodStart.getDate()).toBe(1);
        expect(result.periodStart.getHours()).toBe(0);
        expect(result.periodStart.getMinutes()).toBe(0);
        expect(result.periodStart.getSeconds()).toBe(0);
      });

      it('should set period end to last day of month at 23:59:59.999', async () => {
        prisma.activity.aggregate.mockResolvedValue({
          _sum: { movingTime: 0 },
          _count: 0,
        });

        const result = await service.getPeriodStatistics(userId, StatisticsPeriod.MONTH);

        const lastDayOfMonth = new Date(result.periodEnd.getFullYear(), result.periodEnd.getMonth() + 1, 0).getDate();

        expect(result.periodEnd.getDate()).toBe(lastDayOfMonth);
        expect(result.periodEnd.getHours()).toBe(23);
        expect(result.periodEnd.getMinutes()).toBe(59);
        expect(result.periodEnd.getSeconds()).toBe(59);
        expect(result.periodEnd.getMilliseconds()).toBe(999);
      });

      it('should have same month for start and end dates', async () => {
        prisma.activity.aggregate.mockResolvedValue({
          _sum: { movingTime: 0 },
          _count: 0,
        });

        const result = await service.getPeriodStatistics(userId, StatisticsPeriod.MONTH);

        expect(result.periodStart.getMonth()).toBe(result.periodEnd.getMonth());
        expect(result.periodStart.getFullYear()).toBe(result.periodEnd.getFullYear());
      });
    });

    describe('YEAR period calculations', () => {
      it('should set period start to January 1st at 00:00:00', async () => {
        prisma.activity.aggregate.mockResolvedValue({
          _sum: { movingTime: 0 },
          _count: 0,
        });

        const result = await service.getPeriodStatistics(userId, StatisticsPeriod.YEAR);

        expect(result.periodStart.getMonth()).toBe(0);
        expect(result.periodStart.getDate()).toBe(1);
        expect(result.periodStart.getHours()).toBe(0);
        expect(result.periodStart.getMinutes()).toBe(0);
        expect(result.periodStart.getSeconds()).toBe(0);
      });

      it('should set period end to December 31st at 23:59:59.999', async () => {
        prisma.activity.aggregate.mockResolvedValue({
          _sum: { movingTime: 0 },
          _count: 0,
        });

        const result = await service.getPeriodStatistics(userId, StatisticsPeriod.YEAR);

        expect(result.periodEnd.getMonth()).toBe(11);
        expect(result.periodEnd.getDate()).toBe(31);
        expect(result.periodEnd.getHours()).toBe(23);
        expect(result.periodEnd.getMinutes()).toBe(59);
        expect(result.periodEnd.getSeconds()).toBe(59);
        expect(result.periodEnd.getMilliseconds()).toBe(999);
      });

      it('should have same year for start and end dates', async () => {
        prisma.activity.aggregate.mockResolvedValue({
          _sum: { movingTime: 0 },
          _count: 0,
        });

        const result = await service.getPeriodStatistics(userId, StatisticsPeriod.YEAR);
        const currentYear = new Date().getFullYear();

        expect(result.periodStart.getFullYear()).toBe(currentYear);
        expect(result.periodEnd.getFullYear()).toBe(currentYear);
      });
    });

    describe('Prisma query structure', () => {
      it('should call aggregate with correct structure', async () => {
        prisma.activity.aggregate.mockResolvedValue({
          _sum: { movingTime: 0 },
          _count: 0,
        });

        await service.getPeriodStatistics(userId, StatisticsPeriod.WEEK);

        expect(prisma.activity.aggregate).toHaveBeenCalledWith({
          where: {
            userId,
            startDate: {
              gte: expect.any(Date),
              lte: expect.any(Date),
            },
          },
          _sum: { movingTime: true },
          _count: true,
        });
      });

      it('should be called exactly once per getPeriodStatistics call', async () => {
        prisma.activity.aggregate.mockResolvedValue({
          _sum: { movingTime: 0 },
          _count: 0,
        });

        await service.getPeriodStatistics(userId, StatisticsPeriod.MONTH);

        expect(prisma.activity.aggregate).toHaveBeenCalledTimes(1);
      });
    });
  });
});
