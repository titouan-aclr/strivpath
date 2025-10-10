import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrismaService } from '../database/prisma.service';
import { UserService } from '../user/user.service';
import { User } from '@repo/graphql-types';
import * as crypto from 'crypto';

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: JwtService;
  let configService: ConfigService;
  let prismaService: PrismaService;
  let userService: UserService;

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
  };

  const mockUserService = {
    findById: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: UserService, useValue: mockUserService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService);
    prismaService = module.get<PrismaService>(PrismaService);
    userService = module.get<UserService>(UserService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateTokens', () => {
    it('should generate both access and refresh tokens and store refresh token in DB', async () => {
      const mockAccessToken = 'mock-access-token';
      const mockRefreshToken = 'mock-refresh-token';
      const mockTokenHash = crypto.createHash('sha256').update(mockRefreshToken).digest('hex');
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
      expect(prismaService.refreshToken.create).toHaveBeenCalledWith({
        data: {
          userId: mockUser.id,
          tokenHash: mockTokenHash,
          expiresAt: expect.any(Date),
          deviceFingerprint,
        },
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
  });

  describe('refreshAccessToken', () => {
    it('should generate new access token without rotating refresh token and return user', async () => {
      const mockRefreshToken = 'valid-refresh-token';
      const mockAccessToken = 'new-access-token';
      const mockPayload = { sub: 1, stravaId: 12345 };
      const mockTokenHash = crypto.createHash('sha256').update(mockRefreshToken).digest('hex');
      const mockStoredToken = {
        id: 1,
        userId: 1,
        tokenHash: mockTokenHash,
        revoked: false,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        lastUsedAt: null,
        deviceFingerprint: null,
      };

      mockConfigService.getOrThrow.mockReturnValue('refresh-secret');
      mockConfigService.get.mockReturnValue('15m');
      mockJwtService.verify.mockReturnValue(mockPayload);
      mockJwtService.sign.mockReturnValue(mockAccessToken);
      mockPrismaService.refreshToken.findFirst.mockResolvedValue(mockStoredToken);
      mockPrismaService.refreshToken.update.mockResolvedValue({});
      mockUserService.findById.mockResolvedValue(mockUser);

      const result = await service.refreshAccessToken(mockRefreshToken);

      expect(result).toEqual({
        accessToken: mockAccessToken,
        refreshToken: mockRefreshToken,
        user: mockUser,
      });
      expect(mockPrismaService.refreshToken.update).toHaveBeenCalledWith({
        where: { id: mockStoredToken.id },
        data: { lastUsedAt: expect.any(Date) },
      });
      expect(userService.findById).toHaveBeenCalledWith(1);
    });

    it('should throw UnauthorizedException if refresh token is revoked', async () => {
      const mockRefreshToken = 'revoked-token';
      const mockPayload = { sub: 1, stravaId: 12345 };
      const mockTokenHash = crypto.createHash('sha256').update(mockRefreshToken).digest('hex');
      const mockStoredToken = {
        id: 1,
        userId: 1,
        tokenHash: mockTokenHash,
        revoked: true,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        lastUsedAt: null,
        deviceFingerprint: null,
      };

      mockConfigService.getOrThrow.mockReturnValue('refresh-secret');
      mockJwtService.verify.mockReturnValue(mockPayload);
      mockPrismaService.refreshToken.findFirst.mockResolvedValue(mockStoredToken);

      await expect(service.refreshAccessToken(mockRefreshToken)).rejects.toThrow(UnauthorizedException);
      await expect(service.refreshAccessToken(mockRefreshToken)).rejects.toThrow('Refresh token invalid or revoked');
    });

    it('should throw UnauthorizedException if refresh token not found in DB', async () => {
      const mockRefreshToken = 'unknown-token';
      const mockPayload = { sub: 1, stravaId: 12345 };

      mockConfigService.getOrThrow.mockReturnValue('refresh-secret');
      mockJwtService.verify.mockReturnValue(mockPayload);
      mockPrismaService.refreshToken.findFirst.mockResolvedValue(null);

      await expect(service.refreshAccessToken(mockRefreshToken)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if refresh token is expired', async () => {
      const mockRefreshToken = 'expired-token';
      const mockPayload = { sub: 1, stravaId: 12345 };

      mockConfigService.getOrThrow.mockReturnValue('refresh-secret');
      mockJwtService.verify.mockReturnValue(mockPayload);
      mockPrismaService.refreshToken.findFirst.mockResolvedValue(null);

      await expect(service.refreshAccessToken(mockRefreshToken)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if user no longer exists', async () => {
      const mockRefreshToken = 'valid-refresh-token';
      const mockPayload = { sub: 1, stravaId: 12345 };
      const mockTokenHash = crypto.createHash('sha256').update(mockRefreshToken).digest('hex');
      const mockStoredToken = {
        id: 1,
        userId: 1,
        tokenHash: mockTokenHash,
        revoked: false,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        lastUsedAt: null,
        deviceFingerprint: null,
      };

      mockConfigService.getOrThrow.mockReturnValue('refresh-secret');
      mockJwtService.verify.mockReturnValue(mockPayload);
      mockPrismaService.refreshToken.findFirst.mockResolvedValue(mockStoredToken);
      mockPrismaService.refreshToken.update.mockResolvedValue({});
      mockUserService.findById.mockResolvedValue(null);

      await expect(service.refreshAccessToken(mockRefreshToken)).rejects.toThrow(UnauthorizedException);
      await expect(service.refreshAccessToken(mockRefreshToken)).rejects.toThrow('User not found');
    });
  });

  describe('revokeRefreshToken', () => {
    it('should mark refresh token as revoked', async () => {
      const mockRefreshToken = 'token-to-revoke';
      const mockTokenHash = crypto.createHash('sha256').update(mockRefreshToken).digest('hex');

      mockPrismaService.refreshToken.updateMany.mockResolvedValue({ count: 1 });

      await service.revokeRefreshToken(mockRefreshToken);

      expect(prismaService.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { tokenHash: mockTokenHash },
        data: { revoked: true },
      });
    });
  });
});
