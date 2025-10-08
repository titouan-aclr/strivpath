import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { User } from '@repo/graphql-types';
import { AuthenticatedRequest } from './types';

@Controller('auth')
export class AuthController {
  @Get('strava')
  @UseGuards(AuthGuard('strava'))
  stravaLogin() {
    // Passport automatically redirect to Strava
  }

  @Get('strava/callback')
  @UseGuards(AuthGuard('strava'))
  stravaCallback(@Req() req: AuthenticatedRequest): {
    status: string;
    user: User;
  } {
    return { status: 'ok', user: req.user };
  }
}
