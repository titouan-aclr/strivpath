import { InternalServerErrorException } from '@nestjs/common';

export class ActivitySyncLimitExceededException extends InternalServerErrorException {
  constructor(userId: number, maxPages: number, totalActivitiesFetched: number, syncType: 'historical' | 'recent') {
    const message =
      `Activity sync limit exceeded for user ${userId}. ` +
      `Stopped after ${maxPages} pages (${totalActivitiesFetched} activities fetched) during ${syncType} sync. ` +
      `This may indicate an issue with pagination or an unusually large dataset.`;
    super(message);
  }
}
