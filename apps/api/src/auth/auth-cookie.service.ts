import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CookieOptions, Response } from 'express';
import { parseJwtExpirationToMs } from './utils/jwt-expiration.utils';

@Injectable()
export class AuthCookieService {
  private readonly sameSite: 'lax' | 'none' | 'strict';
  private readonly secure: boolean;
  private readonly domain: string | undefined;
  private readonly accessTokenMaxAge: number;
  private readonly refreshTokenMaxAge: number;

  constructor(private readonly configService: ConfigService) {
    this.sameSite = this.configService.get<'lax' | 'none' | 'strict'>('COOKIES_SAME_SITE', 'lax');
    this.secure = this.configService.get<string>('COOKIES_SECURE', 'false') === 'true';
    this.domain = this.configService.get<string>('COOKIES_DOMAIN');

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

    if (this.sameSite === 'none' && !this.secure) {
      throw new Error(
        'Invalid cookie configuration: sameSite="none" requires secure=true. ' +
          'Check environment configuration documentation.',
      );
    }
  }

  private getCookieOptions(maxAge: number): CookieOptions {
    const options: CookieOptions = {
      httpOnly: true,
      secure: this.secure,
      sameSite: this.sameSite,
      maxAge,
      path: '/',
    };

    if (this.domain) {
      options.domain = this.domain;
    }

    return options;
  }

  setAccessTokenCookie(res: Response, accessToken: string): void {
    res.cookie('Authentication', accessToken, this.getCookieOptions(this.accessTokenMaxAge));
  }

  setRefreshTokenCookie(res: Response, refreshToken: string): void {
    res.cookie('RefreshToken', refreshToken, this.getCookieOptions(this.refreshTokenMaxAge));
  }

  clearAccessTokenCookie(res: Response): void {
    res.clearCookie('Authentication', this.getClearCookieOptions());
  }

  clearRefreshTokenCookie(res: Response): void {
    res.clearCookie('RefreshToken', this.getClearCookieOptions());
  }

  private getClearCookieOptions(): CookieOptions {
    const options: CookieOptions = {
      httpOnly: true,
      secure: this.secure,
      sameSite: this.sameSite,
      path: '/',
    };

    if (this.domain) {
      options.domain = this.domain;
    }

    return options;
  }

  clearAllAuthCookies(res: Response): void {
    this.clearAccessTokenCookie(res);
    this.clearRefreshTokenCookie(res);
  }
}
