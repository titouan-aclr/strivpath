import { Inject, Injectable, UnauthorizedException, forwardRef } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { User } from '@repo/graphql-types';
import { RefreshToken } from '@prisma/client';
import * as crypto from 'crypto';
import { PrismaService } from '../database/prisma.service';
import { UserService } from '../user/user.service';
import { TokenPayload } from './types';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
  ) {}

  private generateAccessToken(user: User): string {
    const payload: TokenPayload = {
      sub: user.id,
      stravaId: user.stravaId,
    };

    return this.jwtService.sign(payload, {
      secret: this.configService.getOrThrow('JWT_ACCESS_TOKEN_SECRET'),
      expiresIn: this.configService.get('JWT_ACCESS_TOKEN_EXPIRATION', '15m'),
    });
  }

  private generateRefreshToken(user: User): string {
    const payload: TokenPayload = {
      sub: user.id,
      stravaId: user.stravaId,
    };

    return this.jwtService.sign(payload, {
      secret: this.configService.getOrThrow('JWT_REFRESH_TOKEN_SECRET'),
      expiresIn: this.configService.get('JWT_REFRESH_TOKEN_EXPIRATION', '7d'),
    });
  }

  async generateTokens(user: User, deviceFingerprint?: string): Promise<{ accessToken: string; refreshToken: string }> {
    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);

    await this.storeRefreshToken(user.id, refreshToken, deviceFingerprint);

    return { accessToken, refreshToken };
  }

  private async verifyRefreshToken(token: string): Promise<TokenPayload> {
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

    const storedToken = await this.validateStoredRefreshToken(refreshToken);

    if (!storedToken || storedToken.revoked) {
      throw new UnauthorizedException('Refresh token invalid or revoked');
    }

    await this.updateRefreshTokenUsage(storedToken.id);

    const user = await this.userService.findById(payload.sub);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const accessToken = this.generateAccessToken(user);

    return { accessToken, refreshToken, user };
  }

  async revokeRefreshToken(refreshToken: string): Promise<void> {
    const tokenHash = this.hashToken(refreshToken);

    await this.prisma.refreshToken.updateMany({
      where: { tokenHash },
      data: { revoked: true },
    });
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private async storeRefreshToken(userId: number, refreshToken: string, deviceFingerprint?: string): Promise<void> {
    const tokenHash = this.hashToken(refreshToken);
    const expirationString = this.configService.get<string>('JWT_REFRESH_TOKEN_EXPIRATION', '7d');
    const expirationMs = this.parseExpirationToMs(expirationString);
    const expiresAt = new Date(Date.now() + expirationMs);

    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
        deviceFingerprint,
      },
    });
  }

  private async validateStoredRefreshToken(refreshToken: string): Promise<RefreshToken | null> {
    const tokenHash = this.hashToken(refreshToken);

    return await this.prisma.refreshToken.findFirst({
      where: {
        tokenHash,
        revoked: false,
        expiresAt: { gt: new Date() },
      },
    });
  }

  private async updateRefreshTokenUsage(tokenId: number): Promise<void> {
    await this.prisma.refreshToken.update({
      where: { id: tokenId },
      data: { lastUsedAt: new Date() },
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
