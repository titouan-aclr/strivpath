import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, RequestMethod } from '@nestjs/common';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import { AppModule } from '../../src/app.module';
import { StravaService } from '../../src/strava/strava.service';
import { PrismaService } from '../../src/database/prisma.service';
import { getTestPrismaClient, seedTestUser } from '../test-db';
import { StravaTokenResponse, StravaAthleteResponse } from '../../src/strava/types';

const mockStravaAthlete: StravaAthleteResponse = {
  id: 123456789,
  username: 'testathlete',
  resource_state: 3,
  firstname: 'Test',
  lastname: 'Athlete',
  bio: 'Test bio',
  city: 'Test City',
  state: 'Test State',
  country: 'Test Country',
  sex: 'M',
  premium: false,
  summit: false,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  badge_type_id: 0,
  weight: 70,
  profile_medium: 'https://example.com/profile_medium.jpg',
  profile: 'https://example.com/profile.jpg',
  friend: null,
  follower: null,
  blocked: false,
  can_follow: true,
  follower_count: 10,
  friend_count: 5,
  mutual_friend_count: 2,
  athlete_type: 1,
  date_preference: 'en-US',
  measurement_preference: 'feet',
  clubs: [],
  ftp: null,
  bikes: [],
  shoes: [],
};

const mockStravaTokenResponse: StravaTokenResponse = {
  token_type: 'Bearer',
  expires_at: Math.floor(Date.now() / 1000) + 21600,
  expires_in: 21600,
  refresh_token: 'mock_refresh_token',
  access_token: 'mock_access_token',
  athlete: mockStravaAthlete,
};

describe('OAuth Callback Integration', () => {
  describe('Basic OAuth flows', () => {
    let app: INestApplication;
    let stravaService: StravaService;
    let prisma: ReturnType<typeof getTestPrismaClient>;

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

      stravaService = moduleFixture.get<StravaService>(StravaService);
      prisma = getTestPrismaClient();
    });

    afterAll(async () => {
      await app.close();
    });

    describe('GET /auth/strava/callback', () => {
      it('should complete OAuth flow and set cookies on success', async () => {
        jest.spyOn(stravaService, 'exchangeCodeForToken').mockResolvedValue(mockStravaTokenResponse);

        const response = await request(app.getHttpServer()).get('/v1/auth/strava/callback?code=test-code');

        expect(response.status).toBe(302);
        expect(response.header.location).toMatch(/^http:\/\/localhost:3000\/(dashboard|onboarding)$/);

        const cookies = response.headers['set-cookie'] as unknown as string[];
        expect(cookies).toBeDefined();
        expect(Array.isArray(cookies)).toBe(true);

        const authCookie = cookies.find((cookie: string) => cookie.startsWith('Authentication='));
        const refreshCookie = cookies.find((cookie: string) => cookie.startsWith('RefreshToken='));

        expect(authCookie).toBeDefined();
        expect(refreshCookie).toBeDefined();

        expect(authCookie).toContain('HttpOnly');
        expect(authCookie).toContain('Path=/');
        expect(refreshCookie).toContain('HttpOnly');
        expect(refreshCookie).toContain('Path=/');

        const dbUser = await prisma.user.findUnique({
          where: { stravaId: mockStravaAthlete.id },
          include: { preferences: true, tokens: true, refreshTokens: true },
        });

        expect(dbUser).toBeDefined();
        expect(dbUser?.username).toBe(mockStravaAthlete.username);
        expect(dbUser?.preferences).toBeDefined();
        expect(dbUser?.tokens).toHaveLength(1);
        expect(dbUser?.tokens[0].accessToken).toBe(mockStravaTokenResponse.access_token);
        expect(dbUser?.refreshTokens.length).toBeGreaterThanOrEqual(1);
      });

      it('should redirect to onboarding for new user', async () => {
        jest.spyOn(stravaService, 'exchangeCodeForToken').mockResolvedValue(mockStravaTokenResponse);

        const response = await request(app.getHttpServer()).get('/v1/auth/strava/callback?code=test-code-new-user');

        expect(response.status).toBe(302);
        expect(response.header.location).toBe('http://localhost:3000/onboarding');

        const dbUser = await prisma.user.findUnique({
          where: { stravaId: mockStravaAthlete.id },
          include: { preferences: true },
        });

        expect(dbUser?.preferences?.onboardingCompleted).toBe(false);
      });

      it('should redirect to dashboard for returning user', async () => {
        const { user } = await seedTestUser({ stravaId: mockStravaAthlete.id });

        await prisma.userPreferences.update({
          where: { userId: user.id },
          data: { onboardingCompleted: true },
        });

        jest.spyOn(stravaService, 'exchangeCodeForToken').mockResolvedValue(mockStravaTokenResponse);

        const response = await request(app.getHttpServer()).get('/v1/auth/strava/callback?code=test-code-returning');

        expect(response.status).toBe(302);
        expect(response.header.location).toBe('http://localhost:3000/dashboard');
      });

      it('should redirect to error page when Strava returns error', async () => {
        const response = await request(app.getHttpServer()).get(
          '/v1/auth/strava/callback?error=access_denied&scope=read',
        );

        expect(response.status).toBe(302);
        expect(response.header.location).toBe('http://localhost:3000/auth/error?error=access_denied');

        const cookies = response.headers['set-cookie'];
        const authCookie = cookies
          ? (cookies as unknown as string[]).find((cookie: string) => cookie.startsWith('Authentication='))
          : undefined;
        const refreshCookie = cookies
          ? (cookies as unknown as string[]).find((cookie: string) => cookie.startsWith('RefreshToken='))
          : undefined;

        expect(authCookie).toBeUndefined();
        expect(refreshCookie).toBeUndefined();
      });

      it('should redirect to error page when code missing', async () => {
        const response = await request(app.getHttpServer()).get('/v1/auth/strava/callback');

        expect(response.status).toBe(302);
        expect(response.header.location).toBe('http://localhost:3000/auth/error?error=missing_code');
      });
    });
  });

  describe('Error handling flows', () => {
    let app: INestApplication;
    let stravaService: StravaService;

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

      stravaService = moduleFixture.get<StravaService>(StravaService);
    });

    afterAll(async () => {
      await app.close();
    });

    describe('GET /auth/strava/callback', () => {
      it('should redirect to error page on Strava API failure', async () => {
        jest.spyOn(stravaService, 'exchangeCodeForToken').mockRejectedValue(new Error('Strava API error'));

        const response = await request(app.getHttpServer()).get('/v1/auth/strava/callback?code=invalid-code');

        expect(response.status).toBe(302);
        expect(response.header.location).toBe('http://localhost:3000/auth/error?error=auth_failed');
      });
    });
  });

  describe('Re-authentication flows', () => {
    let app: INestApplication;
    let stravaService: StravaService;
    let prisma: ReturnType<typeof getTestPrismaClient>;

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

      stravaService = moduleFixture.get<StravaService>(StravaService);
      prisma = getTestPrismaClient();
    });

    afterAll(async () => {
      await app.close();
    });

    describe('GET /auth/strava/callback', () => {
      it('should update existing user profile on re-authentication', async () => {
        const { user: existingUser } = await seedTestUser({ stravaId: 987654321 });

        const updatedAthlete: StravaAthleteResponse = {
          ...mockStravaAthlete,
          id: existingUser.stravaId,
          username: 'updatedusername',
          firstname: 'Updated',
          lastname: 'Name',
          city: 'New City',
        };

        const updatedTokenResponse: StravaTokenResponse = {
          ...mockStravaTokenResponse,
          athlete: updatedAthlete,
          access_token: 'new_access_token',
          refresh_token: 'new_refresh_token',
        };

        jest.spyOn(stravaService, 'exchangeCodeForToken').mockResolvedValue(updatedTokenResponse);

        const response = await request(app.getHttpServer()).get('/v1/auth/strava/callback?code=test-code-update');

        expect(response.status).toBe(302);

        const dbUser = await prisma.user.findUnique({
          where: { id: existingUser.id },
          include: { tokens: { orderBy: { createdAt: 'desc' } } },
        });

        expect(dbUser?.username).toBe('updatedusername');
        expect(dbUser?.firstname).toBe('Updated');
        expect(dbUser?.lastname).toBe('Name');
        expect(dbUser?.city).toBe('New City');
        expect(dbUser?.tokens[0].accessToken).toBe('new_access_token');
        expect(dbUser?.tokens[0].refreshToken).toBe('new_refresh_token');
      });

      it('should create new refresh token on each login', async () => {
        const { user } = await seedTestUser({ stravaId: 555555555 });

        const customAthlete: StravaAthleteResponse = {
          ...mockStravaAthlete,
          id: user.stravaId,
        };

        const customTokenResponse: StravaTokenResponse = {
          ...mockStravaTokenResponse,
          athlete: customAthlete,
        };

        jest.spyOn(stravaService, 'exchangeCodeForToken').mockResolvedValue(customTokenResponse);

        await request(app.getHttpServer()).get('/v1/auth/strava/callback?code=first-login');

        const tokensAfterFirst = await prisma.refreshToken.findMany({
          where: { userId: user.id },
        });

        expect(tokensAfterFirst.length).toBeGreaterThanOrEqual(1);
        const firstJti = tokensAfterFirst[0].jti;

        await request(app.getHttpServer()).get('/v1/auth/strava/callback?code=second-login');

        const tokensAfterSecond = await prisma.refreshToken.findMany({
          where: { userId: user.id },
          orderBy: { createdAt: 'desc' },
        });

        expect(tokensAfterSecond.length).toBeGreaterThanOrEqual(2);
        expect(tokensAfterSecond[0].jti).not.toBe(firstJti);
        expect(tokensAfterSecond[0].jti).toMatch(
          /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
        );
      });
    });
  });
});
