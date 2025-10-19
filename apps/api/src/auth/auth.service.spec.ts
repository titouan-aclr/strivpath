import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrismaService } from '../database/prisma.service';
import { UserService } from '../user/user.service';
import { StravaService } from '../strava/strava.service';
import { User } from '@repo/graphql-types';

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: JwtService;
  let configService: ConfigService;
  let prismaService: PrismaService;
  let userService: UserService;
  let stravaService: StravaService;

  const mockUser: User = {
    id: 1,
    stravaId: 12345,
    username: 'testuser',
    firstname: 'Test',
    lastname: 'User',
    sex: 'M',
    city: 'TestCity',
    country: 'TestCountry',
    profile: 'https://example.com/profile.jpg',
    profileMedium: 'https://example.com/profile-medium.jpg',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
  };

  const mockConfigService = {
    getOrThrow: jest.fn(),
    get: jest.fn(),
  };

  const mockPrismaService = {
    refreshToken: {
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    userPreferences: {
      findUnique: jest.fn(),
    },
  };

  const mockUserService = {
    findById: jest.fn(),
    upsertFromStrava: jest.fn(),
  };

  const mockStravaService = {
    exchangeCodeForToken: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: UserService, useValue: mockUserService },
        { provide: StravaService, useValue: mockStravaService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService);
    prismaService = module.get<PrismaService>(PrismaService);
    userService = module.get<UserService>(UserService);
    stravaService = module.get<StravaService>(StravaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateTokens', () => {
    it('should generate both access and refresh tokens and store refresh token in DB', async () => {
      const mockAccessToken = 'mock-access-token';
      const mockRefreshToken = 'mock-refresh-token';
      const deviceFingerprint = 'test-device';

      mockConfigService.getOrThrow.mockReturnValue('secret');
      mockConfigService.get.mockReturnValueOnce('15m').mockReturnValueOnce('7d').mockReturnValueOnce('7d');
      mockJwtService.sign.mockReturnValueOnce(mockAccessToken).mockReturnValueOnce(mockRefreshToken);
      mockPrismaService.refreshToken.create.mockResolvedValue({});

      const result = await service.generateTokens(mockUser, deviceFingerprint);

      expect(result).toEqual({
        accessToken: mockAccessToken,
        refreshToken: mockRefreshToken,
      });
      expect(jwtService.sign).toHaveBeenCalledTimes(2);

      const accessTokenCall = jwtService.sign.mock.calls[0][0];
      expect(accessTokenCall).toEqual({
        sub: mockUser.id,
        stravaId: mockUser.stravaId,
      });
      expect(accessTokenCall).not.toHaveProperty('jti');

      const refreshTokenCall = jwtService.sign.mock.calls[1][0];
      expect(refreshTokenCall).toEqual({
        sub: mockUser.id,
        stravaId: mockUser.stravaId,
        jti: expect.stringMatching(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i),
      });

      const createCall = prismaService.refreshToken.create.mock.calls[0][0];
      expect(createCall.data).toEqual({
        userId: mockUser.id,
        jti: expect.stringMatching(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i),
        expiresAt: expect.any(Date),
        deviceFingerprint,
      });
    });

    it('should calculate expiresAt from JWT_REFRESH_TOKEN_EXPIRATION config', async () => {
      const mockAccessToken = 'mock-access-token';
      const mockRefreshToken = 'mock-refresh-token';

      mockConfigService.getOrThrow.mockReturnValue('secret');
      mockConfigService.get.mockReturnValueOnce('15m').mockReturnValueOnce('7d').mockReturnValueOnce('7d');
      mockJwtService.sign.mockReturnValueOnce(mockAccessToken).mockReturnValueOnce(mockRefreshToken);
      mockPrismaService.refreshToken.create.mockResolvedValue({});

      const beforeTime = Date.now();
      await service.generateTokens(mockUser);
      const afterTime = Date.now();

      const createCall = mockPrismaService.refreshToken.create.mock.calls[0][0];
      const expiresAt = createCall.data.expiresAt as Date;
      const expectedExpiration = 7 * 24 * 60 * 60 * 1000;

      expect(expiresAt.getTime()).toBeGreaterThanOrEqual(beforeTime + expectedExpiration);
      expect(expiresAt.getTime()).toBeLessThanOrEqual(afterTime + expectedExpiration);
    });

    it('should generate valid UUID v4 for jti', async () => {
      const mockAccessToken = 'mock-access-token';
      const mockRefreshToken = 'mock-refresh-token';

      mockConfigService.getOrThrow.mockReturnValue('secret');
      mockConfigService.get.mockReturnValueOnce('15m').mockReturnValueOnce('7d').mockReturnValueOnce('7d');
      mockJwtService.sign.mockReturnValueOnce(mockAccessToken).mockReturnValueOnce(mockRefreshToken);
      mockPrismaService.refreshToken.create.mockResolvedValue({});

      await service.generateTokens(mockUser);

      const refreshTokenCall = jwtService.sign.mock.calls[1][0];
      const jti = refreshTokenCall.jti;

      expect(jti).toBeDefined();
      expect(typeof jti).toBe('string');
      expect(jti).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);

      const createCall = prismaService.refreshToken.create.mock.calls[0][0];
      expect(createCall.data.jti).toBe(jti);
    });

    it('should not include jti in access token payload', async () => {
      const mockAccessToken = 'mock-access-token';
      const mockRefreshToken = 'mock-refresh-token';

      mockConfigService.getOrThrow.mockReturnValue('secret');
      mockConfigService.get.mockReturnValueOnce('15m').mockReturnValueOnce('7d').mockReturnValueOnce('7d');
      mockJwtService.sign.mockReturnValueOnce(mockAccessToken).mockReturnValueOnce(mockRefreshToken);
      mockPrismaService.refreshToken.create.mockResolvedValue({});

      await service.generateTokens(mockUser);

      const accessTokenPayload = jwtService.sign.mock.calls[0][0];
      expect(accessTokenPayload).not.toHaveProperty('jti');
      expect(accessTokenPayload).toEqual({
        sub: mockUser.id,
        stravaId: mockUser.stravaId,
      });
    });
  });

  describe('refreshAccessToken', () => {
    it('should generate new tokens, revoke old refresh token, and return user', async () => {
      const mockOldRefreshToken = 'old-refresh-token';
      const mockNewAccessToken = 'new-access-token';
      const mockNewRefreshToken = 'new-refresh-token';
      const mockJti = '123e4567-e89b-12d3-a456-426614174000';
      const mockPayload = { sub: 1, stravaId: 12345, jti: mockJti };
      const mockStoredToken = {
        id: 1,
        userId: 1,
        jti: mockJti,
        revoked: false,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        lastUsedAt: null,
        deviceFingerprint: null,
      };

      mockConfigService.getOrThrow
        .mockReturnValueOnce('refresh-secret')
        .mockReturnValueOnce('access-secret')
        .mockReturnValueOnce('refresh-secret');
      mockConfigService.get.mockReturnValueOnce('15m').mockReturnValueOnce('7d').mockReturnValueOnce('7d');
      mockJwtService.verify.mockReturnValue(mockPayload);
      mockJwtService.sign.mockReturnValueOnce(mockNewAccessToken).mockReturnValueOnce(mockNewRefreshToken);
      mockPrismaService.refreshToken.findFirst.mockResolvedValue(mockStoredToken);
      mockPrismaService.refreshToken.create.mockResolvedValue({});
      mockPrismaService.refreshToken.updateMany.mockResolvedValue({ count: 1 });
      mockUserService.findById.mockResolvedValue(mockUser);

      const result = await service.refreshAccessToken(mockOldRefreshToken);

      expect(result).toEqual({
        accessToken: mockNewAccessToken,
        refreshToken: mockNewRefreshToken,
        user: mockUser,
      });

      expect(mockPrismaService.refreshToken.findFirst).toHaveBeenCalledWith({
        where: {
          jti: mockJti,
          revoked: false,
          expiresAt: { gt: expect.any(Date) },
        },
      });

      const createCall = prismaService.refreshToken.create.mock.calls[0][0];
      expect(createCall.data).toEqual({
        userId: mockUser.id,
        jti: expect.stringMatching(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i),
        expiresAt: expect.any(Date),
        deviceFingerprint: undefined,
      });

      expect(mockPrismaService.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { jti: mockJti },
        data: { revoked: true },
      });
      expect(userService.findById).toHaveBeenCalledWith(1);
    });

    it('should revoke all user tokens and throw on token replay attack', async () => {
      const mockRefreshToken = 'revoked-token';
      const mockJti = '123e4567-e89b-12d3-a456-426614174000';
      const mockPayload = { sub: 1, stravaId: 12345, jti: mockJti };
      const mockStoredToken = {
        id: 1,
        userId: 1,
        jti: mockJti,
        revoked: true,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        lastUsedAt: null,
        deviceFingerprint: null,
      };

      mockConfigService.getOrThrow.mockReturnValue('refresh-secret');
      mockJwtService.verify.mockReturnValue(mockPayload);
      mockPrismaService.refreshToken.findFirst.mockResolvedValue(mockStoredToken);
      mockPrismaService.refreshToken.updateMany.mockResolvedValue({ count: 2 });

      await expect(service.refreshAccessToken(mockRefreshToken)).rejects.toThrow(UnauthorizedException);
      await expect(service.refreshAccessToken(mockRefreshToken)).rejects.toThrow(
        'Token replay detected - all sessions revoked',
      );
      expect(mockPrismaService.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { userId: mockPayload.sub, revoked: false },
        data: { revoked: true },
      });
    });

    it('should throw UnauthorizedException if refresh token not found in DB', async () => {
      const mockRefreshToken = 'unknown-token';
      const mockJti = '123e4567-e89b-12d3-a456-426614174000';
      const mockPayload = { sub: 1, stravaId: 12345, jti: mockJti };

      mockConfigService.getOrThrow.mockReturnValue('refresh-secret');
      mockJwtService.verify.mockReturnValue(mockPayload);
      mockPrismaService.refreshToken.findFirst.mockResolvedValue(null);

      await expect(service.refreshAccessToken(mockRefreshToken)).rejects.toThrow(UnauthorizedException);
      await expect(service.refreshAccessToken(mockRefreshToken)).rejects.toThrow('Refresh token not found');
    });

    it('should throw UnauthorizedException if refresh token is expired', async () => {
      const mockRefreshToken = 'expired-token';
      const mockJti = '123e4567-e89b-12d3-a456-426614174000';
      const mockPayload = { sub: 1, stravaId: 12345, jti: mockJti };

      mockConfigService.getOrThrow.mockReturnValue('refresh-secret');
      mockJwtService.verify.mockReturnValue(mockPayload);
      mockPrismaService.refreshToken.findFirst.mockResolvedValue(null);

      await expect(service.refreshAccessToken(mockRefreshToken)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if user no longer exists', async () => {
      const mockRefreshToken = 'valid-refresh-token';
      const mockJti = '123e4567-e89b-12d3-a456-426614174000';
      const mockPayload = { sub: 1, stravaId: 12345, jti: mockJti };
      const mockStoredToken = {
        id: 1,
        userId: 1,
        jti: mockJti,
        revoked: false,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        lastUsedAt: null,
        deviceFingerprint: null,
      };

      mockConfigService.getOrThrow.mockReturnValue('refresh-secret');
      mockJwtService.verify.mockReturnValue(mockPayload);
      mockPrismaService.refreshToken.findFirst.mockResolvedValue(mockStoredToken);
      mockUserService.findById.mockResolvedValue(null);

      await expect(service.refreshAccessToken(mockRefreshToken)).rejects.toThrow(UnauthorizedException);
      await expect(service.refreshAccessToken(mockRefreshToken)).rejects.toThrow('User not found');
    });

    it('should verify jti is extracted from refresh token payload', async () => {
      const mockOldRefreshToken = 'old-refresh-token';
      const mockNewAccessToken = 'new-access-token';
      const mockNewRefreshToken = 'new-refresh-token';
      const mockJti = '123e4567-e89b-12d3-a456-426614174000';
      const mockPayload = { sub: 1, stravaId: 12345, jti: mockJti };
      const mockStoredToken = {
        id: 1,
        userId: 1,
        jti: mockJti,
        revoked: false,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        lastUsedAt: null,
        deviceFingerprint: null,
      };

      mockConfigService.getOrThrow.mockReturnValue('secret');
      mockConfigService.get.mockReturnValueOnce('15m').mockReturnValueOnce('7d').mockReturnValueOnce('7d');
      mockJwtService.verify.mockReturnValue(mockPayload);
      mockJwtService.sign.mockReturnValueOnce(mockNewAccessToken).mockReturnValueOnce(mockNewRefreshToken);
      mockPrismaService.refreshToken.findFirst.mockResolvedValue(mockStoredToken);
      mockPrismaService.refreshToken.create.mockResolvedValue({});
      mockPrismaService.refreshToken.updateMany.mockResolvedValue({ count: 1 });
      mockUserService.findById.mockResolvedValue(mockUser);

      await service.refreshAccessToken(mockOldRefreshToken);

      expect(mockJwtService.verify).toHaveBeenCalledWith(mockOldRefreshToken, {
        secret: expect.any(String),
      });
      expect(mockPrismaService.refreshToken.findFirst).toHaveBeenCalledWith({
        where: {
          jti: mockJti,
          revoked: false,
          expiresAt: { gt: expect.any(Date) },
        },
      });
    });
  });

  describe('handleOAuthCallback', () => {
    it('should handle OAuth callback and redirect to dashboard for completed onboarding', async () => {
      const mockCode = 'test-oauth-code';
      const mockAccessToken = 'mock-access-token';
      const mockRefreshToken = 'mock-refresh-token';
      const mockStravaTokens = {
        token_type: 'Bearer',
        expires_at: 1234567890,
        expires_in: 21600,
        refresh_token: 'strava-refresh',
        access_token: 'strava-access',
        athlete: {
          id: 12345,
          username: 'testathlete',
          firstname: 'Test',
          lastname: 'Athlete',
        },
      };

      mockStravaService.exchangeCodeForToken.mockResolvedValue(mockStravaTokens);
      mockUserService.upsertFromStrava.mockResolvedValue(mockUser);
      mockConfigService.getOrThrow.mockReturnValue('secret');
      mockConfigService.get.mockReturnValueOnce('15m').mockReturnValueOnce('7d').mockReturnValueOnce('7d');
      mockJwtService.sign.mockReturnValueOnce(mockAccessToken).mockReturnValueOnce(mockRefreshToken);
      mockPrismaService.refreshToken.create.mockResolvedValue({});
      mockPrismaService.userPreferences.findUnique.mockResolvedValue({
        userId: mockUser.id,
        onboardingCompleted: true,
        selectedSports: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.handleOAuthCallback(mockCode);

      expect(result).toEqual({
        user: mockUser,
        accessToken: mockAccessToken,
        refreshToken: mockRefreshToken,
        redirectPath: '/dashboard',
      });
      expect(stravaService.exchangeCodeForToken).toHaveBeenCalledWith(mockCode);
      expect(userService.upsertFromStrava).toHaveBeenCalledWith(mockStravaTokens.athlete, mockStravaTokens);

      const createCall = prismaService.refreshToken.create.mock.calls[0][0];
      expect(createCall.data.jti).toBeDefined();
      expect(createCall.data.jti).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });

    it('should handle OAuth callback and redirect to onboarding for incomplete onboarding', async () => {
      const mockCode = 'test-oauth-code';
      const mockAccessToken = 'mock-access-token';
      const mockRefreshToken = 'mock-refresh-token';
      const mockStravaTokens = {
        token_type: 'Bearer',
        expires_at: 1234567890,
        expires_in: 21600,
        refresh_token: 'strava-refresh',
        access_token: 'strava-access',
        athlete: {
          id: 12345,
          username: 'testathlete',
          firstname: 'Test',
          lastname: 'Athlete',
        },
      };

      mockStravaService.exchangeCodeForToken.mockResolvedValue(mockStravaTokens);
      mockUserService.upsertFromStrava.mockResolvedValue(mockUser);
      mockConfigService.getOrThrow.mockReturnValue('secret');
      mockConfigService.get.mockReturnValueOnce('15m').mockReturnValueOnce('7d').mockReturnValueOnce('7d');
      mockJwtService.sign.mockReturnValueOnce(mockAccessToken).mockReturnValueOnce(mockRefreshToken);
      mockPrismaService.refreshToken.create.mockResolvedValue({});
      mockPrismaService.userPreferences.findUnique.mockResolvedValue({
        userId: mockUser.id,
        onboardingCompleted: false,
        selectedSports: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.handleOAuthCallback(mockCode);

      expect(result).toEqual({
        user: mockUser,
        accessToken: mockAccessToken,
        refreshToken: mockRefreshToken,
        redirectPath: '/onboarding',
      });
    });

    it('should redirect to onboarding when user preferences not found', async () => {
      const mockCode = 'test-oauth-code';
      const mockAccessToken = 'mock-access-token';
      const mockRefreshToken = 'mock-refresh-token';
      const mockStravaTokens = {
        token_type: 'Bearer',
        expires_at: 1234567890,
        expires_in: 21600,
        refresh_token: 'strava-refresh',
        access_token: 'strava-access',
        athlete: {
          id: 12345,
          username: 'testathlete',
          firstname: 'Test',
          lastname: 'Athlete',
        },
      };

      mockStravaService.exchangeCodeForToken.mockResolvedValue(mockStravaTokens);
      mockUserService.upsertFromStrava.mockResolvedValue(mockUser);
      mockConfigService.getOrThrow.mockReturnValue('secret');
      mockConfigService.get.mockReturnValueOnce('15m').mockReturnValueOnce('7d').mockReturnValueOnce('7d');
      mockJwtService.sign.mockReturnValueOnce(mockAccessToken).mockReturnValueOnce(mockRefreshToken);
      mockPrismaService.refreshToken.create.mockResolvedValue({});
      mockPrismaService.userPreferences.findUnique.mockResolvedValue(null);

      const result = await service.handleOAuthCallback(mockCode);

      expect(result.redirectPath).toBe('/onboarding');
    });
  });

  describe('revokeAllUserRefreshTokens', () => {
    it('should revoke all active refresh tokens for a user', async () => {
      const userId = 1;

      mockPrismaService.refreshToken.updateMany.mockResolvedValue({ count: 3 });

      await service.revokeAllUserRefreshTokens(userId);

      expect(prismaService.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { userId, revoked: false },
        data: { revoked: true },
      });
    });
  });

  describe('revokeRefreshToken', () => {
    it('should extract jti from token and mark it as revoked', async () => {
      const mockRefreshToken = 'token-to-revoke';
      const mockJti = '123e4567-e89b-12d3-a456-426614174000';
      const mockPayload = { sub: 1, stravaId: 12345, jti: mockJti };

      mockConfigService.getOrThrow.mockReturnValue('refresh-secret');
      mockJwtService.verify.mockReturnValue(mockPayload);
      mockPrismaService.refreshToken.updateMany.mockResolvedValue({ count: 1 });

      await service.revokeRefreshToken(mockRefreshToken);

      expect(mockJwtService.verify).toHaveBeenCalledWith(mockRefreshToken, {
        secret: expect.any(String),
      });
      expect(prismaService.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { jti: mockJti },
        data: { revoked: true },
      });
    });

    it('should handle invalid tokens gracefully', async () => {
      const mockRefreshToken = 'invalid-token';

      mockConfigService.getOrThrow.mockReturnValue('refresh-secret');
      mockJwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(service.revokeRefreshToken(mockRefreshToken)).resolves.not.toThrow();
      expect(mockPrismaService.refreshToken.updateMany).not.toHaveBeenCalled();
    });
  });
});
