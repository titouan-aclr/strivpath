import { Inject, Injectable, UnauthorizedException, forwardRef } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { User } from '@repo/graphql-types';
import { randomUUID } from 'crypto';
import { PrismaService } from '../database/prisma.service';
import { UserService } from '../user/user.service';
import { StravaService } from '../strava/strava.service';
import { AccessTokenPayload, RefreshTokenPayload } from './types';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
    @Inject(forwardRef(() => StravaService))
    private readonly stravaService: StravaService,
  ) {}

  private generateAccessToken(user: User): string {
    const payload: AccessTokenPayload = {
      sub: user.id,
      stravaId: user.stravaId,
    };

    return this.jwtService.sign(payload, {
      secret: this.configService.getOrThrow('JWT_ACCESS_TOKEN_SECRET'),
      expiresIn: this.configService.get('JWT_ACCESS_TOKEN_EXPIRATION', '15m'),
    });
  }

  private generateRefreshToken(user: User): { token: string; jti: string } {
    const jti = randomUUID();
    const payload: RefreshTokenPayload = {
      sub: user.id,
      stravaId: user.stravaId,
      jti,
    };

    const token = this.jwtService.sign(payload, {
      secret: this.configService.getOrThrow('JWT_REFRESH_TOKEN_SECRET'),
      expiresIn: this.configService.get('JWT_REFRESH_TOKEN_EXPIRATION', '7d'),
    });

    return { token, jti };
  }

  async generateTokens(user: User, deviceFingerprint?: string): Promise<{ accessToken: string; refreshToken: string }> {
    const accessToken = this.generateAccessToken(user);
    const { token: refreshToken, jti } = this.generateRefreshToken(user);

    await this.storeRefreshToken(user.id, jti, deviceFingerprint);

    return { accessToken, refreshToken };
  }

  async handleOAuthCallback(
    code: string,
  ): Promise<{ user: User; accessToken: string; refreshToken: string; redirectPath: string }> {
    const stravaTokens = await this.stravaService.exchangeCodeForToken(code);
    const athlete = stravaTokens.athlete;

    const user = await this.userService.upsertFromStrava(athlete, stravaTokens);

    const { accessToken, refreshToken } = await this.generateTokens(user);

    const preferences = await this.prisma.userPreferences.findUnique({
      where: { userId: user.id },
    });

    const redirectPath = preferences?.onboardingCompleted ? '/dashboard' : '/onboarding';

    return { user, accessToken, refreshToken, redirectPath };
  }

  private async verifyRefreshToken(token: string): Promise<RefreshTokenPayload> {
    try {
      return this.jwtService.verify(token, {
        secret: this.configService.getOrThrow('JWT_REFRESH_TOKEN_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string; user: User }> {
    const payload = await this.verifyRefreshToken(refreshToken);

    const storedToken = await this.prisma.refreshToken.findFirst({
      where: { jti: payload.jti },
    });

    if (!storedToken) {
      throw new UnauthorizedException('Refresh token not found');
    }

    if (storedToken.revoked) {
      await this.revokeAllUserRefreshTokens(payload.sub);
      throw new UnauthorizedException('Token replay detected - all sessions revoked');
    }

    if (storedToken.expiresAt <= new Date()) {
      throw new UnauthorizedException('Refresh token expired');
    }

    const user = await this.userService.findById(payload.sub);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const newAccessToken = this.generateAccessToken(user);
    const { token: newRefreshToken, jti: newJti } = this.generateRefreshToken(user);

    await this.storeRefreshToken(user.id, newJti);

    await this.revokeRefreshTokenByJti(payload.jti);

    return { accessToken: newAccessToken, refreshToken: newRefreshToken, user };
  }

  async revokeRefreshToken(refreshToken: string): Promise<void> {
    try {
      const payload = await this.verifyRefreshToken(refreshToken);
      await this.revokeRefreshTokenByJti(payload.jti);
    } catch {
      return;
    }
  }

  private async revokeRefreshTokenByJti(jti: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { jti },
      data: { revoked: true },
    });
  }

  async revokeAllUserRefreshTokens(userId: number): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revoked: false },
      data: { revoked: true },
    });
  }

  private async storeRefreshToken(userId: number, jti: string, deviceFingerprint?: string): Promise<void> {
    const expirationString = this.configService.get<string>('JWT_REFRESH_TOKEN_EXPIRATION', '7d');
    const expirationMs = this.parseExpirationToMs(expirationString);
    const expiresAt = new Date(Date.now() + expirationMs);

    await this.prisma.refreshToken.create({
      data: {
        userId,
        jti,
        expiresAt,
        deviceFingerprint,
      },
    });
  }

  private parseExpirationToMs(expiration: string): number {
    const match = expiration.match(/^(\d+)([smhd])$/);

    if (!match) {
      throw new Error(`Invalid expiration format: ${expiration}`);
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    const unitToMs: Record<string, number> = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };

    return value * unitToMs[unit];
  }
}
