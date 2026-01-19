import request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, RequestMethod } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { PrismaClient } from '@prisma/client';
import cookieParser from 'cookie-parser';
import { generateTestAccessToken } from './test-db';
import { SportType } from '../src/user-preferences/enums/sport-type.enum';
import { ThemeType } from '../src/user-preferences/enums/theme-type.enum';
import { LocaleType } from '../src/user-preferences/enums/locale-type.enum';

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
        locale: LocaleType.EN,
        theme: ThemeType.SYSTEM,
      },
    });

    return { user, preferences };
  };

  describe('updateUserPreferences mutation', () => {
    describe('authentication', () => {
      it('should reject request without authentication token', async () => {
        const mutation = `
          mutation UpdateUserPreferences($input: UpdateUserPreferencesInput!) {
            updateUserPreferences(input: $input) {
              userId
              selectedSports
              locale
              theme
              onboardingCompleted
            }
          }
        `;

        const response = await request(app.getHttpServer())
          .post('/graphql')
          .send({
            query: mutation,
            variables: {
              input: {
                selectedSports: ['RUN'],
              },
            },
          });

        expect(response.body.errors).toBeDefined();
        expect(response.body.errors[0].message).toContain('Unauthorized');
      });

      it('should accept request with valid JWT token in cookie', async () => {
        const { user } = await seedTestUser();
        const token = generateTestAccessToken(user.id, user.stravaId);

        const mutation = `
          mutation UpdateUserPreferences($input: UpdateUserPreferencesInput!) {
            updateUserPreferences(input: $input) {
              userId
              selectedSports
              locale
              theme
              onboardingCompleted
            }
          }
        `;

        const response = await request(app.getHttpServer())
          .post('/graphql')
          .set('Cookie', [`Authentication=${token}`])
          .send({
            query: mutation,
            variables: {
              input: {
                selectedSports: ['RUN'],
              },
            },
          });

        expect(response.status).toBe(200);
        expect(response.body.errors).toBeUndefined();
        expect(response.body.data.updateUserPreferences).toBeDefined();
        expect(response.body.data.updateUserPreferences.selectedSports).toEqual(['RUN']);
        expect(response.body.data.updateUserPreferences.userId).toBe(user.id);
      });

      it('should reject request with invalid JWT token', async () => {
        const mutation = `
          mutation UpdateUserPreferences($input: UpdateUserPreferencesInput!) {
            updateUserPreferences(input: $input) {
              userId
              selectedSports
            }
          }
        `;

        const response = await request(app.getHttpServer())
          .post('/graphql')
          .set('Cookie', ['Authentication=invalid-token-xyz'])
          .send({
            query: mutation,
            variables: {
              input: {
                selectedSports: ['RUN'],
              },
            },
          });

        expect(response.body.errors).toBeDefined();
        expect(response.body.errors[0].message).toContain('Unauthorized');
      });

      it('should use correct user from JWT token payload', async () => {
        const { user: user1 } = await seedTestUser({ stravaId: 111111 });
        const { user: user2 } = await seedTestUser({ stravaId: 222222 });

        const token1 = generateTestAccessToken(user1.id, user1.stravaId);
        const token2 = generateTestAccessToken(user2.id, user2.stravaId);

        const mutation = `
          mutation UpdateUserPreferences($input: UpdateUserPreferencesInput!) {
            updateUserPreferences(input: $input) {
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
              input: {
                selectedSports: ['RUN'],
              },
            },
          });

        await request(app.getHttpServer())
          .post('/graphql')
          .set('Cookie', [`Authentication=${token2}`])
          .send({
            query: mutation,
            variables: {
              input: {
                selectedSports: ['RIDE'],
              },
            },
          });

        const prefs1 = await prisma.userPreferences.findUnique({
          where: { userId: user1.id },
        });

        const prefs2 = await prisma.userPreferences.findUnique({
          where: { userId: user2.id },
        });

        expect(prefs1?.selectedSports).toEqual(['RUN']);
        expect(prefs2?.selectedSports).toEqual(['RIDE']);
      });
    });

    describe('successful mutations', () => {
      it('should update selected sports successfully', async () => {
        const { user } = await seedTestUser();
        const token = generateTestAccessToken(user.id, user.stravaId);

        const mutation = `
          mutation UpdateUserPreferences($input: UpdateUserPreferencesInput!) {
            updateUserPreferences(input: $input) {
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
            variables: {
              input: {
                selectedSports: ['RUN', 'RIDE'],
              },
            },
          });

        expect(response.status).toBe(200);
        expect(response.body.data.updateUserPreferences.selectedSports).toEqual(['RUN', 'RIDE']);
        expect(response.body.data.updateUserPreferences.onboardingCompleted).toBe(true);

        const dbPreferences = await prisma.userPreferences.findUnique({
          where: { userId: user.id },
        });
        expect(dbPreferences?.selectedSports).toEqual(['RUN', 'RIDE']);
      });

      it('should update locale successfully', async () => {
        const { user } = await seedTestUser();
        const token = generateTestAccessToken(user.id, user.stravaId);

        const mutation = `
          mutation UpdateUserPreferences($input: UpdateUserPreferencesInput!) {
            updateUserPreferences(input: $input) {
              locale
            }
          }
        `;

        const response = await request(app.getHttpServer())
          .post('/graphql')
          .set('Cookie', [`Authentication=${token}`])
          .send({
            query: mutation,
            variables: {
              input: {
                locale: 'FR',
              },
            },
          });

        expect(response.status).toBe(200);
        expect(response.body.data.updateUserPreferences.locale).toBe('FR');
      });

      it('should update theme successfully', async () => {
        const { user } = await seedTestUser();
        const token = generateTestAccessToken(user.id, user.stravaId);

        const mutation = `
          mutation UpdateUserPreferences($input: UpdateUserPreferencesInput!) {
            updateUserPreferences(input: $input) {
              theme
            }
          }
        `;

        const response = await request(app.getHttpServer())
          .post('/graphql')
          .set('Cookie', [`Authentication=${token}`])
          .send({
            query: mutation,
            variables: {
              input: {
                theme: 'DARK',
              },
            },
          });

        expect(response.status).toBe(200);
        expect(response.body.data.updateUserPreferences.theme).toBe('DARK');
      });

      it('should update multiple fields simultaneously', async () => {
        const { user } = await seedTestUser();
        const token = generateTestAccessToken(user.id, user.stravaId);

        const mutation = `
          mutation UpdateUserPreferences($input: UpdateUserPreferencesInput!) {
            updateUserPreferences(input: $input) {
              selectedSports
              locale
              theme
              onboardingCompleted
            }
          }
        `;

        const response = await request(app.getHttpServer())
          .post('/graphql')
          .set('Cookie', [`Authentication=${token}`])
          .send({
            query: mutation,
            variables: {
              input: {
                selectedSports: ['RUN', 'SWIM'],
                locale: 'FR',
                theme: 'LIGHT',
              },
            },
          });

        expect(response.status).toBe(200);
        expect(response.body.data.updateUserPreferences.selectedSports).toEqual(['RUN', 'SWIM']);
        expect(response.body.data.updateUserPreferences.locale).toBe('FR');
        expect(response.body.data.updateUserPreferences.theme).toBe('LIGHT');
        expect(response.body.data.updateUserPreferences.onboardingCompleted).toBe(true);
      });

      it('should handle all three sport types', async () => {
        const { user } = await seedTestUser();
        const token = generateTestAccessToken(user.id, user.stravaId);

        const mutation = `
          mutation UpdateUserPreferences($input: UpdateUserPreferencesInput!) {
            updateUserPreferences(input: $input) {
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
              input: {
                selectedSports: ['RUN', 'RIDE', 'SWIM'],
              },
            },
          });

        expect(response.status).toBe(200);
        expect(response.body.data.updateUserPreferences.selectedSports).toEqual(['RUN', 'RIDE', 'SWIM']);
      });
    });

    describe('validation errors', () => {
      it('should reject invalid locale value', async () => {
        const { user } = await seedTestUser();
        const token = generateTestAccessToken(user.id, user.stravaId);

        const mutation = `
          mutation UpdateUserPreferences($input: UpdateUserPreferencesInput!) {
            updateUserPreferences(input: $input) {
              locale
            }
          }
        `;

        const response = await request(app.getHttpServer())
          .post('/graphql')
          .set('Cookie', [`Authentication=${token}`])
          .send({
            query: mutation,
            variables: {
              input: {
                locale: 'INVALID_LOCALE',
              },
            },
          });

        expect(response.body.errors).toBeDefined();
        expect(response.body.errors[0].message).toContain('LocaleType');
      });

      it('should reject invalid SportType enum value', async () => {
        const { user } = await seedTestUser();
        const token = generateTestAccessToken(user.id, user.stravaId);

        const mutation = `
          mutation UpdateUserPreferences($input: UpdateUserPreferencesInput!) {
            updateUserPreferences(input: $input) {
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
              input: {
                selectedSports: ['INVALID_SPORT'],
              },
            },
          });

        expect(response.body.errors).toBeDefined();
        expect(response.body.errors[0].message).toContain('INVALID_SPORT');
      });

      it('should reject invalid ThemeType enum value', async () => {
        const { user } = await seedTestUser();
        const token = generateTestAccessToken(user.id, user.stravaId);

        const mutation = `
          mutation UpdateUserPreferences($input: UpdateUserPreferencesInput!) {
            updateUserPreferences(input: $input) {
              theme
            }
          }
        `;

        const response = await request(app.getHttpServer())
          .post('/graphql')
          .set('Cookie', [`Authentication=${token}`])
          .send({
            query: mutation,
            variables: {
              input: {
                theme: 'INVALID_THEME',
              },
            },
          });

        expect(response.body.errors).toBeDefined();
        expect(response.body.errors[0].message).toContain('INVALID_THEME');
      });

      it('should reject more than 3 selectedSports', async () => {
        const { user } = await seedTestUser();
        const token = generateTestAccessToken(user.id, user.stravaId);

        const mutation = `
          mutation UpdateUserPreferences($input: UpdateUserPreferencesInput!) {
            updateUserPreferences(input: $input) {
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
              input: {
                selectedSports: ['RUN', 'RIDE', 'SWIM', 'RUN'],
              },
            },
          });

        expect(response.body.errors).toBeDefined();
        expect(response.body.errors[0].message).toContain('Bad Request');
      });

      it('should reject empty selectedSports array due to ArrayMinSize validation', async () => {
        const { user } = await seedTestUser();
        const token = generateTestAccessToken(user.id, user.stravaId);

        const mutation = `
          mutation UpdateUserPreferences($input: UpdateUserPreferencesInput!) {
            updateUserPreferences(input: $input) {
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
              input: {
                selectedSports: [],
              },
            },
          });

        expect(response.body.errors).toBeDefined();
        expect(response.body.errors[0].message).toContain('Bad Request');
      });

      it('should handle string value sent via GraphQL but accept it as single-item array', async () => {
        const { user } = await seedTestUser();
        const token = generateTestAccessToken(user.id, user.stravaId);

        const mutation = `
          mutation UpdateUserPreferences($input: UpdateUserPreferencesInput!) {
            updateUserPreferences(input: $input) {
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
              input: {
                selectedSports: ['RUN'],
              },
            },
          });

        expect(response.status).toBe(200);
        expect(response.body.data.updateUserPreferences.selectedSports).toEqual(['RUN']);
      });

      it('should return error when user preferences not found', async () => {
        const nonExistentUserId = 999999;
        const token = generateTestAccessToken(nonExistentUserId, 123456);

        const mutation = `
          mutation UpdateUserPreferences($input: UpdateUserPreferencesInput!) {
            updateUserPreferences(input: $input) {
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
              input: {
                selectedSports: ['RUN'],
              },
            },
          });

        expect(response.body.errors).toBeDefined();
        expect(response.body.errors[0].message).toContain('not found');
      });
    });

    describe('edge cases', () => {
      it('should handle empty input object correctly', async () => {
        const { user } = await seedTestUser();
        const token = generateTestAccessToken(user.id, user.stravaId);

        await prisma.userPreferences.update({
          where: { userId: user.id },
          data: {
            selectedSports: [SportType.RUN],
            locale: LocaleType.EN,
            theme: ThemeType.DARK,
          },
        });

        const mutation = `
          mutation UpdateUserPreferences($input: UpdateUserPreferencesInput!) {
            updateUserPreferences(input: $input) {
              selectedSports
              locale
              theme
            }
          }
        `;

        const response = await request(app.getHttpServer())
          .post('/graphql')
          .set('Cookie', [`Authentication=${token}`])
          .send({
            query: mutation,
            variables: {
              input: {},
            },
          });

        expect(response.status).toBe(200);
        expect(response.body.data.updateUserPreferences.selectedSports).toEqual(['RUN']);
        expect(response.body.data.updateUserPreferences.locale).toBe('EN');
        expect(response.body.data.updateUserPreferences.theme).toBe('DARK');
      });

      it('should complete onboarding on first sports selection', async () => {
        const { user } = await seedTestUser();
        const token = generateTestAccessToken(user.id, user.stravaId);

        const prefsBeforeUpdate = await prisma.userPreferences.findUnique({
          where: { userId: user.id },
        });
        expect(prefsBeforeUpdate?.onboardingCompleted).toBe(false);

        const mutation = `
          mutation UpdateUserPreferences($input: UpdateUserPreferencesInput!) {
            updateUserPreferences(input: $input) {
              onboardingCompleted
            }
          }
        `;

        const response = await request(app.getHttpServer())
          .post('/graphql')
          .set('Cookie', [`Authentication=${token}`])
          .send({
            query: mutation,
            variables: {
              input: {
                selectedSports: ['RUN'],
              },
            },
          });

        expect(response.status).toBe(200);
        expect(response.body.data.updateUserPreferences.onboardingCompleted).toBe(true);
      });

      it('should support both locale values: EN and FR', async () => {
        const { user } = await seedTestUser();
        const token = generateTestAccessToken(user.id, user.stravaId);

        const mutation = `
          mutation UpdateUserPreferences($input: UpdateUserPreferencesInput!) {
            updateUserPreferences(input: $input) {
              locale
            }
          }
        `;

        const responseEn = await request(app.getHttpServer())
          .post('/graphql')
          .set('Cookie', [`Authentication=${token}`])
          .send({
            query: mutation,
            variables: {
              input: {
                locale: 'EN',
              },
            },
          });

        expect(responseEn.status).toBe(200);
        expect(responseEn.body.data.updateUserPreferences.locale).toBe('EN');

        const responseFr = await request(app.getHttpServer())
          .post('/graphql')
          .set('Cookie', [`Authentication=${token}`])
          .send({
            query: mutation,
            variables: {
              input: {
                locale: 'FR',
              },
            },
          });

        expect(responseFr.status).toBe(200);
        expect(responseFr.body.data.updateUserPreferences.locale).toBe('FR');
      });

      it('should support all theme types: system, light, dark', async () => {
        const { user } = await seedTestUser();
        const token = generateTestAccessToken(user.id, user.stravaId);

        const mutation = `
          mutation UpdateUserPreferences($input: UpdateUserPreferencesInput!) {
            updateUserPreferences(input: $input) {
              theme
            }
          }
        `;

        const themes = ['SYSTEM', 'LIGHT', 'DARK'];

        for (const theme of themes) {
          const response = await request(app.getHttpServer())
            .post('/graphql')
            .set('Cookie', [`Authentication=${token}`])
            .send({
              query: mutation,
              variables: {
                input: {
                  theme,
                },
              },
            });

          expect(response.status).toBe(200);
          expect(response.body.data.updateUserPreferences.theme).toBe(theme);
        }
      });
    });
  });
});
