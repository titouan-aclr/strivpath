import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { StravaService } from './strava.service';
import { StravaTokenService } from './strava-token.service';

@Module({
  imports: [HttpModule],
  providers: [StravaService, StravaTokenService],
  exports: [StravaService],
})
export class StravaModule {}
