import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Controller('auth')
export class AuthController {
  @Get('strava')
  @UseGuards(AuthGuard('strava'))
  async stravaLogin() {
    // Passport automatically redirect to Strava
  }

  @Get('strava/callback')
  @UseGuards(AuthGuard('strava'))
  async stravaCallback(@Req() req) {
    return { status: 'ok', user: req.user };
  }
}
