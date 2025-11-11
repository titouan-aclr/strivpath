import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { AuthCookieService } from './auth-cookie.service';
import { UnifiedThrottlerGuard } from '../common/guards/throttler.guard';

@Controller('auth/strava')
@UseGuards(UnifiedThrottlerGuard)
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly authCookieService: AuthCookieService,
    private readonly configService: ConfigService,
  ) {}

  @Get('callback')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async callback(
    @Query('code') code: string,
    @Query('error') error: string,
    @Query('scope') scope: string,
    @Res() res: Response,
  ): Promise<void> {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000');

    if (error) {
      return res.redirect(`${frontendUrl}/auth/error?error=${error}`);
    }

    if (!code) {
      return res.redirect(`${frontendUrl}/auth/error?error=missing_code`);
    }

    try {
      const { accessToken, refreshToken, redirectPath } = await this.authService.handleOAuthCallback(code);

      this.authCookieService.setAccessTokenCookie(res, accessToken);
      this.authCookieService.setRefreshTokenCookie(res, refreshToken);

      return res.redirect(`${frontendUrl}${redirectPath}`);
    } catch (err) {
      console.error('OAuth callback error:', err);
      return res.redirect(`${frontendUrl}/auth/error?error=auth_failed`);
    }
  }
}
