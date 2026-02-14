import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { timingSafeEqual } from 'crypto';
import { UserService } from '../user/user.service';
import { StravaWebhookEvent } from './types/strava-webhook-event.interface';

@Injectable()
export class StravaWebhookService {
  private readonly logger = new Logger(StravaWebhookService.name);

  constructor(
    private readonly userService: UserService,
    private readonly configService: ConfigService,
  ) {}

  validateVerifyToken(token: string): boolean {
    const expected = this.configService.get<string>('STRAVA_WEBHOOK_VERIFY_TOKEN', '');
    if (!expected || !token) return false;

    const tokenBuffer = Buffer.from(token);
    const expectedBuffer = Buffer.from(expected);

    if (tokenBuffer.length !== expectedBuffer.length) return false;

    return timingSafeEqual(tokenBuffer, expectedBuffer);
  }

  async handleEvent(event: StravaWebhookEvent): Promise<void> {
    if (event.object_type === 'athlete' && event.updates?.['authorized'] === 'false') {
      await this.handleDeauthorization(event.owner_id);
      return;
    }

    this.logger.log(`Received ${event.object_type} ${event.aspect_type} event for owner ${event.owner_id}`);
  }

  private async handleDeauthorization(stravaId: number): Promise<void> {
    this.logger.warn(`Processing deauthorization for Strava athlete ${stravaId}`);

    const user = await this.userService.findByStravaId(stravaId);

    if (!user) {
      this.logger.warn(`No user found for Strava athlete ${stravaId} during deauthorization`);
      return;
    }

    await this.userService.deleteAccount(user.id);
    this.logger.warn(`Deleted account for user ${user.id} (Strava athlete ${stravaId}) after deauthorization`);
  }
}
