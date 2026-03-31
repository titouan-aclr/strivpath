import { Module } from '@nestjs/common';
import { UserModule } from '../user/user.module';
import { ActivityModule } from '../activity/activity.module';
import { StravaWebhookController } from './strava-webhook.controller';
import { StravaWebhookService } from './strava-webhook.service';

@Module({
  imports: [UserModule, ActivityModule],
  controllers: [StravaWebhookController],
  providers: [StravaWebhookService],
})
export class WebhookModule {}
