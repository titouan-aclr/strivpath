import { Test, TestingModule } from '@nestjs/testing';
import { StravaTokenService } from './strava-token.service';
import { PrismaService } from '../database/prisma.service';
import { StravaService } from '../strava/strava.service';
import { StravaTokenNotFoundException, StravaRefreshTokenExpiredException } from './strava-token.exceptions';

describe('StravaTokenService', () => {
  let service: StravaTokenService;
  let prismaService: PrismaService;
  let stravaService: StravaService;

  const mockPrismaService = {
    stravaToken: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
  };

  const mockStravaService = {
    refreshStravaToken: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StravaTokenService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: StravaService, useValue: mockStravaService },
      ],
    }).compile();

    service = module.get<StravaTokenService>(StravaTokenService);
    prismaService = module.get<PrismaService>(PrismaService);
    stravaService = module.get<StravaService>(StravaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getValidAccessToken', () => {
    it('should return access token if not expired', async () => {
      const userId = 1;
      const mockToken = {
        accessToken: 'valid-token',
        refreshToken: 'refresh-token',
        expiresAt: Math.floor(Date.now() / 1000) + 3600,
      };

      mockPrismaService.stravaToken.findFirst.mockResolvedValue(mockToken);

      const result = await service.getValidAccessToken(userId);

      expect(result).toBe(mockToken.accessToken);
      expect(prismaService.stravaToken.findFirst).toHaveBeenCalledWith({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });
      expect(stravaService.refreshStravaToken).not.toHaveBeenCalled();
    });

    it('should refresh and return new token if expired', async () => {
      const userId = 1;
      const mockExpiredToken = {
        accessToken: 'expired-token',
        refreshToken: 'refresh-token',
        expiresAt: Math.floor(Date.now() / 1000) - 100,
      };
      const mockRefreshedTokens = {
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token',
        expires_at: Math.floor(Date.now() / 1000) + 3600,
      };

      mockPrismaService.stravaToken.findFirst.mockResolvedValue(mockExpiredToken);
      mockStravaService.refreshStravaToken.mockResolvedValue(mockRefreshedTokens);
      mockPrismaService.stravaToken.create.mockResolvedValue({});

      const result = await service.getValidAccessToken(userId);

      expect(result).toBe(mockRefreshedTokens.access_token);
      expect(stravaService.refreshStravaToken).toHaveBeenCalledWith(mockExpiredToken.refreshToken);
      expect(prismaService.stravaToken.create).toHaveBeenCalledWith({
        data: {
          userId,
          accessToken: mockRefreshedTokens.access_token,
          refreshToken: mockRefreshedTokens.refresh_token,
          expiresAt: mockRefreshedTokens.expires_at,
        },
      });
    });

    it('should throw StravaRefreshTokenExpiredException if Strava refresh fails', async () => {
      const userId = 1;
      const mockExpiredToken = {
        accessToken: 'expired-token',
        refreshToken: 'expired-refresh-token',
        expiresAt: Math.floor(Date.now() / 1000) - 100,
      };

      mockPrismaService.stravaToken.findFirst.mockResolvedValue(mockExpiredToken);
      mockStravaService.refreshStravaToken.mockRejectedValue(new Error('401 Unauthorized'));

      await expect(service.getValidAccessToken(userId)).rejects.toThrow(StravaRefreshTokenExpiredException);
      await expect(service.getValidAccessToken(userId)).rejects.toThrow(
        'Strava refresh token expired. Please reconnect your Strava account.',
      );
    });

    it('should throw StravaTokenNotFoundException if no token found', async () => {
      const userId = 1;

      mockPrismaService.stravaToken.findFirst.mockResolvedValue(null);

      await expect(service.getValidAccessToken(userId)).rejects.toThrow(StravaTokenNotFoundException);
      await expect(service.getValidAccessToken(userId)).rejects.toThrow(
        `No Strava token found for user ${userId}. Please connect your Strava account.`,
      );
    });

    it('should store new token correctly after refresh', async () => {
      const userId = 1;
      const mockExpiredToken = {
        accessToken: 'expired-token',
        refreshToken: 'refresh-token',
        expiresAt: Math.floor(Date.now() / 1000) - 100,
      };
      const mockRefreshedTokens = {
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token',
        expires_at: Math.floor(Date.now() / 1000) + 3600,
      };

      mockPrismaService.stravaToken.findFirst.mockResolvedValue(mockExpiredToken);
      mockStravaService.refreshStravaToken.mockResolvedValue(mockRefreshedTokens);
      mockPrismaService.stravaToken.create.mockResolvedValue({
        id: 1,
        userId,
        accessToken: mockRefreshedTokens.access_token,
        refreshToken: mockRefreshedTokens.refresh_token,
        expiresAt: mockRefreshedTokens.expires_at,
        createdAt: new Date(),
      });

      await service.getValidAccessToken(userId);

      expect(prismaService.stravaToken.create).toHaveBeenCalledTimes(1);
      expect(prismaService.stravaToken.create).toHaveBeenCalledWith({
        data: {
          userId,
          accessToken: mockRefreshedTokens.access_token,
          refreshToken: mockRefreshedTokens.refresh_token,
          expiresAt: mockRefreshedTokens.expires_at,
        },
      });
    });
  });
});
