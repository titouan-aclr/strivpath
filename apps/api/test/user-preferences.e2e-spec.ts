import request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, RequestMethod } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { PrismaClient } from '@prisma/client';
import cookieParser from 'cookie-parser';
import { generateTestAccessToken } from './test-db';
import { SportType } from '../src/user-preferences/enums/sport-type.enum';

describe('UserPreferences GraphQL (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaClient;

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

    prisma = new PrismaClient();
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  const seedTestUser = async (overrides?: { stravaId?: number; username?: string }) => {
    const stravaId = overrides?.stravaId ?? Math.floor(Math.random() * 1000000) + 100000;
    const username = overrides?.username ?? `testuser${stravaId}`;

    const user = await prisma.user.create({
      data: {
        stravaId,
        username,
        firstname: 'Test',
        lastname: 'User',
        sex: 'M',
        city: 'Test City',
        country: 'Test Country',
        profile: 'https://example.com/profile.jpg',
        profileMedium: 'https://example.com/profile_medium.jpg',
      },
    });

    const preferences = await prisma.userPreferences.create({
      data: {
        userId: user.id,
        selectedSports: [SportType.RUN],
        onboardingCompleted: false,
      },
    });

    return { user, preferences };
  };

  describe('completeOnboarding mutation', () => {
    describe('authentication', () => {
      it('should reject request without authentication token', async () => {
        const mutation = `
          mutation CompleteOnboarding {
            completeOnboarding {
              userId
              selectedSports
              onboardingCompleted
            }
          }
        `;

        const response = await request(app.getHttpServer()).post('/graphql').send({
          query: mutation,
        });

        expect(response.body.errors).toBeDefined();
        expect(response.body.errors[0].message).toContain('Unauthorized');
      });

      it('should accept request with valid JWT token in cookie', async () => {
        const { user } = await seedTestUser();
        const token = generateTestAccessToken(user.id, user.stravaId);

        const mutation = `
          mutation CompleteOnboarding {
            completeOnboarding {
              userId
              selectedSports
              onboardingCompleted
            }
          }
        `;

        const response = await request(app.getHttpServer())
          .post('/graphql')
          .set('Cookie', [`Authentication=${token}`])
          .send({
            query: mutation,
          });

        expect(response.status).toBe(200);
        expect(response.body.errors).toBeUndefined();
        expect(response.body.data.completeOnboarding).toBeDefined();
        expect(response.body.data.completeOnboarding.onboardingCompleted).toBe(true);
        expect(response.body.data.completeOnboarding.userId).toBe(user.id);
      });
    });

    describe('successful mutations', () => {
      it('should complete onboarding successfully', async () => {
        const { user } = await seedTestUser();
        const token = generateTestAccessToken(user.id, user.stravaId);

        const mutation = `
          mutation CompleteOnboarding {
            completeOnboarding {
              userId
              onboardingCompleted
            }
          }
        `;

        const response = await request(app.getHttpServer())
          .post('/graphql')
          .set('Cookie', [`Authentication=${token}`])
          .send({
            query: mutation,
          });

        expect(response.status).toBe(200);
        expect(response.body.data.completeOnboarding.onboardingCompleted).toBe(true);

        const dbPreferences = await prisma.userPreferences.findUnique({
          where: { userId: user.id },
        });
        expect(dbPreferences?.onboardingCompleted).toBe(true);
      });
    });

    describe('error cases', () => {
      it('should return error when user preferences not found', async () => {
        const nonExistentUserId = 999999;
        const token = generateTestAccessToken(nonExistentUserId, 123456);

        const mutation = `
          mutation CompleteOnboarding {
            completeOnboarding {
              onboardingCompleted
            }
          }
        `;

        const response = await request(app.getHttpServer())
          .post('/graphql')
          .set('Cookie', [`Authentication=${token}`])
          .send({
            query: mutation,
          });

        expect(response.body.errors).toBeDefined();
        expect(response.body.errors[0].message).toContain('not found');
      });

      it('should return error when no sports are selected', async () => {
        const { user } = await seedTestUser();
        const token = generateTestAccessToken(user.id, user.stravaId);

        await prisma.userPreferences.update({
          where: { userId: user.id },
          data: { selectedSports: [] },
        });

        const mutation = `
          mutation CompleteOnboarding {
            completeOnboarding {
              onboardingCompleted
            }
          }
        `;

        const response = await request(app.getHttpServer())
          .post('/graphql')
          .set('Cookie', [`Authentication=${token}`])
          .send({
            query: mutation,
          });

        expect(response.body.errors).toBeDefined();
        expect(response.body.errors[0].message).toContain(
          'Cannot complete onboarding without selecting at least one sport',
        );
      });
    });
  });

  describe('addSportToPreferences mutation', () => {
    describe('authentication', () => {
      it('should reject request without authentication token', async () => {
        const mutation = `
          mutation AddSportToPreferences($sport: SportType!) {
            addSportToPreferences(sport: $sport) {
              userId
              selectedSports
            }
          }
        `;

        const response = await request(app.getHttpServer())
          .post('/graphql')
          .send({
            query: mutation,
            variables: {
              sport: 'RIDE',
            },
          });

        expect(response.body.errors).toBeDefined();
        expect(response.body.errors[0].message).toContain('Unauthorized');
      });

      it('should accept request with valid JWT token in cookie', async () => {
        const { user } = await seedTestUser();
        const token = generateTestAccessToken(user.id, user.stravaId);

        const mutation = `
          mutation AddSportToPreferences($sport: SportType!) {
            addSportToPreferences(sport: $sport) {
              userId
              selectedSports
            }
          }
        `;

        const response = await request(app.getHttpServer())
          .post('/graphql')
          .set('Cookie', [`Authentication=${token}`])
          .send({
            query: mutation,
            variables: {
              sport: 'RIDE',
            },
          });

        expect(response.status).toBe(200);
        expect(response.body.errors).toBeUndefined();
        expect(response.body.data.addSportToPreferences).toBeDefined();
        expect(response.body.data.addSportToPreferences.selectedSports).toContain('RUN');
        expect(response.body.data.addSportToPreferences.selectedSports).toContain('RIDE');
      });

      it('should use correct user from JWT token payload', async () => {
        const { user: user1 } = await seedTestUser({ stravaId: 111111 });
        const { user: user2 } = await seedTestUser({ stravaId: 222222 });

        const token1 = generateTestAccessToken(user1.id, user1.stravaId);
        const token2 = generateTestAccessToken(user2.id, user2.stravaId);

        const mutation = `
          mutation AddSportToPreferences($sport: SportType!) {
            addSportToPreferences(sport: $sport) {
              userId
              selectedSports
            }
          }
        `;

        await request(app.getHttpServer())
          .post('/graphql')
          .set('Cookie', [`Authentication=${token1}`])
          .send({
            query: mutation,
            variables: {
              sport: 'RIDE',
            },
          });

        await request(app.getHttpServer())
          .post('/graphql')
          .set('Cookie', [`Authentication=${token2}`])
          .send({
            query: mutation,
            variables: {
              sport: 'SWIM',
            },
          });

        const prefs1 = await prisma.userPreferences.findUnique({
          where: { userId: user1.id },
        });

        const prefs2 = await prisma.userPreferences.findUnique({
          where: { userId: user2.id },
        });

        expect(prefs1?.selectedSports).toContain('RIDE');
        expect(prefs2?.selectedSports).toContain('SWIM');
      });
    });

    describe('successful mutations', () => {
      it('should add sport successfully', async () => {
        const { user } = await seedTestUser();
        const token = generateTestAccessToken(user.id, user.stravaId);

        const mutation = `
          mutation AddSportToPreferences($sport: SportType!) {
            addSportToPreferences(sport: $sport) {
              userId
              selectedSports
            }
          }
        `;

        const response = await request(app.getHttpServer())
          .post('/graphql')
          .set('Cookie', [`Authentication=${token}`])
          .send({
            query: mutation,
            variables: {
              sport: 'RIDE',
            },
          });

        expect(response.status).toBe(200);
        expect(response.body.data.addSportToPreferences.selectedSports).toContain('RUN');
        expect(response.body.data.addSportToPreferences.selectedSports).toContain('RIDE');

        const dbPreferences = await prisma.userPreferences.findUnique({
          where: { userId: user.id },
        });
        expect(dbPreferences?.selectedSports).toContain('RUN');
        expect(dbPreferences?.selectedSports).toContain('RIDE');
      });

      it('should handle all three sport types', async () => {
        const { user } = await seedTestUser();
        const token = generateTestAccessToken(user.id, user.stravaId);

        const mutation = `
          mutation AddSportToPreferences($sport: SportType!) {
            addSportToPreferences(sport: $sport) {
              selectedSports
            }
          }
        `;

        await request(app.getHttpServer())
          .post('/graphql')
          .set('Cookie', [`Authentication=${token}`])
          .send({
            query: mutation,
            variables: { sport: 'RIDE' },
          });

        const response = await request(app.getHttpServer())
          .post('/graphql')
          .set('Cookie', [`Authentication=${token}`])
          .send({
            query: mutation,
            variables: { sport: 'SWIM' },
          });

        expect(response.status).toBe(200);
        expect(response.body.data.addSportToPreferences.selectedSports).toContain('RUN');
        expect(response.body.data.addSportToPreferences.selectedSports).toContain('RIDE');
        expect(response.body.data.addSportToPreferences.selectedSports).toContain('SWIM');
      });
    });

    describe('validation errors', () => {
      it('should reject invalid SportType enum value', async () => {
        const { user } = await seedTestUser();
        const token = generateTestAccessToken(user.id, user.stravaId);

        const mutation = `
          mutation AddSportToPreferences($sport: SportType!) {
            addSportToPreferences(sport: $sport) {
              selectedSports
            }
          }
        `;

        const response = await request(app.getHttpServer())
          .post('/graphql')
          .set('Cookie', [`Authentication=${token}`])
          .send({
            query: mutation,
            variables: {
              sport: 'INVALID_SPORT',
            },
          });

        expect(response.body.errors).toBeDefined();
        expect(response.body.errors[0].message).toContain('INVALID_SPORT');
      });

      it('should reject sport that already exists in preferences', async () => {
        const { user } = await seedTestUser();
        const token = generateTestAccessToken(user.id, user.stravaId);

        const mutation = `
          mutation AddSportToPreferences($sport: SportType!) {
            addSportToPreferences(sport: $sport) {
              selectedSports
            }
          }
        `;

        const response = await request(app.getHttpServer())
          .post('/graphql')
          .set('Cookie', [`Authentication=${token}`])
          .send({
            query: mutation,
            variables: {
              sport: 'RUN',
            },
          });

        expect(response.body.errors).toBeDefined();
        expect(response.body.errors[0].message).toContain('Sport RUN is already in user preferences');
      });

      it('should return error when user preferences not found', async () => {
        const nonExistentUserId = 999999;
        const token = generateTestAccessToken(nonExistentUserId, 123456);

        const mutation = `
          mutation AddSportToPreferences($sport: SportType!) {
            addSportToPreferences(sport: $sport) {
              selectedSports
            }
          }
        `;

        const response = await request(app.getHttpServer())
          .post('/graphql')
          .set('Cookie', [`Authentication=${token}`])
          .send({
            query: mutation,
            variables: {
              sport: 'RUN',
            },
          });

        expect(response.body.errors).toBeDefined();
        expect(response.body.errors[0].message).toContain('not found');
      });
    });
  });

  describe('removeSportFromPreferences mutation', () => {
    describe('authentication', () => {
      it('should reject request without authentication token', async () => {
        const mutation = `
          mutation RemoveSportFromPreferences($sport: SportType!, $deleteData: Boolean!) {
            removeSportFromPreferences(sport: $sport, deleteData: $deleteData)
          }
        `;

        const response = await request(app.getHttpServer())
          .post('/graphql')
          .send({
            query: mutation,
            variables: {
              sport: 'RUN',
              deleteData: false,
            },
          });

        expect(response.body.errors).toBeDefined();
        expect(response.body.errors[0].message).toContain('Unauthorized');
      });
    });

    describe('successful mutations', () => {
      it('should remove sport successfully', async () => {
        const { user } = await seedTestUser();
        const token = generateTestAccessToken(user.id, user.stravaId);

        await prisma.userPreferences.update({
          where: { userId: user.id },
          data: { selectedSports: ['RUN', 'RIDE'] },
        });

        const mutation = `
          mutation RemoveSportFromPreferences($sport: SportType!, $deleteData: Boolean!) {
            removeSportFromPreferences(sport: $sport, deleteData: $deleteData)
          }
        `;

        const response = await request(app.getHttpServer())
          .post('/graphql')
          .set('Cookie', [`Authentication=${token}`])
          .send({
            query: mutation,
            variables: {
              sport: 'RIDE',
              deleteData: false,
            },
          });

        expect(response.status).toBe(200);
        expect(response.body.data.removeSportFromPreferences).toBe(true);

        const dbPreferences = await prisma.userPreferences.findUnique({
          where: { userId: user.id },
        });
        expect(dbPreferences?.selectedSports).toEqual(['RUN']);
      });
    });

    describe('validation errors', () => {
      it('should reject removing last sport', async () => {
        const { user } = await seedTestUser();
        const token = generateTestAccessToken(user.id, user.stravaId);

        const mutation = `
          mutation RemoveSportFromPreferences($sport: SportType!, $deleteData: Boolean!) {
            removeSportFromPreferences(sport: $sport, deleteData: $deleteData)
          }
        `;

        const response = await request(app.getHttpServer())
          .post('/graphql')
          .set('Cookie', [`Authentication=${token}`])
          .send({
            query: mutation,
            variables: {
              sport: 'RUN',
              deleteData: false,
            },
          });

        expect(response.body.errors).toBeDefined();
        expect(response.body.errors[0].message).toContain('Cannot remove last sport');
      });

      it('should reject removing sport not in preferences', async () => {
        const { user } = await seedTestUser();
        const token = generateTestAccessToken(user.id, user.stravaId);

        const mutation = `
          mutation RemoveSportFromPreferences($sport: SportType!, $deleteData: Boolean!) {
            removeSportFromPreferences(sport: $sport, deleteData: $deleteData)
          }
        `;

        const response = await request(app.getHttpServer())
          .post('/graphql')
          .set('Cookie', [`Authentication=${token}`])
          .send({
            query: mutation,
            variables: {
              sport: 'SWIM',
              deleteData: false,
            },
          });

        expect(response.body.errors).toBeDefined();
        expect(response.body.errors[0].message).toContain('Sport SWIM is not in user preferences');
      });
    });
  });
});
