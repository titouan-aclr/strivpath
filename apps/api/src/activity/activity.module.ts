import { Module } from '@nestjs/common';
import { ActivityService } from './activity.service';
import { ActivityResolver } from './activity.resolver';
import { StravaModule } from '../strava/strava.module';
import { SyncHistoryModule } from '../sync-history/sync-history.module';
import { GoalModule } from '../goal/goal.module';

@Module({
  imports: [StravaModule, GoalModule, SyncHistoryModule],
  providers: [ActivityService, ActivityResolver],
  exports: [ActivityService],
})
export class ActivityModule {}
