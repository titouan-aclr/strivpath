import { Controller, Get, Post, Body, Req, Res, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { StravaWebhookService } from './strava-webhook.service';
import { StravaWebhookEvent } from './types/strava-webhook-event.interface';

@Controller('webhooks/strava')
export class StravaWebhookController {
  private readonly logger = new Logger(StravaWebhookController.name);

  constructor(private readonly stravaWebhookService: StravaWebhookService) {}

  @Get()
  handleVerification(@Req() req: Request, @Res() res: Response) {
    const mode = req.query['hub.mode'] as string | undefined;
    const challenge = req.query['hub.challenge'] as string | undefined;
    const verifyToken = req.query['hub.verify_token'] as string | undefined;

    if (mode !== 'subscribe' || !verifyToken || !this.stravaWebhookService.validateVerifyToken(verifyToken)) {
      return res.status(HttpStatus.FORBIDDEN).json({ error: 'Verification failed' });
    }

    return res.status(HttpStatus.OK).json({ 'hub.challenge': challenge });
  }

  @Post()
  async handleEvent(@Body() event: StravaWebhookEvent, @Res() res: Response) {
    res.status(HttpStatus.OK).json({ received: true });

    try {
      await this.stravaWebhookService.handleEvent(event);
    } catch (error) {
      this.logger.error('Failed to process webhook event', error instanceof Error ? error.stack : String(error));
    }
  }
}
