import { Module } from '@nestjs/common';
import { ActivityService } from './activity.service';
import { ActivityResolver } from './activity.resolver';
import { StravaModule } from '../strava/strava.module';
import { SyncHistoryService } from '../sync-history/sync-history.service';
import { GoalModule } from '../goal/goal.module';

@Module({
  imports: [StravaModule, GoalModule],
  providers: [ActivityService, ActivityResolver, SyncHistoryService],
  exports: [ActivityService],
})
export class ActivityModule {}
