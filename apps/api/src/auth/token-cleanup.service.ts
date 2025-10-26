import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class TokenCleanupService {
  private readonly logger = new Logger(TokenCleanupService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_2AM, {
    name: 'token-cleanup',
  })
  async cleanupExpiredTokens() {
    const isEnabled = this.configService.get<boolean>('TOKEN_CLEANUP_ENABLED', true);

    if (!isEnabled) {
      this.logger.log('Token cleanup is disabled');
      return;
    }

    try {
      this.logger.log('Token cleanup started');

      const startTime = Date.now();

      const result = await this.prisma.refreshToken.deleteMany({
        where: {
          expiresAt: { lt: new Date() },
          revoked: true,
        },
      });

      const duration = Date.now() - startTime;

      this.logger.log(`Cleaned up ${result.count} expired and revoked refresh tokens (duration: ${duration}ms)`);
    } catch (error) {
      const errorStack = error instanceof Error ? error.stack : String(error);
      this.logger.error('Failed to clean up expired tokens', errorStack);
    }
  }
}
