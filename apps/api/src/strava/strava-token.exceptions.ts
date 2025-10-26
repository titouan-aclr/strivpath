import { NotFoundException, UnauthorizedException } from '@nestjs/common';

export class StravaTokenNotFoundException extends NotFoundException {
  constructor(userId: number) {
    super(`No Strava token found for user ${userId}. Please connect your Strava account.`);
  }
}

export class StravaRefreshTokenExpiredException extends UnauthorizedException {
  constructor(userId: number) {
    super({
      message: 'Strava refresh token expired. Please reconnect your Strava account.',
      errorCode: 'STRAVA_REFRESH_TOKEN_EXPIRED',
      userId,
    });
  }
}
