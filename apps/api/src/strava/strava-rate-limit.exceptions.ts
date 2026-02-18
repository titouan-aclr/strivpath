import { ServiceUnavailableException } from '@nestjs/common';

export class StravaRateLimitExceededException extends ServiceUnavailableException {
  constructor(context: string, limitType: 'daily' | '15min' = '15min') {
    super({
      message:
        limitType === 'daily'
          ? `Strava daily rate limit reached during ${context}. Sync cannot continue until midnight UTC.`
          : `Strava rate limit exceeded during ${context}. Please retry after the current 15-minute window resets.`,
      errorCode: 'STRAVA_RATE_LIMIT_EXCEEDED',
      limitType,
    });
  }
}
