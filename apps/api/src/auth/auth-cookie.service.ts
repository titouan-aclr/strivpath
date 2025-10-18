import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';

@Injectable()
export class AuthCookieService {
  constructor(private readonly configService: ConfigService) {}

  setAccessTokenCookie(res: Response, accessToken: string): void {
    const isProduction = this.configService.get('NODE_ENV') === 'production';

    // TODO: verify before prod
    res.cookie('Authentication', accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: 15 * 60 * 1000,
      path: '/',
    });
  }

  setRefreshTokenCookie(res: Response, refreshToken: string): void {
    const isProduction = this.configService.get('NODE_ENV') === 'production';

    res.cookie('RefreshToken', refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });
  }

  clearAccessTokenCookie(res: Response): void {
    res.clearCookie('Authentication');
  }

  clearRefreshTokenCookie(res: Response): void {
    res.clearCookie('RefreshToken');
  }

  clearAllAuthCookies(res: Response): void {
    this.clearAccessTokenCookie(res);
    this.clearRefreshTokenCookie(res);
  }
}
