import request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, RequestMethod } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';
import cookieParser from 'cookie-parser';
import { generateTestAccessToken } from './test-db';
import { SportType } from '../src/user-preferences/enums/sport-type.enum';
import { ThemeType } from '../src/user-preferences/enums/theme-type.enum';
import { LocaleType } from '../src/user-preferences/enums/locale-type.enum';

describe('GoalResolver (E2E Authenticated)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let userId: number;
  let otherUserToken: string;
  let otherUserId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    app.use(cookieParser());

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    app.enableCors({
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      credentials: true,
    });

    app.setGlobalPrefix('v1', {
      exclude: [{ path: 'graphql', method: RequestMethod.ALL }],
    });

    await app.init();

    prisma = app.get<PrismaService>(PrismaService);
  });

  beforeEach(async () => {
    const user = await prisma.user.create({
      data: {
        stravaId: 12345,
        username: 'testuser',
        firstname: 'Test',
        lastname: 'User',
        sex: 'M',
        city: 'Test City',
        country: 'Test Country',
        profile: 'https://example.com/profile.jpg',
        profileMedium: 'https://example.com/profile_medium.jpg',
      },
    });

    await prisma.userPreferences.create({
      data: {
        userId: user.id,
        selectedSports: [SportType.RUN],
        onboardingCompleted: true,
        locale: LocaleType.EN,
        theme: ThemeType.SYSTEM,
      },
    });

    userId = user.id;
    authToken = generateTestAccessToken(user.id, user.stravaId);

    const otherUser = await prisma.user.create({
      data: {
        stravaId: 67890,
        username: 'otheruser',
        firstname: 'Other',
        lastname: 'User',
        sex: 'F',
        city: 'Other City',
        country: 'Other Country',
        profile: 'https://example.com/other.jpg',
        profileMedium: 'https://example.com/other_medium.jpg',
      },
    });

    await prisma.userPreferences.create({
      data: {
        userId: otherUser.id,
        selectedSports: [SportType.RIDE],
        onboardingCompleted: true,
        locale: LocaleType.EN,
        theme: ThemeType.SYSTEM,
      },
    });

    otherUserId = otherUser.id;
    otherUserToken = generateTestAccessToken(otherUser.id, otherUser.stravaId);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('createGoal mutation', () => {
    it('should create a goal with MONTHLY period', () => {
      return request(app.getHttpServer())
        .post('/graphql')
        .set('Cookie', `Authentication=${authToken}`)
        .send({
          query: `
            mutation {
              createGoal(input: {
                title: "Run 50km this month"
                targetType: DISTANCE
                targetValue: 50
                periodType: MONTHLY
                startDate: "2026-02-01"
                sportType: RUN
              }) {
                id
                title
                targetType
                targetValue
                periodType
                sportType
                status
              }
            }
          `,
        })
        .expect(200)
        .expect(res => {
          expect(res.body.errors).toBeUndefined();
          expect(res.body.data.createGoal).toMatchObject({
            title: 'Run 50km this month',
            targetType: 'DISTANCE',
            targetValue: 50,
            periodType: 'MONTHLY',
            sportType: 'RUN',
            status: 'ACTIVE',
          });
        });
    });

    it('should create a goal with WEEKLY period', () => {
      return request(app.getHttpServer())
        .post('/graphql')
        .set('Cookie', `Authentication=${authToken}`)
        .send({
          query: `
            mutation {
              createGoal(input: {
                title: "Run 20km this week"
                targetType: DISTANCE
                targetValue: 20
                periodType: WEEKLY
                startDate: "2025-01-13"
              }) {
                id
                periodType
              }
            }
          `,
        })
        .expect(200)
        .expect(res => {
          expect(res.body.errors).toBeUndefined();
          expect(res.body.data.createGoal.periodType).toBe('WEEKLY');
        });
    });

    it('should create a goal with YEARLY period', () => {
      return request(app.getHttpServer())
        .post('/graphql')
        .set('Cookie', `Authentication=${authToken}`)
        .send({
          query: `
            mutation {
              createGoal(input: {
                title: "Run 1000km this year"
                targetType: DISTANCE
                targetValue: 1000
                periodType: YEARLY
                startDate: "2025-03-15"
              }) {
                id
                periodType
              }
            }
          `,
        })
        .expect(200)
        .expect(res => {
          expect(res.body.errors).toBeUndefined();
          expect(res.body.data.createGoal.periodType).toBe('YEARLY');
        });
    });

    it('should create a goal with CUSTOM period', () => {
      return request(app.getHttpServer())
        .post('/graphql')
        .set('Cookie', `Authentication=${authToken}`)
        .send({
          query: `
            mutation {
              createGoal(input: {
                title: "Custom goal"
                targetType: FREQUENCY
                targetValue: 10
                periodType: CUSTOM
                startDate: "2025-01-01"
                endDate: "2025-01-15"
              }) {
                id
                periodType
              }
            }
          `,
        })
        .expect(200)
        .expect(res => {
          expect(res.body.errors).toBeUndefined();
          expect(res.body.data.createGoal.periodType).toBe('CUSTOM');
        });
    });

    it('should create a recurring goal', () => {
      return request(app.getHttpServer())
        .post('/graphql')
        .set('Cookie', `Authentication=${authToken}`)
        .send({
          query: `
            mutation {
              createGoal(input: {
                title: "Weekly 20km (recurring)"
                targetType: DISTANCE
                targetValue: 20
                periodType: WEEKLY
                startDate: "2025-01-01"
                isRecurring: true
                recurrenceEndDate: "2025-12-31"
              }) {
                id
                isRecurring
              }
            }
          `,
        })
        .expect(200)
        .expect(res => {
          expect(res.body.errors).toBeUndefined();
          expect(res.body.data.createGoal.isRecurring).toBe(true);
        });
    });

    it('should create a goal for all sports when sportType is null', () => {
      return request(app.getHttpServer())
        .post('/graphql')
        .set('Cookie', `Authentication=${authToken}`)
        .send({
          query: `
            mutation {
              createGoal(input: {
                title: "All sports goal"
                targetType: DISTANCE
                targetValue: 100
                periodType: MONTHLY
                startDate: "2025-01-01"
              }) {
                id
                sportType
              }
            }
          `,
        })
        .expect(200)
        .expect(res => {
          expect(res.body.errors).toBeUndefined();
          expect(res.body.data.createGoal.sportType).toBeNull();
        });
    });

    it('should return validation error for missing title', () => {
      return request(app.getHttpServer())
        .post('/graphql')
        .set('Cookie', `Authentication=${authToken}`)
        .send({
          query: `
            mutation {
              createGoal(input: {
                title: ""
                targetType: DISTANCE
                targetValue: 50
                periodType: MONTHLY
                startDate: "2026-02-01"
              }) {
                id
              }
            }
          `,
        })
        .expect(200)
        .expect(res => {
          expect(res.body.errors).toBeDefined();
        });
    });

    it('should return validation error for negative targetValue', () => {
      return request(app.getHttpServer())
        .post('/graphql')
        .set('Cookie', `Authentication=${authToken}`)
        .send({
          query: `
            mutation {
              createGoal(input: {
                title: "Invalid goal"
                targetType: DISTANCE
                targetValue: -10
                periodType: MONTHLY
                startDate: "2025-01-01"
              }) {
                id
              }
            }
          `,
        })
        .expect(200)
        .expect(res => {
          expect(res.body.errors).toBeDefined();
        });
    });

    it('should return validation error for invalid date format', () => {
      return request(app.getHttpServer())
        .post('/graphql')
        .set('Cookie', `Authentication=${authToken}`)
        .send({
          query: `
            mutation {
              createGoal(input: {
                title: "Invalid date goal"
                targetType: DISTANCE
                targetValue: 50
                periodType: MONTHLY
                startDate: "invalid-date"
              }) {
                id
              }
            }
          `,
        })
        .expect(200)
        .expect(res => {
          expect(res.body.errors).toBeDefined();
        });
    });
  });

  describe('createGoalFromTemplate mutation', () => {
    let template1Id: number;
    let template2Id: number;

    beforeEach(async () => {
      const template1 = await prisma.goalTemplate.create({
        data: {
          targetType: 'DISTANCE',
          targetValue: 50,
          periodType: 'MONTHLY',
          sportType: 'RUN',
          category: 'running',
          isPreset: true,
        },
      });
      template1Id = template1.id;

      await prisma.goalTemplateTranslation.createMany({
        data: [
          {
            templateId: template1.id,
            locale: 'en',
            title: 'Run 50km this month',
            description: 'Complete 50 kilometers of running',
          },
          {
            templateId: template1.id,
            locale: 'fr',
            title: 'Courir 50km ce mois',
            description: 'Compléter 50 kilomètres de course',
          },
        ],
      });

      const template2 = await prisma.goalTemplate.create({
        data: {
          targetType: 'FREQUENCY',
          targetValue: 12,
          periodType: 'MONTHLY',
          sportType: null,
          category: 'consistency',
          isPreset: true,
        },
      });
      template2Id = template2.id;

      await prisma.goalTemplateTranslation.create({
        data: {
          templateId: template2.id,
          locale: 'en',
          title: 'Train 12 times this month',
          description: 'Stay consistent with your training',
        },
      });
    });

    it('should create a goal from template with default title', () => {
      return request(app.getHttpServer())
        .post('/graphql')
        .set('Cookie', `Authentication=${authToken}`)
        .send({
          query: `
            mutation {
              createGoalFromTemplate(input: {
                templateId: ${template1Id}
                startDate: "2026-02-01"
              }) {
                id
                title
              }
            }
          `,
        })
        .expect(200)
        .expect(res => {
          expect(res.body.errors).toBeUndefined();
          expect(res.body.data.createGoalFromTemplate.title).toBeDefined();
        });
    });

    it('should create a goal from template with custom title', () => {
      return request(app.getHttpServer())
        .post('/graphql')
        .set('Cookie', `Authentication=${authToken}`)
        .send({
          query: `
            mutation {
              createGoalFromTemplate(input: {
                templateId: ${template1Id}
                startDate: "2026-02-01"
                customTitle: "My Custom Goal"
              }) {
                id
                title
              }
            }
          `,
        })
        .expect(200)
        .expect(res => {
          expect(res.body.errors).toBeUndefined();
          expect(res.body.data.createGoalFromTemplate.title).toBe('My Custom Goal');
        });
    });

    it('should create a goal from template with startDate', () => {
      return request(app.getHttpServer())
        .post('/graphql')
        .set('Cookie', `Authentication=${authToken}`)
        .send({
          query: `
            mutation {
              createGoalFromTemplate(input: {
                templateId: ${template2Id}
                startDate: "2026-02-01"
              }) {
                id
                title
              }
            }
          `,
        })
        .expect(200)
        .expect(res => {
          expect(res.body.errors).toBeUndefined();
          expect(res.body.data.createGoalFromTemplate.title).toBeDefined();
        });
    });

    it('should return error for invalid templateId', () => {
      return request(app.getHttpServer())
        .post('/graphql')
        .set('Cookie', `Authentication=${authToken}`)
        .send({
          query: `
            mutation {
              createGoalFromTemplate(input: {
                templateId: 99999
                startDate: "2025-01-01"
              }) {
                id
              }
            }
          `,
        })
        .expect(200)
        .expect(res => {
          expect(res.body.errors).toBeDefined();
        });
    });
  });

  describe('goals query', () => {
    beforeEach(async () => {
      await prisma.goal.create({
        data: {
          userId,
          title: 'Active Goal',
          targetType: 'DISTANCE',
          targetValue: 50,
          periodType: 'MONTHLY',
          startDate: new Date('2025-01-01'),
          endDate: new Date('2025-01-31'),
          status: 'ACTIVE',
          currentValue: 0,
        },
      });

      await prisma.goal.create({
        data: {
          userId,
          title: 'Completed Goal',
          targetType: 'DISTANCE',
          targetValue: 30,
          periodType: 'MONTHLY',
          startDate: new Date('2024-12-01'),
          endDate: new Date('2024-12-31'),
          status: 'COMPLETED',
          currentValue: 30,
        },
      });

      await prisma.goal.create({
        data: {
          userId,
          title: 'Archived Goal',
          targetType: 'DISTANCE',
          targetValue: 20,
          periodType: 'MONTHLY',
          startDate: new Date('2024-11-01'),
          endDate: new Date('2024-11-30'),
          status: 'ARCHIVED',
          currentValue: 15,
        },
      });

      await prisma.goal.create({
        data: {
          userId: otherUserId,
          title: 'Other User Goal',
          targetType: 'DISTANCE',
          targetValue: 40,
          periodType: 'MONTHLY',
          startDate: new Date('2025-01-01'),
          endDate: new Date('2025-01-31'),
          status: 'ACTIVE',
          currentValue: 0,
        },
      });
    });

    it('should return all goals excluding archived', () => {
      return request(app.getHttpServer())
        .post('/graphql')
        .set('Cookie', `Authentication=${authToken}`)
        .send({
          query: `
            query {
              goals {
                id
                title
                status
              }
            }
          `,
        })
        .expect(200)
        .expect(res => {
          expect(res.body.errors).toBeUndefined();
          expect(res.body.data.goals).toHaveLength(2);
          expect(res.body.data.goals.find((g: any) => g.status === 'ARCHIVED')).toBeUndefined();
        });
    });

    it('should filter goals by ACTIVE status', () => {
      return request(app.getHttpServer())
        .post('/graphql')
        .set('Cookie', `Authentication=${authToken}`)
        .send({
          query: `
            query {
              goals(status: ACTIVE) {
                id
                title
                status
              }
            }
          `,
        })
        .expect(200)
        .expect(res => {
          expect(res.body.errors).toBeUndefined();
          expect(res.body.data.goals).toHaveLength(1);
          expect(res.body.data.goals[0].status).toBe('ACTIVE');
        });
    });

    it('should filter goals by sportType', async () => {
      await prisma.goal.create({
        data: {
          userId,
          title: 'Running Goal',
          targetType: 'DISTANCE',
          targetValue: 50,
          periodType: 'MONTHLY',
          startDate: new Date('2026-02-01'),
          endDate: new Date('2026-02-28'),
          sportType: 'RUN',
          status: 'ACTIVE',
          currentValue: 0,
        },
      });

      return request(app.getHttpServer())
        .post('/graphql')
        .set('Cookie', `Authentication=${authToken}`)
        .send({
          query: `
            query {
              goals(sportType: RUN) {
                id
                sportType
              }
            }
          `,
        })
        .expect(200)
        .expect(res => {
          expect(res.body.errors).toBeUndefined();
          expect(res.body.data.goals.length).toBeGreaterThan(0);
          res.body.data.goals.forEach((goal: any) => {
            expect(goal.sportType).toBe('RUN');
          });
        });
    });

    it('should include archived goals when includeArchived is true', () => {
      return request(app.getHttpServer())
        .post('/graphql')
        .set('Cookie', `Authentication=${authToken}`)
        .send({
          query: `
            query {
              goals(includeArchived: true) {
                id
                title
                status
              }
            }
          `,
        })
        .expect(200)
        .expect(res => {
          expect(res.body.errors).toBeUndefined();
          expect(res.body.data.goals).toHaveLength(3);
          expect(res.body.data.goals.find((g: any) => g.status === 'ARCHIVED')).toBeDefined();
        });
    });

    it('should only return goals for authenticated user (data isolation)', () => {
      return request(app.getHttpServer())
        .post('/graphql')
        .set('Cookie', `Authentication=${authToken}`)
        .send({
          query: `
            query {
              goals {
                id
                title
              }
            }
          `,
        })
        .expect(200)
        .expect(res => {
          expect(res.body.errors).toBeUndefined();
          expect(res.body.data.goals.find((g: any) => g.title === 'Other User Goal')).toBeUndefined();
        });
    });
  });

  describe('goal query', () => {
    let goalId: number;

    beforeEach(async () => {
      const goal = await prisma.goal.create({
        data: {
          userId,
          title: 'Single Goal',
          targetType: 'DISTANCE',
          targetValue: 50,
          periodType: 'MONTHLY',
          startDate: new Date('2025-01-01'),
          endDate: new Date('2025-01-31'),
          status: 'ACTIVE',
          currentValue: 25,
        },
      });
      goalId = goal.id;
    });

    it('should return a single goal by ID', () => {
      return request(app.getHttpServer())
        .post('/graphql')
        .set('Cookie', `Authentication=${authToken}`)
        .send({
          query: `
            query {
              goal(id: ${goalId}) {
                id
                title
                currentValue
              }
            }
          `,
        })
        .expect(200)
        .expect(res => {
          expect(res.body.errors).toBeUndefined();
          expect(res.body.data.goal.id).toBe(String(goalId));
          expect(res.body.data.goal.title).toBe('Single Goal');
        });
    });

    it('should return null for non-existent goal', () => {
      return request(app.getHttpServer())
        .post('/graphql')
        .set('Cookie', `Authentication=${authToken}`)
        .send({
          query: `
            query {
              goal(id: 99999) {
                id
              }
            }
          `,
        })
        .expect(200)
        .expect(res => {
          expect(res.body.errors).toBeUndefined();
          expect(res.body.data.goal).toBeNull();
        });
    });

    it('should return null for other user goal (data isolation)', async () => {
      const otherGoal = await prisma.goal.create({
        data: {
          userId: otherUserId,
          title: 'Other User Goal',
          targetType: 'DISTANCE',
          targetValue: 40,
          periodType: 'MONTHLY',
          startDate: new Date('2025-01-01'),
          endDate: new Date('2025-01-31'),
          status: 'ACTIVE',
          currentValue: 0,
        },
      });

      return request(app.getHttpServer())
        .post('/graphql')
        .set('Cookie', `Authentication=${authToken}`)
        .send({
          query: `
            query {
              goal(id: ${otherGoal.id}) {
                id
              }
            }
          `,
        })
        .expect(200)
        .expect(res => {
          expect(res.body.errors).toBeUndefined();
          expect(res.body.data.goal).toBeNull();
        });
    });
  });

  describe('activeGoals query', () => {
    beforeEach(async () => {
      await prisma.goal.createMany({
        data: [
          {
            userId,
            title: 'Active Goal 1',
            targetType: 'DISTANCE',
            targetValue: 50,
            periodType: 'MONTHLY',
            startDate: new Date('2025-01-01'),
            endDate: new Date('2025-01-31'),
            status: 'ACTIVE',
            currentValue: 0,
          },
          {
            userId,
            title: 'Active Goal 2',
            targetType: 'DISTANCE',
            targetValue: 30,
            periodType: 'WEEKLY',
            startDate: new Date('2025-01-13'),
            endDate: new Date('2025-01-19'),
            status: 'ACTIVE',
            currentValue: 0,
          },
          {
            userId,
            title: 'Completed Goal',
            targetType: 'DISTANCE',
            targetValue: 20,
            periodType: 'MONTHLY',
            startDate: new Date('2024-12-01'),
            endDate: new Date('2024-12-31'),
            status: 'COMPLETED',
            currentValue: 20,
          },
        ],
      });
    });

    it('should return only ACTIVE goals', () => {
      return request(app.getHttpServer())
        .post('/graphql')
        .set('Cookie', `Authentication=${authToken}`)
        .send({
          query: `
            query {
              activeGoals {
                id
                title
                status
              }
            }
          `,
        })
        .expect(200)
        .expect(res => {
          expect(res.body.errors).toBeUndefined();
          expect(res.body.data.activeGoals).toHaveLength(2);
          res.body.data.activeGoals.forEach((goal: any) => {
            expect(goal.status).toBe('ACTIVE');
          });
        });
    });
  });

  describe('updateGoal mutation', () => {
    let goalId: number;

    beforeEach(async () => {
      const goal = await prisma.goal.create({
        data: {
          userId,
          title: 'Original Title',
          targetType: 'DISTANCE',
          targetValue: 50,
          periodType: 'MONTHLY',
          startDate: new Date('2025-01-01'),
          endDate: new Date('2025-01-31'),
          status: 'ACTIVE',
          currentValue: 0,
        },
      });
      goalId = goal.id;
    });

    it('should update goal title', () => {
      return request(app.getHttpServer())
        .post('/graphql')
        .set('Cookie', `Authentication=${authToken}`)
        .send({
          query: `
            mutation {
              updateGoal(id: ${goalId}, input: {
                title: "Updated Title"
              }) {
                id
                title
              }
            }
          `,
        })
        .expect(200)
        .expect(res => {
          expect(res.body.errors).toBeUndefined();
          expect(res.body.data.updateGoal.title).toBe('Updated Title');
        });
    });

    it('should update goal targetValue', () => {
      return request(app.getHttpServer())
        .post('/graphql')
        .set('Cookie', `Authentication=${authToken}`)
        .send({
          query: `
            mutation {
              updateGoal(id: ${goalId}, input: {
                targetValue: 75
              }) {
                id
                targetValue
              }
            }
          `,
        })
        .expect(200)
        .expect(res => {
          expect(res.body.errors).toBeUndefined();
          expect(res.body.data.updateGoal.targetValue).toBe(75);
        });
    });

    it('should update goal description', () => {
      return request(app.getHttpServer())
        .post('/graphql')
        .set('Cookie', `Authentication=${authToken}`)
        .send({
          query: `
            mutation {
              updateGoal(id: ${goalId}, input: {
                description: "New description"
              }) {
                id
                description
              }
            }
          `,
        })
        .expect(200)
        .expect(res => {
          expect(res.body.errors).toBeUndefined();
          expect(res.body.data.updateGoal.description).toBe('New description');
        });
    });

    it('should update goal endDate for CUSTOM period', async () => {
      const customGoal = await prisma.goal.create({
        data: {
          userId,
          title: 'Custom Goal',
          targetType: 'DISTANCE',
          targetValue: 50,
          periodType: 'CUSTOM',
          startDate: new Date('2025-01-01'),
          endDate: new Date('2025-01-15'),
          status: 'ACTIVE',
          currentValue: 0,
        },
      });

      return request(app.getHttpServer())
        .post('/graphql')
        .set('Cookie', `Authentication=${authToken}`)
        .send({
          query: `
            mutation {
              updateGoal(id: ${customGoal.id}, input: {
                endDate: "2025-01-20"
              }) {
                id
              }
            }
          `,
        })
        .expect(200)
        .expect(res => {
          expect(res.body.errors).toBeUndefined();
        });
    });

    it('should return validation error for empty title', () => {
      return request(app.getHttpServer())
        .post('/graphql')
        .set('Cookie', `Authentication=${authToken}`)
        .send({
          query: `
            mutation {
              updateGoal(id: ${goalId}, input: {
                title: ""
              }) {
                id
              }
            }
          `,
        })
        .expect(200)
        .expect(res => {
          expect(res.body.errors).toBeDefined();
        });
    });

    it('should fail to update other user goal (ownership check)', async () => {
      const otherGoal = await prisma.goal.create({
        data: {
          userId: otherUserId,
          title: 'Other User Goal',
          targetType: 'DISTANCE',
          targetValue: 40,
          periodType: 'MONTHLY',
          startDate: new Date('2025-01-01'),
          endDate: new Date('2025-01-31'),
          status: 'ACTIVE',
          currentValue: 0,
        },
      });

      return request(app.getHttpServer())
        .post('/graphql')
        .set('Cookie', `Authentication=${authToken}`)
        .send({
          query: `
            mutation {
              updateGoal(id: ${otherGoal.id}, input: {
                title: "Hacked Title"
              }) {
                id
              }
            }
          `,
        })
        .expect(200)
        .expect(res => {
          expect(res.body.errors).toBeDefined();
        });
    });

    it('should fail to update non-existent goal', () => {
      return request(app.getHttpServer())
        .post('/graphql')
        .set('Cookie', `Authentication=${authToken}`)
        .send({
          query: `
            mutation {
              updateGoal(id: 99999, input: {
                title: "Updated"
              }) {
                id
              }
            }
          `,
        })
        .expect(200)
        .expect(res => {
          expect(res.body.errors).toBeDefined();
        });
    });
  });

  describe('deleteGoal mutation', () => {
    let goalId: number;

    beforeEach(async () => {
      const goal = await prisma.goal.create({
        data: {
          userId,
          title: 'Goal to Delete',
          targetType: 'DISTANCE',
          targetValue: 50,
          periodType: 'MONTHLY',
          startDate: new Date('2025-01-01'),
          endDate: new Date('2025-01-31'),
          status: 'ACTIVE',
          currentValue: 0,
        },
      });
      goalId = goal.id;
    });

    it('should delete a goal', async () => {
      await request(app.getHttpServer())
        .post('/graphql')
        .set('Cookie', `Authentication=${authToken}`)
        .send({
          query: `
            mutation {
              deleteGoal(id: ${goalId})
            }
          `,
        })
        .expect(200)
        .expect(res => {
          expect(res.body.errors).toBeUndefined();
          expect(res.body.data.deleteGoal).toBe(true);
        });

      const deletedGoal = await prisma.goal.findUnique({ where: { id: goalId } });
      expect(deletedGoal).toBeNull();
    });

    it('should fail to delete other user goal (ownership check)', async () => {
      const otherGoal = await prisma.goal.create({
        data: {
          userId: otherUserId,
          title: 'Other User Goal',
          targetType: 'DISTANCE',
          targetValue: 40,
          periodType: 'MONTHLY',
          startDate: new Date('2025-01-01'),
          endDate: new Date('2025-01-31'),
          status: 'ACTIVE',
          currentValue: 0,
        },
      });

      return request(app.getHttpServer())
        .post('/graphql')
        .set('Cookie', `Authentication=${authToken}`)
        .send({
          query: `
            mutation {
              deleteGoal(id: ${otherGoal.id})
            }
          `,
        })
        .expect(200)
        .expect(res => {
          expect(res.body.errors).toBeDefined();
        });
    });

    it('should fail to delete non-existent goal', () => {
      return request(app.getHttpServer())
        .post('/graphql')
        .set('Cookie', `Authentication=${authToken}`)
        .send({
          query: `
            mutation {
              deleteGoal(id: 99999)
            }
          `,
        })
        .expect(200)
        .expect(res => {
          expect(res.body.errors).toBeDefined();
        });
    });
  });

  describe('archiveGoal mutation', () => {
    let goalId: number;

    beforeEach(async () => {
      const goal = await prisma.goal.create({
        data: {
          userId,
          title: 'Goal to Archive',
          targetType: 'DISTANCE',
          targetValue: 50,
          periodType: 'MONTHLY',
          startDate: new Date('2025-01-01'),
          endDate: new Date('2025-01-31'),
          status: 'ACTIVE',
          currentValue: 0,
        },
      });
      goalId = goal.id;
    });

    it('should archive a goal', async () => {
      await request(app.getHttpServer())
        .post('/graphql')
        .set('Cookie', `Authentication=${authToken}`)
        .send({
          query: `
            mutation {
              archiveGoal(id: ${goalId}) {
                id
                status
              }
            }
          `,
        })
        .expect(200)
        .expect(res => {
          expect(res.body.errors).toBeUndefined();
          expect(res.body.data.archiveGoal.status).toBe('ARCHIVED');
        });

      const archivedGoal = await prisma.goal.findUnique({ where: { id: goalId } });
      expect(archivedGoal?.status).toBe('ARCHIVED');
    });

    it('should fail to archive other user goal (ownership check)', async () => {
      const otherGoal = await prisma.goal.create({
        data: {
          userId: otherUserId,
          title: 'Other User Goal',
          targetType: 'DISTANCE',
          targetValue: 40,
          periodType: 'MONTHLY',
          startDate: new Date('2025-01-01'),
          endDate: new Date('2025-01-31'),
          status: 'ACTIVE',
          currentValue: 0,
        },
      });

      return request(app.getHttpServer())
        .post('/graphql')
        .set('Cookie', `Authentication=${authToken}`)
        .send({
          query: `
            mutation {
              archiveGoal(id: ${otherGoal.id}) {
                id
              }
            }
          `,
        })
        .expect(200)
        .expect(res => {
          expect(res.body.errors).toBeDefined();
        });
    });
  });

  describe('refreshGoalProgress mutation', () => {
    let goalId: number;

    beforeEach(async () => {
      const goal = await prisma.goal.create({
        data: {
          userId,
          title: 'Goal to Refresh',
          targetType: 'DISTANCE',
          targetValue: 50,
          periodType: 'MONTHLY',
          startDate: new Date('2025-01-01'),
          endDate: new Date('2025-01-31'),
          status: 'ACTIVE',
          currentValue: 0,
        },
      });
      goalId = goal.id;

      await prisma.activity.create({
        data: {
          userId,
          stravaId: BigInt(11111),
          name: 'Test Run 1',
          type: 'Run',
          distance: 10000,
          movingTime: 3600,
          elapsedTime: 3600,
          totalElevationGain: 50,
          startDate: new Date('2025-01-10'),
          startDateLocal: new Date('2025-01-10'),
          timezone: '(GMT+00:00) UTC',
          averageSpeed: 2.78,
          maxSpeed: 3.5,
          averageHeartrate: 145,
          maxHeartrate: 165,
          kilojoules: 500,
          deviceWatts: false,
          hasKudoed: false,
          kudosCount: 0,
          averageCadence: 85,
          raw: {
            id: 11111,
            name: 'Test Run 1',
            type: 'Run',
          },
        },
      });

      await prisma.activity.create({
        data: {
          userId,
          stravaId: BigInt(22222),
          name: 'Test Run 2',
          type: 'Run',
          distance: 15000,
          movingTime: 5400,
          elapsedTime: 5400,
          totalElevationGain: 50,
          startDate: new Date('2025-01-15'),
          startDateLocal: new Date('2025-01-15'),
          timezone: '(GMT+00:00) UTC',
          averageSpeed: 2.78,
          maxSpeed: 3.5,
          averageHeartrate: 145,
          maxHeartrate: 165,
          kilojoules: 500,
          deviceWatts: false,
          hasKudoed: false,
          kudosCount: 0,
          averageCadence: 85,
          raw: {
            id: 22222,
            name: 'Test Run 2',
            type: 'Run',
          },
        },
      });
    });

    it('should refresh goal progress and recalculate currentValue', () => {
      return request(app.getHttpServer())
        .post('/graphql')
        .set('Cookie', `Authentication=${authToken}`)
        .send({
          query: `
            mutation {
              refreshGoalProgress(id: ${goalId}) {
                id
                currentValue
              }
            }
          `,
        })
        .expect(200)
        .expect(res => {
          expect(res.body.errors).toBeUndefined();
          expect(res.body.data.refreshGoalProgress.currentValue).toBe(25);
        });
    });

    it('should transition goal to COMPLETED when target reached', async () => {
      await prisma.goal.update({
        where: { id: goalId },
        data: { targetValue: 20 },
      });

      return request(app.getHttpServer())
        .post('/graphql')
        .set('Cookie', `Authentication=${authToken}`)
        .send({
          query: `
            mutation {
              refreshGoalProgress(id: ${goalId}) {
                id
                status
              }
            }
          `,
        })
        .expect(200)
        .expect(res => {
          expect(res.body.errors).toBeUndefined();
          expect(res.body.data.refreshGoalProgress.status).toBe('COMPLETED');
        });
    });
  });

  describe('complete workflow', () => {
    it('should execute full goal lifecycle: create → activities → refresh → complete → archive', async () => {
      let goalId: number;

      const createResponse = await request(app.getHttpServer())
        .post('/graphql')
        .set('Cookie', `Authentication=${authToken}`)
        .send({
          query: `
            mutation {
              createGoal(input: {
                title: "Complete 25km"
                targetType: DISTANCE
                targetValue: 25
                periodType: MONTHLY
                startDate: "2026-06-01"
              }) {
                id
                status
              }
            }
          `,
        })
        .expect(200);

      expect(createResponse.body.errors).toBeUndefined();
      goalId = createResponse.body.data.createGoal.id;
      expect(createResponse.body.data.createGoal.status).toBe('ACTIVE');

      await prisma.activity.create({
        data: {
          userId,
          stravaId: BigInt(33333),
          name: 'Test Run 3',
          type: 'Run',
          distance: 10000,
          movingTime: 3600,
          elapsedTime: 3600,
          totalElevationGain: 50,
          startDate: new Date('2026-06-05'),
          startDateLocal: new Date('2026-06-05'),
          timezone: '(GMT+00:00) UTC',
          averageSpeed: 2.78,
          maxSpeed: 3.5,
          averageHeartrate: 145,
          maxHeartrate: 165,
          kilojoules: 500,
          deviceWatts: false,
          hasKudoed: false,
          kudosCount: 0,
          averageCadence: 85,
          raw: {
            id: 33333,
            name: 'Test Run 3',
            type: 'Run',
          },
        },
      });

      await prisma.activity.create({
        data: {
          userId,
          stravaId: BigInt(44444),
          name: 'Test Run 4',
          type: 'Run',
          distance: 15000,
          movingTime: 5400,
          elapsedTime: 5400,
          totalElevationGain: 50,
          startDate: new Date('2026-06-12'),
          startDateLocal: new Date('2026-06-12'),
          timezone: '(GMT+00:00) UTC',
          averageSpeed: 2.78,
          maxSpeed: 3.5,
          averageHeartrate: 145,
          maxHeartrate: 165,
          kilojoules: 500,
          deviceWatts: false,
          hasKudoed: false,
          kudosCount: 0,
          averageCadence: 85,
          raw: {
            id: 44444,
            name: 'Test Run 4',
            type: 'Run',
          },
        },
      });

      const refreshResponse = await request(app.getHttpServer())
        .post('/graphql')
        .set('Cookie', `Authentication=${authToken}`)
        .send({
          query: `
            mutation {
              refreshGoalProgress(id: ${goalId}) {
                id
                currentValue
                status
              }
            }
          `,
        })
        .expect(200);

      expect(refreshResponse.body.errors).toBeUndefined();
      expect(refreshResponse.body.data.refreshGoalProgress.currentValue).toBe(25);
      expect(refreshResponse.body.data.refreshGoalProgress.status).toBe('COMPLETED');

      const archiveResponse = await request(app.getHttpServer())
        .post('/graphql')
        .set('Cookie', `Authentication=${authToken}`)
        .send({
          query: `
            mutation {
              archiveGoal(id: ${goalId}) {
                id
                status
              }
            }
          `,
        })
        .expect(200);

      expect(archiveResponse.body.errors).toBeUndefined();
      expect(archiveResponse.body.data.archiveGoal.status).toBe('ARCHIVED');
    });
  });
});
