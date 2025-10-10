import { Module } from '@nestjs/common';
import { ActivityService } from './activity.service';
import { ActivityResolver } from './activity.resolver';
import { StravaModule } from '../strava/strava.module';
import { StravaTokenModule } from '../strava-token/strava-token.module';
import { SyncHistoryService } from '../sync-history/sync-history.service';

@Module({
  imports: [StravaModule, StravaTokenModule],
  providers: [ActivityService, ActivityResolver, SyncHistoryService],
  exports: [ActivityService],
})
export class ActivityModule {}
