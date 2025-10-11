import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { StravaService } from './strava.service';
import { StravaTokenNotFoundException, StravaRefreshTokenExpiredException } from './strava-token.exceptions';

@Injectable()
export class StravaTokenService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stravaService: StravaService,
  ) {}

  async getValidAccessToken(userId: number): Promise<string> {
    const latestToken = await this.getLatestStravaToken(userId);

    if (!latestToken) {
      throw new StravaTokenNotFoundException(userId);
    }

    if (this.isAccessTokenExpired(latestToken.expiresAt)) {
      return this.refreshAndStoreToken(userId, latestToken.refreshToken);
    }

    return latestToken.accessToken;
  }

  private async refreshAndStoreToken(userId: number, refreshToken: string): Promise<string> {
    try {
      const newTokens = await this.stravaService.refreshStravaToken(refreshToken);

      await this.prisma.stravaToken.create({
        data: {
          userId,
          accessToken: newTokens.access_token,
          refreshToken: newTokens.refresh_token,
          expiresAt: newTokens.expires_at,
        },
      });

      return newTokens.access_token;
    } catch {
      throw new StravaRefreshTokenExpiredException(userId);
    }
  }

  private isAccessTokenExpired(expiresAt: number): boolean {
    return expiresAt <= Math.floor(Date.now() / 1000);
  }

  private async getLatestStravaToken(userId: number) {
    return this.prisma.stravaToken.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
