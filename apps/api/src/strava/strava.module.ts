import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { StravaService } from './strava.service';
import { StravaTokenService } from './strava-token.service';
import { StravaRateLimitService } from './strava-rate-limit.service';

@Module({
  imports: [HttpModule],
  providers: [StravaService, StravaTokenService, StravaRateLimitService],
  exports: [StravaService],
})
export class StravaModule {}
