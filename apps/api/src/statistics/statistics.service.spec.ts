import { Test, TestingModule } from '@nestjs/testing';
import { StatisticsService } from './statistics.service';
import { PrismaService } from '../database/prisma.service';
import { StatisticsPeriod } from './enums/statistics-period.enum';

const createMockPrismaService = () => ({
  activity: {
    aggregate: jest.fn(),
    findMany: jest.fn(),
    groupBy: jest.fn(),
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
});
