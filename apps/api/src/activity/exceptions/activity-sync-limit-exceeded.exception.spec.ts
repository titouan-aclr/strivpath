import { InternalServerErrorException } from '@nestjs/common';
import { ActivitySyncLimitExceededException } from './activity-sync-limit-exceeded.exception';

describe('ActivitySyncLimitExceededException', () => {
  describe('constructor', () => {
    it('should create exception with correct message for historical sync', () => {
      const userId = 42;
      const maxPages = 20;
      const totalActivitiesFetched = 2000;
      const syncType = 'historical';

      const exception = new ActivitySyncLimitExceededException(userId, maxPages, totalActivitiesFetched, syncType);

      expect(exception).toBeInstanceOf(ActivitySyncLimitExceededException);
      expect(exception.message).toBe(
        `Activity sync limit exceeded for user ${userId}. ` +
          `Stopped after ${maxPages} pages (${totalActivitiesFetched} activities fetched) during ${syncType} sync. ` +
          `This may indicate an issue with pagination or an unusually large dataset.`,
      );
    });

    it('should create exception with correct message for recent sync', () => {
      const userId = 123;
      const maxPages = 15;
      const totalActivitiesFetched = 1500;
      const syncType = 'recent';

      const exception = new ActivitySyncLimitExceededException(userId, maxPages, totalActivitiesFetched, syncType);

      expect(exception).toBeInstanceOf(ActivitySyncLimitExceededException);
      expect(exception.message).toBe(
        `Activity sync limit exceeded for user ${userId}. ` +
          `Stopped after ${maxPages} pages (${totalActivitiesFetched} activities fetched) during ${syncType} sync. ` +
          `This may indicate an issue with pagination or an unusually large dataset.`,
      );
    });

    it('should extend InternalServerErrorException', () => {
      const exception = new ActivitySyncLimitExceededException(1, 10, 1000, 'historical');

      expect(exception).toBeInstanceOf(InternalServerErrorException);
    });

    it('should include userId in error message', () => {
      const userId = 999;
      const exception = new ActivitySyncLimitExceededException(userId, 10, 1000, 'historical');

      expect(exception.message).toContain(`user ${userId}`);
    });

    it('should include maxPages in error message', () => {
      const maxPages = 25;
      const exception = new ActivitySyncLimitExceededException(1, maxPages, 2500, 'historical');

      expect(exception.message).toContain(`${maxPages} pages`);
    });

    it('should include totalActivitiesFetched in error message', () => {
      const totalActivitiesFetched = 3456;
      const exception = new ActivitySyncLimitExceededException(1, 20, totalActivitiesFetched, 'historical');

      expect(exception.message).toContain(`${totalActivitiesFetched} activities fetched`);
    });

    it('should include syncType in error message', () => {
      const syncType = 'historical';
      const exception = new ActivitySyncLimitExceededException(1, 10, 1000, syncType);

      expect(exception.message).toContain(`during ${syncType} sync`);
    });

    it('should handle different combinations of parameters', () => {
      const testCases = [
        { userId: 1, maxPages: 5, total: 500, type: 'historical' as const },
        { userId: 100, maxPages: 20, total: 2000, type: 'recent' as const },
        { userId: 999, maxPages: 1, total: 100, type: 'historical' as const },
        { userId: 42, maxPages: 50, total: 5000, type: 'recent' as const },
      ];

      testCases.forEach(({ userId, maxPages, total, type }) => {
        const exception = new ActivitySyncLimitExceededException(userId, maxPages, total, type);

        expect(exception.message).toContain(`user ${userId}`);
        expect(exception.message).toContain(`${maxPages} pages`);
        expect(exception.message).toContain(`${total} activities fetched`);
        expect(exception.message).toContain(`during ${type} sync`);
      });
    });
  });
});
