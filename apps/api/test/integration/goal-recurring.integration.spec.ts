import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../../src/app.module';
import { getTestPrismaClient, seedTestUser } from '../test-db';
import { SportType } from '../../src/user-preferences/enums/sport-type.enum';
import { GoalTargetType } from '../../src/goal/enums/goal-target-type.enum';
import { GoalPeriodType } from '../../src/goal/enums/goal-period-type.enum';
import { GoalStatus } from '../../src/goal/enums/goal-status.enum';

describe('Goal Recurring Integration', () => {
  let app: INestApplication;
  let prisma: ReturnType<typeof getTestPrismaClient>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = getTestPrismaClient();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Recurring Goal Creation', () => {
    it('should create a recurring weekly goal', async () => {
      const { user } = await seedTestUser();
      const startDate = new Date('2025-01-06');
      const recurrenceEndDate = new Date('2025-02-28');

      const goal = await prisma.goal.create({
        data: {
          userId: user.id,
          title: 'Run 10km weekly',
          targetType: GoalTargetType.DISTANCE,
          targetValue: 10,
          periodType: GoalPeriodType.WEEKLY,
          startDate,
          endDate: new Date('2025-01-12T23:59:59.999Z'),
          isRecurring: true,
          recurrenceEndDate,
          sportType: SportType.RUN,
          status: GoalStatus.ACTIVE,
          currentValue: 0,
        },
      });

      expect(goal.isRecurring).toBe(true);
      expect(goal.recurrenceEndDate).toEqual(recurrenceEndDate);
      expect(goal.periodType).toBe(GoalPeriodType.WEEKLY);
      expect(goal.status).toBe(GoalStatus.ACTIVE);
    });

    it('should create a recurring monthly goal', async () => {
      const { user } = await seedTestUser();
      const startDate = new Date('2025-01-01');
      const recurrenceEndDate = new Date('2025-12-31');

      const goal = await prisma.goal.create({
        data: {
          userId: user.id,
          title: 'Run 50km monthly',
          targetType: GoalTargetType.DISTANCE,
          targetValue: 50,
          periodType: GoalPeriodType.MONTHLY,
          startDate,
          endDate: new Date('2025-01-31T23:59:59.999Z'),
          isRecurring: true,
          recurrenceEndDate,
          sportType: SportType.RUN,
          status: GoalStatus.ACTIVE,
          currentValue: 0,
        },
      });

      expect(goal.isRecurring).toBe(true);
      expect(goal.recurrenceEndDate).toEqual(recurrenceEndDate);
      expect(goal.periodType).toBe(GoalPeriodType.MONTHLY);
      expect(goal.status).toBe(GoalStatus.ACTIVE);
    });

    it('should create a recurring goal without recurrenceEndDate (indefinite)', async () => {
      const { user } = await seedTestUser();
      const startDate = new Date('2025-01-06');

      const goal = await prisma.goal.create({
        data: {
          userId: user.id,
          title: 'Run 10km weekly forever',
          targetType: GoalTargetType.DISTANCE,
          targetValue: 10,
          periodType: GoalPeriodType.WEEKLY,
          startDate,
          endDate: new Date('2025-01-12T23:59:59.999Z'),
          isRecurring: true,
          recurrenceEndDate: null,
          sportType: SportType.RUN,
          status: GoalStatus.ACTIVE,
          currentValue: 0,
        },
      });

      expect(goal.isRecurring).toBe(true);
      expect(goal.recurrenceEndDate).toBeNull();
      expect(goal.status).toBe(GoalStatus.ACTIVE);
    });
  });

  describe('Recurring Goal recurrenceEndDate Respect', () => {
    it('should respect recurrenceEndDate when set', async () => {
      const { user } = await seedTestUser();
      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-01-31T23:59:59.999Z');
      const recurrenceEndDate = new Date('2025-03-31');

      const goal = await prisma.goal.create({
        data: {
          userId: user.id,
          title: 'Run 50km monthly for 3 months',
          targetType: GoalTargetType.DISTANCE,
          targetValue: 50,
          periodType: GoalPeriodType.MONTHLY,
          startDate,
          endDate,
          isRecurring: true,
          recurrenceEndDate,
          sportType: SportType.RUN,
          status: GoalStatus.ACTIVE,
          currentValue: 0,
        },
      });

      expect(goal.recurrenceEndDate).toEqual(recurrenceEndDate);
      expect(goal.endDate.getTime()).toBeLessThan(recurrenceEndDate.getTime());
    });

    it('should allow indefinite recurring goals with null recurrenceEndDate', async () => {
      const { user } = await seedTestUser();
      const startDate = new Date('2025-01-06');
      const endDate = new Date('2025-01-12T23:59:59.999Z');

      const goal = await prisma.goal.create({
        data: {
          userId: user.id,
          title: 'Run 10km weekly indefinitely',
          targetType: GoalTargetType.DISTANCE,
          targetValue: 10,
          periodType: GoalPeriodType.WEEKLY,
          startDate,
          endDate,
          isRecurring: true,
          recurrenceEndDate: null,
          sportType: SportType.RUN,
          status: GoalStatus.ACTIVE,
          currentValue: 0,
        },
      });

      expect(goal.recurrenceEndDate).toBeNull();
      expect(goal.isRecurring).toBe(true);
    });
  });
});
