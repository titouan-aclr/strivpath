import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { TokenCleanupService } from './token-cleanup.service';
import { PrismaService } from '../database/prisma.service';

describe('TokenCleanupService', () => {
  let service: TokenCleanupService;
  let prismaService: PrismaService;
  let configService: ConfigService;

  const mockPrismaService = {
    refreshToken: {
      deleteMany: jest.fn(),
    },
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TokenCleanupService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<TokenCleanupService>(TokenCleanupService);
    prismaService = module.get<PrismaService>(PrismaService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('cleanupExpiredTokens', () => {
    it('should delete expired and revoked refresh tokens', async () => {
      mockConfigService.get.mockReturnValue(true);
      mockPrismaService.refreshToken.deleteMany.mockResolvedValue({ count: 10 });

      await service.cleanupExpiredTokens();

      expect(prismaService.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: {
          expiresAt: { lt: expect.any(Date) },
          revoked: true,
        },
      });
    });

    it('should log the number of deleted tokens', async () => {
      mockConfigService.get.mockReturnValue(true);
      mockPrismaService.refreshToken.deleteMany.mockResolvedValue({ count: 5 });

      const loggerSpy = jest.spyOn(service['logger'], 'log');

      await service.cleanupExpiredTokens();

      expect(loggerSpy).toHaveBeenCalledWith('Token cleanup started');
      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringMatching(/^Cleaned up 5 expired and revoked refresh tokens \(duration: \d+ms\)$/),
      );
    });

    it('should not delete tokens when cleanup is disabled', async () => {
      mockConfigService.get.mockReturnValue(false);

      const loggerSpy = jest.spyOn(service['logger'], 'log');

      await service.cleanupExpiredTokens();

      expect(loggerSpy).toHaveBeenCalledWith('Token cleanup is disabled');
      expect(prismaService.refreshToken.deleteMany).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully and log them', async () => {
      mockConfigService.get.mockReturnValue(true);
      const error = new Error('Database connection failed');
      mockPrismaService.refreshToken.deleteMany.mockRejectedValue(error);

      const loggerErrorSpy = jest.spyOn(service['logger'], 'error');

      await service.cleanupExpiredTokens();

      expect(loggerErrorSpy).toHaveBeenCalledWith('Failed to clean up expired tokens', error.stack);
    });

    it('should use TOKEN_CLEANUP_ENABLED config with default true', async () => {
      mockConfigService.get.mockReturnValue(undefined);
      mockPrismaService.refreshToken.deleteMany.mockResolvedValue({ count: 0 });

      await service.cleanupExpiredTokens();

      expect(configService.get).toHaveBeenCalledWith('TOKEN_CLEANUP_ENABLED', true);
    });

    it('should delete only tokens that are both expired and revoked', async () => {
      mockConfigService.get.mockReturnValue(true);
      mockPrismaService.refreshToken.deleteMany.mockResolvedValue({ count: 3 });

      await service.cleanupExpiredTokens();

      const deleteCall = mockPrismaService.refreshToken.deleteMany.mock.calls[0][0];

      expect(deleteCall.where.expiresAt).toEqual({ lt: expect.any(Date) });
      expect(deleteCall.where.revoked).toBe(true);
    });

    it('should use current date for expiration check', async () => {
      mockConfigService.get.mockReturnValue(true);
      mockPrismaService.refreshToken.deleteMany.mockResolvedValue({ count: 1 });

      const beforeTime = new Date();
      await service.cleanupExpiredTokens();
      const afterTime = new Date();

      const deleteCall = mockPrismaService.refreshToken.deleteMany.mock.calls[0][0];
      const expirationDate = deleteCall.where.expiresAt.lt;

      expect(expirationDate.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
      expect(expirationDate.getTime()).toBeLessThanOrEqual(afterTime.getTime());
    });
  });
});
