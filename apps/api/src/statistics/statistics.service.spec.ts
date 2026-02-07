import { Test, TestingModule } from '@nestjs/testing';
import { StatisticsService } from './statistics.service';
import { PrismaService } from '../database/prisma.service';
import { StatisticsPeriod } from './enums/statistics-period.enum';
import { ProgressionMetric } from './enums/progression-metric.enum';
import { IntervalType } from './enums/interval-type.enum';
import { SportType } from '../user-preferences/enums/sport-type.enum';

const createMockPrismaService = () => ({
  activity: {
    aggregate: jest.fn(),
    findMany: jest.fn(),
    groupBy: jest.fn(),
    findFirst: jest.fn(),
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

  describe('getActivityCalendar', () => {
    const userId = 42;

    describe('full year calendar', () => {
      it('should return all days of the year', async () => {
        prisma.activity.findMany.mockResolvedValue([]);

        const result = await service.getActivityCalendar(userId, 2024);

        expect(result.length).toBe(366);
        expect(result[0].date.getMonth()).toBe(0);
        expect(result[0].date.getDate()).toBe(1);
        expect(result[result.length - 1].date.getMonth()).toBe(11);
        expect(result[result.length - 1].date.getDate()).toBe(31);
      });

      it('should return 365 days for non-leap year', async () => {
        prisma.activity.findMany.mockResolvedValue([]);

        const result = await service.getActivityCalendar(userId, 2023);

        expect(result.length).toBe(365);
      });

      it('should mark days with activities as hasActivity true', async () => {
        prisma.activity.findMany.mockResolvedValue([
          { startDate: new Date('2024-03-15T10:00:00Z') },
          { startDate: new Date('2024-06-20T14:30:00Z') },
        ]);

        const result = await service.getActivityCalendar(userId, 2024);

        const march15 = result.find(day => day.date.getMonth() === 2 && day.date.getDate() === 15);
        const june20 = result.find(day => day.date.getMonth() === 5 && day.date.getDate() === 20);
        const january1 = result.find(day => day.date.getMonth() === 0 && day.date.getDate() === 1);

        expect(march15?.hasActivity).toBe(true);
        expect(june20?.hasActivity).toBe(true);
        expect(january1?.hasActivity).toBe(false);
      });

      it('should handle multiple activities on same day', async () => {
        prisma.activity.findMany.mockResolvedValue([
          { startDate: new Date('2024-05-10T08:00:00Z') },
          { startDate: new Date('2024-05-10T18:00:00Z') },
        ]);

        const result = await service.getActivityCalendar(userId, 2024);

        const may10 = result.find(day => day.date.getMonth() === 4 && day.date.getDate() === 10);

        expect(may10?.hasActivity).toBe(true);
      });

      it('should query Prisma with correct year boundaries', async () => {
        prisma.activity.findMany.mockResolvedValue([]);

        await service.getActivityCalendar(userId, 2024);

        expect(prisma.activity.findMany).toHaveBeenCalledWith({
          where: {
            userId,
            startDate: {
              gte: expect.any(Date),
              lte: expect.any(Date),
            },
          },
          select: { startDate: true },
        });

        const callArg = prisma.activity.findMany.mock.calls[0][0];
        expect(callArg.where.startDate.gte.getUTCFullYear()).toBe(2024);
        expect(callArg.where.startDate.gte.getUTCMonth()).toBe(0);
        expect(callArg.where.startDate.gte.getUTCDate()).toBe(1);
        expect(callArg.where.startDate.lte.getUTCFullYear()).toBe(2024);
        expect(callArg.where.startDate.lte.getUTCMonth()).toBe(11);
        expect(callArg.where.startDate.lte.getUTCDate()).toBe(31);
      });
    });

    describe('specific month calendar', () => {
      it('should return correct number of days for January (31 days)', async () => {
        prisma.activity.findMany.mockResolvedValue([]);

        const result = await service.getActivityCalendar(userId, 2024, 1);

        expect(result.length).toBe(31);
        expect(result[0].date.getMonth()).toBe(0);
        expect(result[0].date.getDate()).toBe(1);
        expect(result[30].date.getDate()).toBe(31);
      });

      it('should return correct number of days for February in leap year (29 days)', async () => {
        prisma.activity.findMany.mockResolvedValue([]);

        const result = await service.getActivityCalendar(userId, 2024, 2);

        expect(result.length).toBe(29);
      });

      it('should return correct number of days for February in non-leap year (28 days)', async () => {
        prisma.activity.findMany.mockResolvedValue([]);

        const result = await service.getActivityCalendar(userId, 2023, 2);

        expect(result.length).toBe(28);
      });

      it('should return correct number of days for April (30 days)', async () => {
        prisma.activity.findMany.mockResolvedValue([]);

        const result = await service.getActivityCalendar(userId, 2024, 4);

        expect(result.length).toBe(30);
      });

      it('should mark activities correctly within month', async () => {
        prisma.activity.findMany.mockResolvedValue([
          { startDate: new Date('2024-07-04T12:00:00Z') },
          { startDate: new Date('2024-07-25T09:00:00Z') },
        ]);

        const result = await service.getActivityCalendar(userId, 2024, 7);

        const july4 = result.find(day => day.date.getDate() === 4);
        const july25 = result.find(day => day.date.getDate() === 25);
        const july1 = result.find(day => day.date.getDate() === 1);

        expect(july4?.hasActivity).toBe(true);
        expect(july25?.hasActivity).toBe(true);
        expect(july1?.hasActivity).toBe(false);
      });

      it('should query Prisma with correct month boundaries', async () => {
        prisma.activity.findMany.mockResolvedValue([]);

        await service.getActivityCalendar(userId, 2024, 3);

        const callArg = prisma.activity.findMany.mock.calls[0][0];
        expect(callArg.where.startDate.gte.getUTCMonth()).toBe(2);
        expect(callArg.where.startDate.gte.getUTCDate()).toBe(1);
        expect(callArg.where.startDate.lte.getUTCMonth()).toBe(2);
        expect(callArg.where.startDate.lte.getUTCDate()).toBe(31);
      });

      it('should query with correct boundaries for December', async () => {
        prisma.activity.findMany.mockResolvedValue([]);

        await service.getActivityCalendar(userId, 2024, 12);

        const callArg = prisma.activity.findMany.mock.calls[0][0];
        expect(callArg.where.startDate.gte.getUTCMonth()).toBe(11);
        expect(callArg.where.startDate.lte.getUTCMonth()).toBe(11);
      });
    });

    describe('edge cases', () => {
      it('should handle empty activities array', async () => {
        prisma.activity.findMany.mockResolvedValue([]);

        const result = await service.getActivityCalendar(userId, 2024, 1);

        expect(result.every(day => day.hasActivity === false)).toBe(true);
      });

      it('should handle activities spanning entire month', async () => {
        const activities = Array.from({ length: 31 }, (_, i) => ({
          startDate: new Date(`2024-01-${String(i + 1).padStart(2, '0')}T10:00:00Z`),
        }));
        prisma.activity.findMany.mockResolvedValue(activities);

        const result = await service.getActivityCalendar(userId, 2024, 1);

        expect(result.every(day => day.hasActivity === true)).toBe(true);
      });

      it('should pass correct userId to Prisma query', async () => {
        const specificUserId = 99999;
        prisma.activity.findMany.mockResolvedValue([]);

        await service.getActivityCalendar(specificUserId, 2024);

        expect(prisma.activity.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              userId: specificUserId,
            }),
          }),
        );
      });

      it('should return dates in chronological order', async () => {
        prisma.activity.findMany.mockResolvedValue([]);

        const result = await service.getActivityCalendar(userId, 2024, 6);

        for (let i = 1; i < result.length; i++) {
          expect(result[i].date.getTime()).toBeGreaterThan(result[i - 1].date.getTime());
        }
      });

      it('should set correct time boundaries for query (start at 00:00:00 UTC)', async () => {
        prisma.activity.findMany.mockResolvedValue([]);

        await service.getActivityCalendar(userId, 2024, 1);

        const callArg = prisma.activity.findMany.mock.calls[0][0];
        expect(callArg.where.startDate.gte.getUTCHours()).toBe(0);
        expect(callArg.where.startDate.gte.getUTCMinutes()).toBe(0);
        expect(callArg.where.startDate.gte.getUTCSeconds()).toBe(0);
      });

      it('should set correct time boundaries for query (end at 23:59:59 UTC)', async () => {
        prisma.activity.findMany.mockResolvedValue([]);

        await service.getActivityCalendar(userId, 2024, 1);

        const callArg = prisma.activity.findMany.mock.calls[0][0];
        expect(callArg.where.startDate.lte.getUTCHours()).toBe(23);
        expect(callArg.where.startDate.lte.getUTCMinutes()).toBe(59);
        expect(callArg.where.startDate.lte.getUTCSeconds()).toBe(59);
      });
    });
  });

  describe('getSportDistribution', () => {
    const userId = 42;

    describe('data aggregation', () => {
      it('should return distribution for multiple sports', async () => {
        prisma.activity.groupBy.mockResolvedValue([
          { type: 'RUN', _sum: { movingTime: 3600 } },
          { type: 'RIDE', _sum: { movingTime: 7200 } },
        ]);

        const result = await service.getSportDistribution(userId);

        expect(result).toHaveLength(2);
        expect(result[0].sport).toBe('RIDE');
        expect(result[0].totalTime).toBe(7200);
        expect(result[1].sport).toBe('RUN');
        expect(result[1].totalTime).toBe(3600);
      });

      it('should calculate percentages correctly', async () => {
        prisma.activity.groupBy.mockResolvedValue([
          { type: 'RUN', _sum: { movingTime: 2500 } },
          { type: 'RIDE', _sum: { movingTime: 7500 } },
        ]);

        const result = await service.getSportDistribution(userId);

        expect(result[0].percentage).toBe(75);
        expect(result[1].percentage).toBe(25);
      });

      it('should return empty array when no activities', async () => {
        prisma.activity.groupBy.mockResolvedValue([]);

        const result = await service.getSportDistribution(userId);

        expect(result).toHaveLength(0);
      });

      it('should handle single sport correctly', async () => {
        prisma.activity.groupBy.mockResolvedValue([{ type: 'SWIM', _sum: { movingTime: 1800 } }]);

        const result = await service.getSportDistribution(userId);

        expect(result).toHaveLength(1);
        expect(result[0].sport).toBe('SWIM');
        expect(result[0].percentage).toBe(100);
        expect(result[0].totalTime).toBe(1800);
      });

      it('should sort results by totalTime descending', async () => {
        prisma.activity.groupBy.mockResolvedValue([
          { type: 'SWIM', _sum: { movingTime: 500 } },
          { type: 'RUN', _sum: { movingTime: 3000 } },
          { type: 'RIDE', _sum: { movingTime: 1500 } },
        ]);

        const result = await service.getSportDistribution(userId);

        expect(result[0].sport).toBe('RUN');
        expect(result[1].sport).toBe('RIDE');
        expect(result[2].sport).toBe('SWIM');
      });

      it('should handle all three sport types', async () => {
        prisma.activity.groupBy.mockResolvedValue([
          { type: 'RUN', _sum: { movingTime: 300 } },
          { type: 'RIDE', _sum: { movingTime: 400 } },
          { type: 'SWIM', _sum: { movingTime: 100 } },
        ]);

        const result = await service.getSportDistribution(userId);

        expect(result).toHaveLength(3);

        const runSport = result.find(r => r.sport === 'RUN');
        const rideSport = result.find(r => r.sport === 'RIDE');
        const swimSport = result.find(r => r.sport === 'SWIM');

        expect(runSport?.totalTime).toBe(300);
        expect(rideSport?.totalTime).toBe(400);
        expect(swimSport?.totalTime).toBe(100);
      });
    });

    describe('edge cases', () => {
      it('should ignore unknown activity types', async () => {
        prisma.activity.groupBy.mockResolvedValue([
          { type: 'RUN', _sum: { movingTime: 1000 } },
          { type: 'UNKNOWN', _sum: { movingTime: 500 } },
        ]);

        const result = await service.getSportDistribution(userId);

        expect(result).toHaveLength(1);
        expect(result[0].sport).toBe('RUN');
        expect(result[0].totalTime).toBe(1000);
        expect(result[0].percentage).toBe(100);
      });

      it('should handle null movingTime values', async () => {
        prisma.activity.groupBy.mockResolvedValue([
          { type: 'RUN', _sum: { movingTime: null } },
          { type: 'RIDE', _sum: { movingTime: 1000 } },
        ]);

        const result = await service.getSportDistribution(userId);

        expect(result).toHaveLength(2);
        const runSport = result.find(r => r.sport === 'RUN');
        expect(runSport?.totalTime).toBe(0);
      });

      it('should handle percentage rounding correctly', async () => {
        prisma.activity.groupBy.mockResolvedValue([
          { type: 'RUN', _sum: { movingTime: 1 } },
          { type: 'RIDE', _sum: { movingTime: 2 } },
        ]);

        const result = await service.getSportDistribution(userId);

        expect(result[0].percentage).toBe(66.67);
        expect(result[1].percentage).toBe(33.33);
      });

      it('should pass correct userId to Prisma query', async () => {
        const specificUserId = 99999;
        prisma.activity.groupBy.mockResolvedValue([]);

        await service.getSportDistribution(specificUserId);

        expect(prisma.activity.groupBy).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              userId: specificUserId,
            }),
          }),
        );
      });
    });

    describe('date boundaries', () => {
      it('should query current month only', async () => {
        prisma.activity.groupBy.mockResolvedValue([]);

        await service.getSportDistribution(userId);

        const callArg = prisma.activity.groupBy.mock.calls[0][0];
        const now = new Date();

        expect(callArg.where.startDate.gte.getMonth()).toBe(now.getMonth());
        expect(callArg.where.startDate.gte.getDate()).toBe(1);
        expect(callArg.where.startDate.lte.getMonth()).toBe(now.getMonth());
      });

      it('should set start date at 00:00:00', async () => {
        prisma.activity.groupBy.mockResolvedValue([]);

        await service.getSportDistribution(userId);

        const callArg = prisma.activity.groupBy.mock.calls[0][0];
        expect(callArg.where.startDate.gte.getHours()).toBe(0);
        expect(callArg.where.startDate.gte.getMinutes()).toBe(0);
        expect(callArg.where.startDate.gte.getSeconds()).toBe(0);
      });

      it('should set end date at 23:59:59', async () => {
        prisma.activity.groupBy.mockResolvedValue([]);

        await service.getSportDistribution(userId);

        const callArg = prisma.activity.groupBy.mock.calls[0][0];
        expect(callArg.where.startDate.lte.getHours()).toBe(23);
        expect(callArg.where.startDate.lte.getMinutes()).toBe(59);
        expect(callArg.where.startDate.lte.getSeconds()).toBe(59);
      });

      it('should query with groupBy type field', async () => {
        prisma.activity.groupBy.mockResolvedValue([]);

        await service.getSportDistribution(userId);

        expect(prisma.activity.groupBy).toHaveBeenCalledWith(
          expect.objectContaining({
            by: ['type'],
            _sum: { movingTime: true },
          }),
        );
      });
    });
  });

  describe('getSportPeriodStatistics', () => {
    const userId = 42;

    beforeEach(() => {
      prisma.activity.aggregate.mockResolvedValue({
        _sum: { distance: 0, movingTime: 0, totalElevationGain: 0 },
        _count: 0,
      });
    });

    describe('data aggregation', () => {
      it('should return correct statistics for RUN activities', async () => {
        prisma.activity.aggregate
          .mockResolvedValueOnce({
            _sum: { distance: 42000, movingTime: 14400, totalElevationGain: 500 },
            _count: 5,
          })
          .mockResolvedValueOnce({
            _sum: { distance: 35000, movingTime: 12000, totalElevationGain: 400 },
            _count: 4,
          });

        const result = await service.getSportPeriodStatistics(userId, SportType.RUN, StatisticsPeriod.WEEK);

        expect(result.totalDistance).toBe(42000);
        expect(result.totalDuration).toBe(14400);
        expect(result.activityCount).toBe(5);
        expect(result.totalElevation).toBe(500);
      });

      it('should filter by correct Strava types for RUN', async () => {
        await service.getSportPeriodStatistics(userId, SportType.RUN, StatisticsPeriod.WEEK);

        expect(prisma.activity.aggregate).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              type: { in: ['Run', 'TrailRun', 'VirtualRun'] },
            }),
          }),
        );
      });

      it('should filter by correct Strava types for RIDE', async () => {
        await service.getSportPeriodStatistics(userId, SportType.RIDE, StatisticsPeriod.MONTH);

        expect(prisma.activity.aggregate).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              type: { in: ['Ride', 'MountainBikeRide', 'VirtualRide', 'EBikeRide', 'EMountainBikeRide', 'Velomobile'] },
            }),
          }),
        );
      });

      it('should filter by correct Strava types for SWIM', async () => {
        await service.getSportPeriodStatistics(userId, SportType.SWIM, StatisticsPeriod.YEAR);

        expect(prisma.activity.aggregate).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              type: { in: ['Swim'] },
            }),
          }),
        );
      });

      it('should return zero values when no activities', async () => {
        prisma.activity.aggregate.mockResolvedValue({
          _sum: { distance: null, movingTime: null, totalElevationGain: null },
          _count: 0,
        });

        const result = await service.getSportPeriodStatistics(userId, SportType.RUN, StatisticsPeriod.WEEK);

        expect(result.totalDistance).toBe(0);
        expect(result.totalDuration).toBe(0);
        expect(result.activityCount).toBe(0);
        expect(result.totalElevation).toBe(0);
      });
    });

    describe('trend calculations', () => {
      it('should calculate positive trends correctly', async () => {
        prisma.activity.aggregate
          .mockResolvedValueOnce({
            _sum: { distance: 50000, movingTime: 18000, totalElevationGain: 600 },
            _count: 5,
          })
          .mockResolvedValueOnce({
            _sum: { distance: 40000, movingTime: 15000, totalElevationGain: 500 },
            _count: 4,
          });

        const result = await service.getSportPeriodStatistics(userId, SportType.RUN, StatisticsPeriod.WEEK);

        expect(result.distanceTrend).toBe(25);
        expect(result.durationTrend).toBe(20);
        expect(result.activityTrend).toBe(25);
        expect(result.elevationTrend).toBe(20);
      });

      it('should calculate negative trends correctly', async () => {
        prisma.activity.aggregate
          .mockResolvedValueOnce({
            _sum: { distance: 30000, movingTime: 10000, totalElevationGain: 300 },
            _count: 3,
          })
          .mockResolvedValueOnce({
            _sum: { distance: 40000, movingTime: 20000, totalElevationGain: 600 },
            _count: 6,
          });

        const result = await service.getSportPeriodStatistics(userId, SportType.RUN, StatisticsPeriod.WEEK);

        expect(result.distanceTrend).toBe(-25);
        expect(result.durationTrend).toBe(-50);
        expect(result.activityTrend).toBe(-50);
        expect(result.elevationTrend).toBe(-50);
      });

      it('should return undefined trends when previous period has zero values', async () => {
        prisma.activity.aggregate
          .mockResolvedValueOnce({
            _sum: { distance: 10000, movingTime: 3600, totalElevationGain: 100 },
            _count: 1,
          })
          .mockResolvedValueOnce({
            _sum: { distance: 0, movingTime: 0, totalElevationGain: 0 },
            _count: 0,
          });

        const result = await service.getSportPeriodStatistics(userId, SportType.RUN, StatisticsPeriod.WEEK);

        expect(result.distanceTrend).toBeUndefined();
        expect(result.durationTrend).toBeUndefined();
        expect(result.activityTrend).toBeUndefined();
        expect(result.elevationTrend).toBeUndefined();
      });

      it('should return zero trends when values are equal', async () => {
        prisma.activity.aggregate.mockResolvedValue({
          _sum: { distance: 10000, movingTime: 3600, totalElevationGain: 100 },
          _count: 2,
        });

        const result = await service.getSportPeriodStatistics(userId, SportType.RUN, StatisticsPeriod.WEEK);

        expect(result.distanceTrend).toBe(0);
        expect(result.durationTrend).toBe(0);
        expect(result.activityTrend).toBe(0);
        expect(result.elevationTrend).toBe(0);
      });
    });

    describe('Prisma queries', () => {
      it('should call aggregate twice (current and previous period)', async () => {
        await service.getSportPeriodStatistics(userId, SportType.RUN, StatisticsPeriod.WEEK);

        expect(prisma.activity.aggregate).toHaveBeenCalledTimes(2);
      });

      it('should pass correct userId to both queries', async () => {
        const specificUserId = 99999;

        await service.getSportPeriodStatistics(specificUserId, SportType.RUN, StatisticsPeriod.WEEK);

        const calls = prisma.activity.aggregate.mock.calls;
        expect(calls[0][0].where.userId).toBe(specificUserId);
        expect(calls[1][0].where.userId).toBe(specificUserId);
      });
    });
  });

  describe('getSportProgressionData', () => {
    const userId = 42;

    beforeEach(() => {
      prisma.activity.findMany.mockResolvedValue([]);
    });

    describe('interval generation', () => {
      it('should return 52-53 weekly data points for WEEK period (full year)', async () => {
        const result = await service.getSportProgressionData(
          userId,
          SportType.RUN,
          StatisticsPeriod.WEEK,
          ProgressionMetric.DISTANCE,
        );

        expect(result.length).toBeGreaterThanOrEqual(52);
        expect(result.length).toBeLessThanOrEqual(53);
      });

      it('should return index starting at 1 and intervalType WEEK for WEEK period', async () => {
        const result = await service.getSportProgressionData(
          userId,
          SportType.RUN,
          StatisticsPeriod.WEEK,
          ProgressionMetric.DISTANCE,
        );

        expect(result[0].index).toBe(1);
        expect(result[1].index).toBe(2);
        result.forEach(point => {
          expect(point.intervalType).toBe(IntervalType.WEEK);
        });
      });

      it('should return 12 data points for MONTH period (full year)', async () => {
        const result = await service.getSportProgressionData(
          userId,
          SportType.RUN,
          StatisticsPeriod.MONTH,
          ProgressionMetric.DISTANCE,
        );

        expect(result).toHaveLength(12);
      });

      it('should return index 0-11 and intervalType MONTH for MONTH period', async () => {
        const result = await service.getSportProgressionData(
          userId,
          SportType.RUN,
          StatisticsPeriod.MONTH,
          ProgressionMetric.DISTANCE,
        );

        expect(result.map(p => p.index)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
        result.forEach(point => {
          expect(point.intervalType).toBe(IntervalType.MONTH);
        });
      });

      it('should return 12 data points for YEAR period (same as MONTH)', async () => {
        const result = await service.getSportProgressionData(
          userId,
          SportType.RUN,
          StatisticsPeriod.YEAR,
          ProgressionMetric.DISTANCE,
        );

        expect(result).toHaveLength(12);
      });

      it('should return index 0-11 and intervalType MONTH for YEAR period', async () => {
        const result = await service.getSportProgressionData(
          userId,
          SportType.RUN,
          StatisticsPeriod.YEAR,
          ProgressionMetric.DISTANCE,
        );

        expect(result.map(p => p.index)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
        result.forEach(point => {
          expect(point.intervalType).toBe(IntervalType.MONTH);
        });
      });
    });

    describe('metric aggregation', () => {
      it('should sum distances correctly', async () => {
        prisma.activity.findMany.mockResolvedValue([
          { distance: 5000, movingTime: 1800, totalElevationGain: 50 },
          { distance: 7000, movingTime: 2400, totalElevationGain: 80 },
        ]);

        const result = await service.getSportProgressionData(
          userId,
          SportType.RUN,
          StatisticsPeriod.WEEK,
          ProgressionMetric.DISTANCE,
        );

        expect(result[0].value).toBe(12000);
      });

      it('should sum durations correctly', async () => {
        prisma.activity.findMany.mockResolvedValue([
          { distance: 5000, movingTime: 1800, totalElevationGain: 50 },
          { distance: 7000, movingTime: 2400, totalElevationGain: 80 },
        ]);

        const result = await service.getSportProgressionData(
          userId,
          SportType.RUN,
          StatisticsPeriod.WEEK,
          ProgressionMetric.DURATION,
        );

        expect(result[0].value).toBe(4200);
      });

      it('should count sessions correctly', async () => {
        prisma.activity.findMany.mockResolvedValue([
          { distance: 5000, movingTime: 1800, totalElevationGain: 50 },
          { distance: 7000, movingTime: 2400, totalElevationGain: 80 },
        ]);

        const result = await service.getSportProgressionData(
          userId,
          SportType.RUN,
          StatisticsPeriod.WEEK,
          ProgressionMetric.SESSIONS,
        );

        expect(result[0].value).toBe(2);
      });

      it('should sum elevations correctly', async () => {
        prisma.activity.findMany.mockResolvedValue([
          { distance: 5000, movingTime: 1800, totalElevationGain: 50 },
          { distance: 7000, movingTime: 2400, totalElevationGain: 80 },
        ]);

        const result = await service.getSportProgressionData(
          userId,
          SportType.RUN,
          StatisticsPeriod.WEEK,
          ProgressionMetric.ELEVATION,
        );

        expect(result[0].value).toBe(130);
      });

      it('should calculate pace correctly for RUN', async () => {
        prisma.activity.findMany.mockResolvedValue([{ distance: 10000, movingTime: 3000, totalElevationGain: 100 }]);

        const result = await service.getSportProgressionData(
          userId,
          SportType.RUN,
          StatisticsPeriod.WEEK,
          ProgressionMetric.PACE,
        );

        expect(result[0].value).toBe(300);
      });

      it('should return 0 for pace with RIDE sport', async () => {
        prisma.activity.findMany.mockResolvedValue([{ distance: 10000, movingTime: 3000, totalElevationGain: 100 }]);

        const result = await service.getSportProgressionData(
          userId,
          SportType.RIDE,
          StatisticsPeriod.WEEK,
          ProgressionMetric.PACE,
        );

        expect(result[0].value).toBe(0);
      });

      it('should calculate speed correctly for RIDE', async () => {
        prisma.activity.findMany.mockResolvedValue([{ distance: 10000, movingTime: 1000, totalElevationGain: 100 }]);

        const result = await service.getSportProgressionData(
          userId,
          SportType.RIDE,
          StatisticsPeriod.WEEK,
          ProgressionMetric.SPEED,
        );

        expect(result[0].value).toBe(36);
      });

      it('should return 0 for speed with RUN sport', async () => {
        prisma.activity.findMany.mockResolvedValue([{ distance: 10000, movingTime: 1000, totalElevationGain: 100 }]);

        const result = await service.getSportProgressionData(
          userId,
          SportType.RUN,
          StatisticsPeriod.WEEK,
          ProgressionMetric.SPEED,
        );

        expect(result[0].value).toBe(0);
      });
    });

    describe('edge cases', () => {
      it('should return zero values for intervals without activities', async () => {
        prisma.activity.findMany.mockResolvedValue([]);

        const result = await service.getSportProgressionData(
          userId,
          SportType.RUN,
          StatisticsPeriod.WEEK,
          ProgressionMetric.DISTANCE,
        );

        result.forEach(point => {
          expect(point.value).toBe(0);
        });
      });
    });
  });

  describe('getSportAverageMetrics', () => {
    const userId = 42;

    beforeEach(() => {
      prisma.activity.findMany.mockResolvedValue([]);
    });

    describe('sport-specific metrics', () => {
      it('should return pace for RUN sport', async () => {
        prisma.activity.findMany.mockResolvedValue([
          {
            distance: 10000,
            movingTime: 3000,
            averageHeartrate: 150,
            averageCadence: 180,
            averageWatts: null,
            averageSpeed: 3.33,
          },
        ]);

        const result = await service.getSportAverageMetrics(userId, SportType.RUN, StatisticsPeriod.WEEK);

        expect(result.averagePace).toBe(300);
        expect(result.averageSpeed).toBeUndefined();
      });

      it('should return pace for SWIM sport', async () => {
        prisma.activity.findMany.mockResolvedValue([
          {
            distance: 2000,
            movingTime: 2400,
            averageHeartrate: 140,
            averageCadence: 50,
            averageWatts: null,
            averageSpeed: 0.83,
          },
        ]);

        const result = await service.getSportAverageMetrics(userId, SportType.SWIM, StatisticsPeriod.WEEK);

        expect(result.averagePace).toBe(1200);
        expect(result.averageSpeed).toBeUndefined();
      });

      it('should return speed for RIDE sport', async () => {
        prisma.activity.findMany.mockResolvedValue([
          {
            distance: 50000,
            movingTime: 7200,
            averageHeartrate: 145,
            averageCadence: 85,
            averageWatts: 200,
            averageSpeed: 6.94,
          },
        ]);

        const result = await service.getSportAverageMetrics(userId, SportType.RIDE, StatisticsPeriod.WEEK);

        expect(result.averageSpeed).toBeCloseTo(6.94, 1);
        expect(result.averagePace).toBeUndefined();
      });

      it('should return power only for RIDE sport', async () => {
        prisma.activity.findMany.mockResolvedValue([
          {
            distance: 50000,
            movingTime: 7200,
            averageHeartrate: 145,
            averageCadence: 85,
            averageWatts: 200,
            averageSpeed: 6.94,
          },
        ]);

        const result = await service.getSportAverageMetrics(userId, SportType.RIDE, StatisticsPeriod.WEEK);

        expect(result.averagePower).toBe(200);
      });

      it('should not return power for RUN sport even if data exists', async () => {
        prisma.activity.findMany.mockResolvedValue([
          {
            distance: 10000,
            movingTime: 3000,
            averageHeartrate: 150,
            averageCadence: 180,
            averageWatts: 300,
            averageSpeed: 3.33,
          },
        ]);

        const result = await service.getSportAverageMetrics(userId, SportType.RUN, StatisticsPeriod.WEEK);

        expect(result.averagePower).toBeUndefined();
      });
    });

    describe('weighted averages', () => {
      it('should calculate time-weighted heart rate average', async () => {
        prisma.activity.findMany.mockResolvedValue([
          {
            distance: 10000,
            movingTime: 3600,
            averageHeartrate: 150,
            averageCadence: 180,
            averageWatts: null,
            averageSpeed: 2.78,
          },
          {
            distance: 5000,
            movingTime: 1800,
            averageHeartrate: 160,
            averageCadence: 175,
            averageWatts: null,
            averageSpeed: 2.78,
          },
        ]);

        const result = await service.getSportAverageMetrics(userId, SportType.RUN, StatisticsPeriod.WEEK);

        const expectedHr = (150 * 3600 + 160 * 1800) / (3600 + 1800);
        expect(result.averageHeartRate).toBeCloseTo(expectedHr, 1);
      });

      it('should calculate time-weighted cadence average', async () => {
        prisma.activity.findMany.mockResolvedValue([
          {
            distance: 10000,
            movingTime: 3600,
            averageHeartrate: 150,
            averageCadence: 180,
            averageWatts: null,
            averageSpeed: 2.78,
          },
          {
            distance: 5000,
            movingTime: 1800,
            averageHeartrate: 160,
            averageCadence: 170,
            averageWatts: null,
            averageSpeed: 2.78,
          },
        ]);

        const result = await service.getSportAverageMetrics(userId, SportType.RUN, StatisticsPeriod.WEEK);

        const expectedCadence = (180 * 3600 + 170 * 1800) / (3600 + 1800);
        expect(result.averageCadence).toBeCloseTo(expectedCadence, 1);
      });

      it('should calculate total distance / total time for pace', async () => {
        prisma.activity.findMany.mockResolvedValue([
          {
            distance: 10000,
            movingTime: 3000,
            averageHeartrate: 150,
            averageCadence: 180,
            averageWatts: null,
            averageSpeed: 3.33,
          },
          {
            distance: 5000,
            movingTime: 2000,
            averageHeartrate: 160,
            averageCadence: 175,
            averageWatts: null,
            averageSpeed: 2.5,
          },
        ]);

        const result = await service.getSportAverageMetrics(userId, SportType.RUN, StatisticsPeriod.WEEK);

        const expectedPace = ((3000 + 2000) / (10000 + 5000)) * 1000;
        expect(result.averagePace).toBeCloseTo(expectedPace, 1);
      });
    });

    describe('null handling', () => {
      it('should return all undefined when no activities', async () => {
        prisma.activity.findMany.mockResolvedValue([]);

        const result = await service.getSportAverageMetrics(userId, SportType.RUN, StatisticsPeriod.WEEK);

        expect(result.averagePace).toBeUndefined();
        expect(result.averageSpeed).toBeUndefined();
        expect(result.averageHeartRate).toBeUndefined();
        expect(result.averageCadence).toBeUndefined();
        expect(result.averagePower).toBeUndefined();
      });

      it('should handle activities with null optional fields', async () => {
        prisma.activity.findMany.mockResolvedValue([
          {
            distance: 10000,
            movingTime: 3000,
            averageHeartrate: null,
            averageCadence: null,
            averageWatts: null,
            averageSpeed: 3.33,
          },
        ]);

        const result = await service.getSportAverageMetrics(userId, SportType.RUN, StatisticsPeriod.WEEK);

        expect(result.averagePace).toBe(300);
        expect(result.averageHeartRate).toBeUndefined();
        expect(result.averageCadence).toBeUndefined();
      });

      it('should return undefined pace when total distance is 0', async () => {
        prisma.activity.findMany.mockResolvedValue([
          {
            distance: 0,
            movingTime: 3000,
            averageHeartrate: 150,
            averageCadence: 180,
            averageWatts: null,
            averageSpeed: 0,
          },
        ]);

        const result = await service.getSportAverageMetrics(userId, SportType.RUN, StatisticsPeriod.WEEK);

        expect(result.averagePace).toBeUndefined();
      });

      it('should return undefined speed when total time is 0', async () => {
        prisma.activity.findMany.mockResolvedValue([
          {
            distance: 10000,
            movingTime: 0,
            averageHeartrate: 150,
            averageCadence: 85,
            averageWatts: 200,
            averageSpeed: 0,
          },
        ]);

        const result = await service.getSportAverageMetrics(userId, SportType.RIDE, StatisticsPeriod.WEEK);

        expect(result.averageSpeed).toBeUndefined();
      });
    });
  });

  describe('getPersonalRecords', () => {
    const userId = 42;

    beforeEach(() => {
      prisma.activity.findFirst.mockResolvedValue(null);
      prisma.activity.findMany.mockResolvedValue([]);
    });

    describe('common records', () => {
      it('should return longest_distance record with raw value in meters', async () => {
        prisma.activity.findFirst
          .mockResolvedValueOnce({
            id: 1,
            distance: 42195,
            startDate: new Date('2024-01-15'),
          })
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce(null);

        const result = await service.getPersonalRecords(userId, SportType.RUN);

        const distanceRecord = result.find(r => r.type === 'longest_distance');
        expect(distanceRecord).toBeDefined();
        expect(distanceRecord?.value).toBe(42195);
        expect(distanceRecord?.activityId).toBe('1');
      });

      it('should return longest_duration record with raw value in seconds', async () => {
        prisma.activity.findFirst
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce({
            id: 2,
            movingTime: 16200,
            startDate: new Date('2024-02-20'),
          })
          .mockResolvedValueOnce(null);

        const result = await service.getPersonalRecords(userId, SportType.RUN);

        const durationRecord = result.find(r => r.type === 'longest_duration');
        expect(durationRecord).toBeDefined();
        expect(durationRecord?.value).toBe(16200);
        expect(durationRecord?.activityId).toBe('2');
      });

      it('should return most_elevation record with raw value in meters', async () => {
        prisma.activity.findFirst
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce({
            id: 3,
            totalElevationGain: 1500,
            startDate: new Date('2024-03-10'),
          });

        const result = await service.getPersonalRecords(userId, SportType.RUN);

        const elevationRecord = result.find(r => r.type === 'most_elevation');
        expect(elevationRecord).toBeDefined();
        expect(elevationRecord?.value).toBe(1500);
        expect(elevationRecord?.activityId).toBe('3');
      });
    });

    describe('sport-specific records', () => {
      it('should return best_pace for RUN sport with raw value in seconds/km', async () => {
        prisma.activity.findFirst.mockResolvedValue(null);
        prisma.activity.findMany.mockResolvedValue([
          { id: 10, distance: 5000, movingTime: 1500, startDate: new Date('2024-01-01') },
          { id: 11, distance: 10000, movingTime: 2700, startDate: new Date('2024-02-01') },
        ]);

        const result = await service.getPersonalRecords(userId, SportType.RUN);

        const paceRecord = result.find(r => r.type === 'best_pace');
        expect(paceRecord).toBeDefined();
        expect(paceRecord?.value).toBe(270);
        expect(paceRecord?.activityId).toBe('11');
      });

      it('should return best_pace for SWIM sport with raw value in seconds/km', async () => {
        prisma.activity.findFirst.mockResolvedValue(null);
        prisma.activity.findMany.mockResolvedValue([
          { id: 20, distance: 1500, movingTime: 1800, startDate: new Date('2024-01-01') },
        ]);

        const result = await service.getPersonalRecords(userId, SportType.SWIM);

        const paceRecord = result.find(r => r.type === 'best_pace');
        expect(paceRecord).toBeDefined();
        expect(paceRecord?.value).toBe(1200);
      });

      it('should return best_speed for RIDE sport with raw value in m/s', async () => {
        prisma.activity.findFirst
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce({
            id: 30,
            averageSpeed: 10,
            startDate: new Date('2024-04-01'),
          });

        const result = await service.getPersonalRecords(userId, SportType.RIDE);

        const speedRecord = result.find(r => r.type === 'best_speed');
        expect(speedRecord).toBeDefined();
        expect(speedRecord?.value).toBe(10);
        expect(speedRecord?.activityId).toBe('30');
      });

      it('should not return best_pace for RIDE sport', async () => {
        const result = await service.getPersonalRecords(userId, SportType.RIDE);

        const paceRecord = result.find(r => r.type === 'best_pace');
        expect(paceRecord).toBeUndefined();
      });

      it('should not return best_speed for RUN sport', async () => {
        const result = await service.getPersonalRecords(userId, SportType.RUN);

        const speedRecord = result.find(r => r.type === 'best_speed');
        expect(speedRecord).toBeUndefined();
      });
    });

    describe('pace calculation edge cases', () => {
      it('should only consider activities >= 1km for best_pace', async () => {
        prisma.activity.findFirst.mockResolvedValue(null);
        prisma.activity.findMany.mockResolvedValue([]);

        const result = await service.getPersonalRecords(userId, SportType.RUN);

        const paceRecord = result.find(r => r.type === 'best_pace');
        expect(paceRecord).toBeUndefined();
      });

      it('should query activities with distance >= 1000 for pace', async () => {
        prisma.activity.findFirst.mockResolvedValue(null);
        prisma.activity.findMany.mockResolvedValue([]);

        await service.getPersonalRecords(userId, SportType.RUN);

        expect(prisma.activity.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              distance: { gte: 1000 },
            }),
          }),
        );
      });
    });

    describe('edge cases', () => {
      it('should return empty array when no activities', async () => {
        const result = await service.getPersonalRecords(userId, SportType.RUN);

        expect(result).toEqual([]);
      });

      it('should not include record if value is 0', async () => {
        prisma.activity.findFirst.mockResolvedValueOnce({
          id: 1,
          distance: 0,
          startDate: new Date('2024-01-01'),
        });

        const result = await service.getPersonalRecords(userId, SportType.RUN);

        const distanceRecord = result.find(r => r.type === 'longest_distance');
        expect(distanceRecord).toBeUndefined();
      });

      it('should filter by correct Strava types', async () => {
        await service.getPersonalRecords(userId, SportType.RUN);

        expect(prisma.activity.findFirst).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              type: { in: ['Run', 'TrailRun', 'VirtualRun'] },
            }),
          }),
        );
      });
    });
  });

  describe('helper methods', () => {
    describe('calculatePreviousPeriodDates', () => {
      it('should calculate previous week correctly', async () => {
        prisma.activity.aggregate.mockResolvedValue({
          _sum: { distance: 0, movingTime: 0, totalElevationGain: 0 },
          _count: 0,
        });

        await service.getSportPeriodStatistics(42, SportType.RUN, StatisticsPeriod.WEEK);

        const calls = prisma.activity.aggregate.mock.calls;
        const currentStart = calls[0][0].where.startDate.gte;
        const previousStart = calls[1][0].where.startDate.gte;

        const diffDays = Math.round((currentStart.getTime() - previousStart.getTime()) / (1000 * 60 * 60 * 24));
        expect(diffDays).toBe(7);
      });

      it('should calculate previous month correctly', async () => {
        prisma.activity.aggregate.mockResolvedValue({
          _sum: { distance: 0, movingTime: 0, totalElevationGain: 0 },
          _count: 0,
        });

        await service.getSportPeriodStatistics(42, SportType.RUN, StatisticsPeriod.MONTH);

        const calls = prisma.activity.aggregate.mock.calls;
        const currentStart = calls[0][0].where.startDate.gte;
        const previousStart = calls[1][0].where.startDate.gte;

        const currentMonth = currentStart.getMonth();
        const previousMonth = previousStart.getMonth();

        const expectedPrevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        expect(previousMonth).toBe(expectedPrevMonth);
      });

      it('should calculate previous year correctly', async () => {
        prisma.activity.aggregate.mockResolvedValue({
          _sum: { distance: 0, movingTime: 0, totalElevationGain: 0 },
          _count: 0,
        });

        await service.getSportPeriodStatistics(42, SportType.RUN, StatisticsPeriod.YEAR);

        const calls = prisma.activity.aggregate.mock.calls;
        const currentStart = calls[0][0].where.startDate.gte;
        const previousStart = calls[1][0].where.startDate.gte;

        expect(previousStart.getFullYear()).toBe(currentStart.getFullYear() - 1);
      });
    });

    describe('calculateTrend', () => {
      it('should calculate positive percentage correctly', async () => {
        prisma.activity.aggregate
          .mockResolvedValueOnce({
            _sum: { distance: 120, movingTime: 0, totalElevationGain: 0 },
            _count: 0,
          })
          .mockResolvedValueOnce({
            _sum: { distance: 100, movingTime: 0, totalElevationGain: 0 },
            _count: 0,
          });

        const result = await service.getSportPeriodStatistics(42, SportType.RUN, StatisticsPeriod.WEEK);

        expect(result.distanceTrend).toBe(20);
      });

      it('should calculate negative percentage correctly', async () => {
        prisma.activity.aggregate
          .mockResolvedValueOnce({
            _sum: { distance: 80, movingTime: 0, totalElevationGain: 0 },
            _count: 0,
          })
          .mockResolvedValueOnce({
            _sum: { distance: 100, movingTime: 0, totalElevationGain: 0 },
            _count: 0,
          });

        const result = await service.getSportPeriodStatistics(42, SportType.RUN, StatisticsPeriod.WEEK);

        expect(result.distanceTrend).toBe(-20);
      });

      it('should return undefined when previous is 0', async () => {
        prisma.activity.aggregate
          .mockResolvedValueOnce({
            _sum: { distance: 100, movingTime: 0, totalElevationGain: 0 },
            _count: 0,
          })
          .mockResolvedValueOnce({
            _sum: { distance: 0, movingTime: 0, totalElevationGain: 0 },
            _count: 0,
          });

        const result = await service.getSportPeriodStatistics(42, SportType.RUN, StatisticsPeriod.WEEK);

        expect(result.distanceTrend).toBeUndefined();
      });

      it('should return 0 when values are equal', async () => {
        prisma.activity.aggregate.mockResolvedValue({
          _sum: { distance: 100, movingTime: 0, totalElevationGain: 0 },
          _count: 0,
        });

        const result = await service.getSportPeriodStatistics(42, SportType.RUN, StatisticsPeriod.WEEK);

        expect(result.distanceTrend).toBe(0);
      });
    });
  });
});
