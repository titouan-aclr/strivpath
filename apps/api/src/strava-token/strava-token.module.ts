import { Module } from '@nestjs/common';
import { StravaTokenService } from './strava-token.service';
import { StravaModule } from '../strava/strava.module';

@Module({
  imports: [StravaModule],
  providers: [StravaTokenService],
  exports: [StravaTokenService],
})
export class StravaTokenModule {}
