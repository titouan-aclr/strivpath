import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CookieOptions, Response } from 'express';
import { parseJwtExpirationToMs } from './utils/jwt-expiration.utils';

@Injectable()
export class AuthCookieService {
  private readonly sameSite: 'lax' | 'none' | 'strict';
  private readonly secure: boolean;
  private readonly accessTokenMaxAge: number;
  private readonly refreshTokenMaxAge: number;

  constructor(private readonly configService: ConfigService) {
    this.sameSite = this.configService.get<'lax' | 'none' | 'strict'>('COOKIES_SAME_SITE', 'lax');
    this.secure = this.configService.get<boolean>('COOKIES_SECURE', false);

    const accessTokenExp = this.configService.get<string>('JWT_ACCESS_TOKEN_EXPIRATION', '15m');
    const refreshTokenExp = this.configService.get<string>('JWT_REFRESH_TOKEN_EXPIRATION', '7d');

    this.accessTokenMaxAge = parseJwtExpirationToMs(accessTokenExp);
    this.refreshTokenMaxAge = parseJwtExpirationToMs(refreshTokenExp);

    this.validateCookieConfiguration();
  }

  private validateCookieConfiguration(): void {
    const validSameSiteValues = new Set(['lax', 'none', 'strict']);

    if (!validSameSiteValues.has(this.sameSite)) {
      throw new Error(
        `Invalid COOKIES_SAME_SITE value: "${this.sameSite}". ` +
          `Expected one of: ${Array.from(validSameSiteValues).join(', ')}.`,
      );
    }

    if (typeof this.secure !== 'boolean') {
      throw new Error(`Invalid COOKIES_SECURE value: "${String(this.secure)}". Expected boolean (true or false).`);
    }

    if (this.sameSite === 'none' && !this.secure) {
      throw new Error(
        'Invalid cookie configuration: sameSite="none" requires secure=true. ' +
          'Check environment configuration documentation.',
      );
    }
  }

  private getCookieOptions(maxAge: number): CookieOptions {
    return {
      httpOnly: true,
      secure: this.secure,
      sameSite: this.sameSite,
      maxAge,
      path: '/',
    };
  }

  setAccessTokenCookie(res: Response, accessToken: string): void {
    res.cookie('Authentication', accessToken, this.getCookieOptions(this.accessTokenMaxAge));
  }

  setRefreshTokenCookie(res: Response, refreshToken: string): void {
    res.cookie('RefreshToken', refreshToken, this.getCookieOptions(this.refreshTokenMaxAge));
  }

  clearAccessTokenCookie(res: Response): void {
    res.clearCookie('Authentication', {
      httpOnly: true,
      secure: this.secure,
      sameSite: this.sameSite,
      path: '/',
    });
  }

  clearRefreshTokenCookie(res: Response): void {
    res.clearCookie('RefreshToken', {
      httpOnly: true,
      secure: this.secure,
      sameSite: this.sameSite,
      path: '/',
    });
  }

  clearAllAuthCookies(res: Response): void {
    this.clearAccessTokenCookie(res);
    this.clearRefreshTokenCookie(res);
  }
}
