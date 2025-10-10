import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { StravaService } from './strava.service';

@Module({
  imports: [HttpModule],
  providers: [StravaService],
  exports: [StravaService],
})
export class StravaModule {}
