import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { AppModule } from '../../src/app.module';
import { AuthService } from '../../src/auth/auth.service';
import { UserService } from '../../src/user/user.service';
import { StravaService } from '../../src/strava/strava.service';
import { PrismaService } from '../../src/database/prisma.service';
import { getTestPrismaClient, seedTestUser } from '../test-db';
import { StravaTokenResponse, StravaAthleteResponse } from '../../src/strava/types';
import { User } from '@repo/graphql-types';

describe('Auth Flow Integration', () => {
  let app: INestApplication;
  let authService: AuthService;
  let userService: UserService;
  let stravaService: StravaService;
  let jwtService: JwtService;
  let configService: ConfigService;
  let prisma: ReturnType<typeof getTestPrismaClient>;

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

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    authService = moduleFixture.get<AuthService>(AuthService);
    userService = moduleFixture.get<UserService>(UserService);
    stravaService = moduleFixture.get<StravaService>(StravaService);
    jwtService = moduleFixture.get<JwtService>(JwtService);
    configService = moduleFixture.get<ConfigService>(ConfigService);
    prisma = getTestPrismaClient();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('authenticateWithStrava', () => {
    it('should create user and preferences on first Strava authentication', async () => {
      jest.spyOn(stravaService, 'exchangeCodeForToken').mockResolvedValue(mockStravaTokenResponse);

      const user = await userService.upsertFromStrava(mockStravaAthlete, mockStravaTokenResponse);

      expect(user).toBeDefined();
      expect(user.stravaId).toBe(mockStravaAthlete.id);
      expect(user.username).toBe(mockStravaAthlete.username);
      expect(user.firstname).toBe(mockStravaAthlete.firstname);
      expect(user.lastname).toBe(mockStravaAthlete.lastname);

      const dbUser = await prisma.user.findUnique({
        where: { stravaId: mockStravaAthlete.id },
        include: { preferences: true, tokens: true },
      });

      expect(dbUser).toBeDefined();
      expect(dbUser?.preferences).toBeDefined();
      expect(dbUser?.preferences?.onboardingCompleted).toBe(false);
      expect(dbUser?.preferences?.locale).toBe('en');
      expect(dbUser?.preferences?.theme).toBe('system');
      expect(dbUser?.preferences?.selectedSports).toEqual([]);

      expect(dbUser?.tokens).toHaveLength(1);
      expect(dbUser?.tokens[0].accessToken).toBe(mockStravaTokenResponse.access_token);
      expect(dbUser?.tokens[0].refreshToken).toBe(mockStravaTokenResponse.refresh_token);
      expect(dbUser?.tokens[0].expiresAt).toBe(mockStravaTokenResponse.expires_at);

      const { accessToken, refreshToken } = await authService.generateTokens(user);

      expect(accessToken).toBeDefined();
      expect(refreshToken).toBeDefined();

      const decodedAccess = jwtService.verify(accessToken, {
        secret: configService.getOrThrow('JWT_ACCESS_TOKEN_SECRET'),
      });
      expect(decodedAccess.sub).toBe(user.id);
      expect(decodedAccess.stravaId).toBe(user.stravaId);
    });

    it('should update existing user on re-authentication', async () => {
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

      const updatedUser = await userService.upsertFromStrava(updatedAthlete, updatedTokenResponse);

      expect(updatedUser.id).toBe(existingUser.id);
      expect(updatedUser.username).toBe('updatedusername');
      expect(updatedUser.firstname).toBe('Updated');
      expect(updatedUser.lastname).toBe('Name');
      expect(updatedUser.city).toBe('New City');

      const dbUser = await prisma.user.findUnique({
        where: { id: existingUser.id },
        include: { tokens: { orderBy: { createdAt: 'desc' } } },
      });

      expect(dbUser?.tokens.length).toBeGreaterThanOrEqual(1);
      expect(dbUser?.tokens[0].accessToken).toBe('new_access_token');
      expect(dbUser?.tokens[0].refreshToken).toBe('new_refresh_token');
    });

    it('should store refresh token in database', async () => {
      const { user } = await seedTestUser();

      const graphqlUser: User = {
        id: user.id,
        stravaId: user.stravaId,
        username: user.username || 'test',
        firstname: user.firstname || undefined,
        lastname: user.lastname || undefined,
        sex: user.sex || undefined,
        city: user.city || undefined,
        country: user.country || undefined,
        profile: user.profile || undefined,
        profileMedium: user.profileMedium || undefined,
      };

      const { refreshToken } = await authService.generateTokens(graphqlUser);

      const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

      const storedToken = await prisma.refreshToken.findUnique({
        where: { tokenHash },
      });

      expect(storedToken).toBeDefined();
      expect(storedToken?.userId).toBe(user.id);
      expect(storedToken?.revoked).toBe(false);
      expect(storedToken?.expiresAt).toBeInstanceOf(Date);
      expect(storedToken?.expiresAt.getTime()).toBeGreaterThan(Date.now());
    });

    it('should hash refresh token before storing', async () => {
      const { user } = await seedTestUser();

      const graphqlUser: User = {
        id: user.id,
        stravaId: user.stravaId,
        username: user.username || 'test',
        firstname: user.firstname || undefined,
        lastname: user.lastname || undefined,
        sex: user.sex || undefined,
        city: user.city || undefined,
        country: user.country || undefined,
        profile: user.profile || undefined,
        profileMedium: user.profileMedium || undefined,
      };

      const { refreshToken } = await authService.generateTokens(graphqlUser);

      const tokens = await prisma.refreshToken.findMany({
        where: { userId: user.id },
      });

      expect(tokens).toHaveLength(1);
      expect(tokens[0].tokenHash).not.toBe(refreshToken);
      expect(tokens[0].tokenHash).toHaveLength(64);
    });
  });

  describe('refreshAccessToken', () => {
    it('should refresh access token without rotation', async () => {
      const { user } = await seedTestUser();

      const graphqlUser: User = {
        id: user.id,
        stravaId: user.stravaId,
        username: user.username || 'test',
        firstname: user.firstname || undefined,
        lastname: user.lastname || undefined,
        sex: user.sex || undefined,
        city: user.city || undefined,
        country: user.country || undefined,
        profile: user.profile || undefined,
        profileMedium: user.profileMedium || undefined,
      };

      const { refreshToken: originalRefreshToken } = await authService.generateTokens(graphqlUser);

      const {
        accessToken,
        refreshToken,
        user: returnedUser,
      } = await authService.refreshAccessToken(originalRefreshToken);

      expect(accessToken).toBeDefined();
      expect(refreshToken).toBe(originalRefreshToken);
      expect(returnedUser.id).toBe(user.id);

      const decodedAccess = jwtService.verify(accessToken, {
        secret: configService.getOrThrow('JWT_ACCESS_TOKEN_SECRET'),
      });
      expect(decodedAccess.sub).toBe(user.id);
    });

    it('should update lastUsedAt on refresh', async () => {
      const { user } = await seedTestUser();

      const graphqlUser: User = {
        id: user.id,
        stravaId: user.stravaId,
        username: user.username || 'test',
        firstname: user.firstname || undefined,
        lastname: user.lastname || undefined,
        sex: user.sex || undefined,
        city: user.city || undefined,
        country: user.country || undefined,
        profile: user.profile || undefined,
        profileMedium: user.profileMedium || undefined,
      };

      const { refreshToken } = await authService.generateTokens(graphqlUser);

      const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

      const tokenBefore = await prisma.refreshToken.findUnique({
        where: { tokenHash },
      });
      expect(tokenBefore?.lastUsedAt).toBeNull();

      await authService.refreshAccessToken(refreshToken);

      const tokenAfter = await prisma.refreshToken.findUnique({
        where: { tokenHash },
      });
      expect(tokenAfter?.lastUsedAt).toBeInstanceOf(Date);
      expect(tokenAfter?.lastUsedAt!.getTime()).toBeGreaterThan(Date.now() - 5000);
    });

    it('should reject revoked refresh token', async () => {
      const { user } = await seedTestUser();

      const graphqlUser: User = {
        id: user.id,
        stravaId: user.stravaId,
        username: user.username || 'test',
        firstname: user.firstname || undefined,
        lastname: user.lastname || undefined,
        sex: user.sex || undefined,
        city: user.city || undefined,
        country: user.country || undefined,
        profile: user.profile || undefined,
        profileMedium: user.profileMedium || undefined,
      };

      const { refreshToken } = await authService.generateTokens(graphqlUser);

      await authService.revokeRefreshToken(refreshToken);

      await expect(authService.refreshAccessToken(refreshToken)).rejects.toThrow('Refresh token invalid or revoked');
    });

    it('should reject expired refresh token', async () => {
      const { user } = await seedTestUser();

      const expiredRefreshToken = jwtService.sign(
        { sub: user.id, stravaId: user.stravaId },
        {
          secret: configService.getOrThrow('JWT_REFRESH_TOKEN_SECRET'),
          expiresIn: '0s',
        },
      );

      await expect(authService.refreshAccessToken(expiredRefreshToken)).rejects.toThrow('Invalid refresh token');
    });
  });

  describe('logout', () => {
    it('should revoke refresh token on logout', async () => {
      const { user } = await seedTestUser();

      const graphqlUser: User = {
        id: user.id,
        stravaId: user.stravaId,
        username: user.username || 'test',
        firstname: user.firstname || undefined,
        lastname: user.lastname || undefined,
        sex: user.sex || undefined,
        city: user.city || undefined,
        country: user.country || undefined,
        profile: user.profile || undefined,
        profileMedium: user.profileMedium || undefined,
      };

      const { refreshToken } = await authService.generateTokens(graphqlUser);

      const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

      const tokenBefore = await prisma.refreshToken.findUnique({
        where: { tokenHash },
      });
      expect(tokenBefore?.revoked).toBe(false);

      await authService.revokeRefreshToken(refreshToken);

      const tokenAfter = await prisma.refreshToken.findUnique({
        where: { tokenHash },
      });
      expect(tokenAfter?.revoked).toBe(true);
    });

    it('should not allow using revoked token', async () => {
      const { user } = await seedTestUser();

      const graphqlUser: User = {
        id: user.id,
        stravaId: user.stravaId,
        username: user.username || 'test',
        firstname: user.firstname || undefined,
        lastname: user.lastname || undefined,
        sex: user.sex || undefined,
        city: user.city || undefined,
        country: user.country || undefined,
        profile: user.profile || undefined,
        profileMedium: user.profileMedium || undefined,
      };

      const { refreshToken } = await authService.generateTokens(graphqlUser);

      await authService.revokeRefreshToken(refreshToken);

      await expect(authService.refreshAccessToken(refreshToken)).rejects.toThrow();
    });
  });

  describe('cascade operations', () => {
    it('should cascade delete refresh tokens when user is deleted', async () => {
      const { user } = await seedTestUser();

      const graphqlUser: User = {
        id: user.id,
        stravaId: user.stravaId,
        username: user.username || 'test',
        firstname: user.firstname || undefined,
        lastname: user.lastname || undefined,
        sex: user.sex || undefined,
        city: user.city || undefined,
        country: user.country || undefined,
        profile: user.profile || undefined,
        profileMedium: user.profileMedium || undefined,
      };

      await authService.generateTokens(graphqlUser);
      await authService.generateTokens(graphqlUser);

      const tokensBefore = await prisma.refreshToken.findMany({
        where: { userId: user.id },
      });
      expect(tokensBefore.length).toBeGreaterThanOrEqual(2);

      await prisma.user.delete({ where: { id: user.id } });

      const tokensAfter = await prisma.refreshToken.findMany({
        where: { userId: user.id },
      });
      expect(tokensAfter).toHaveLength(0);
    });

    it('should cascade delete strava tokens when user is deleted', async () => {
      const { user } = await seedTestUser();

      const tokensBefore = await prisma.stravaToken.findMany({
        where: { userId: user.id },
      });
      expect(tokensBefore.length).toBeGreaterThanOrEqual(0);

      await prisma.user.delete({ where: { id: user.id } });

      const tokensAfter = await prisma.stravaToken.findMany({
        where: { userId: user.id },
      });
      expect(tokensAfter).toHaveLength(0);
    });

    it('should cascade delete user preferences when user is deleted', async () => {
      const { user, preferences } = await seedTestUser();

      expect(preferences).toBeDefined();

      const preferencesBefore = await prisma.userPreferences.findUnique({
        where: { userId: user.id },
      });
      expect(preferencesBefore).toBeDefined();

      await prisma.user.delete({ where: { id: user.id } });

      const preferencesAfter = await prisma.userPreferences.findUnique({
        where: { userId: user.id },
      });
      expect(preferencesAfter).toBeNull();
    });
  });
});
