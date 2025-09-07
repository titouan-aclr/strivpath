import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Controller('auth')
export class AuthController {
  @Get('strava')
  @UseGuards(AuthGuard('strava'))
  async stravaLogin() {
    // Passport redirige automatiquement vers Strava
  }

  @Get('strava/callback')
  @UseGuards(AuthGuard('strava'))
  async stravaCallback(@Req() req) {
    // Après succès, Passport met l’utilisateur dans req.user
    return req.user; // ici tu peux appeler ton service pour sauvegarder en DB
  }
}
