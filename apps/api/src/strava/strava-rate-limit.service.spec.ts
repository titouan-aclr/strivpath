import { StravaRateLimitService } from './strava-rate-limit.service';

describe('StravaRateLimitService', () => {
  let service: StravaRateLimitService;

  beforeEach(() => {
    service = new StravaRateLimitService();
  });

  describe('updateFromHeaders', () => {
    it('should parse nominal headers and update state', () => {
      service.updateFromHeaders({
        'x-ratelimit-limit': '200,2000',
        'x-ratelimit-usage': '50,300',
        'x-readratelimit-limit': '100,1000',
        'x-readratelimit-usage': '20,150',
      });

      const state = service.getCurrentState();
      expect(state.overall15min).toEqual({ used: 50, limit: 200 });
      expect(state.overallDaily).toEqual({ used: 300, limit: 2000 });
      expect(state.read15min).toEqual({ used: 20, limit: 100 });
      expect(state.readDaily).toEqual({ used: 150, limit: 1000 });
      expect(state.lastUpdatedAt).toBeInstanceOf(Date);
    });

    it('should leave state unchanged when headers are absent', () => {
      service.updateFromHeaders({});

      const state = service.getCurrentState();
      expect(state.overall15min).toEqual({ used: 0, limit: 200 });
      expect(state.overallDaily).toEqual({ used: 0, limit: 2000 });
      expect(state.read15min).toEqual({ used: 0, limit: 100 });
      expect(state.readDaily).toEqual({ used: 0, limit: 1000 });
      expect(state.lastUpdatedAt).toBeNull();
    });

    it('should ignore malformed header values silently', () => {
      service.updateFromHeaders({
        'x-ratelimit-limit': 'not-a-number,also-not',
        'x-ratelimit-usage': 'bad',
      });

      const state = service.getCurrentState();
      expect(state.overall15min.limit).toBe(200);
      expect(state.overall15min.used).toBe(0);
    });

    it('should ignore partial header values (only one part)', () => {
      service.updateFromHeaders({
        'x-ratelimit-limit': '200',
      });

      const state = service.getCurrentState();
      expect(state.overall15min.limit).toBe(200);
    });

    it('should handle header keys case-insensitively', () => {
      service.updateFromHeaders({
        'X-RateLimit-Limit': '200,2000',
        'X-RateLimit-Usage': '80,400',
      });

      const state = service.getCurrentState();
      expect(state.overall15min.used).toBe(80);
      expect(state.overallDaily.used).toBe(400);
    });

    it('should handle array header values by using the first element', () => {
      service.updateFromHeaders({
        'x-ratelimit-limit': ['200,2000', 'ignored'],
        'x-ratelimit-usage': ['50,300', 'ignored'],
      });

      const state = service.getCurrentState();
      expect(state.overall15min.used).toBe(50);
    });

    it('should not set nextWindowResetAt when headers are absent', () => {
      service.updateFromHeaders({});

      const state = service.getCurrentState();
      expect(state.nextWindowResetAt).toBeNull();
      expect(state.nextDailyResetAt).toBeNull();
    });
  });

  describe('isApproachingLimit', () => {
    it('should return false when all counters are at 0', () => {
      expect(service.isApproachingLimit()).toBe(false);
    });

    it('should return true when read15min reaches 80%', () => {
      service.updateFromHeaders({
        'x-readratelimit-limit': '100,1000',
        'x-readratelimit-usage': '80,0',
      });

      expect(service.isApproachingLimit()).toBe(true);
    });

    it('should return true when overall15min reaches 80%', () => {
      service.updateFromHeaders({
        'x-ratelimit-limit': '200,2000',
        'x-ratelimit-usage': '160,0',
      });

      expect(service.isApproachingLimit()).toBe(true);
    });

    it('should return true when readDaily reaches 80%', () => {
      service.updateFromHeaders({
        'x-readratelimit-limit': '100,1000',
        'x-readratelimit-usage': '0,800',
      });

      expect(service.isApproachingLimit()).toBe(true);
    });

    it('should return true when overallDaily reaches 80%', () => {
      service.updateFromHeaders({
        'x-ratelimit-limit': '200,2000',
        'x-ratelimit-usage': '0,1600',
      });

      expect(service.isApproachingLimit()).toBe(true);
    });

    it('should return false when usage is at 79%', () => {
      service.updateFromHeaders({
        'x-ratelimit-limit': '200,2000',
        'x-ratelimit-usage': '158,0',
        'x-readratelimit-limit': '100,1000',
        'x-readratelimit-usage': '79,0',
      });

      expect(service.isApproachingLimit()).toBe(false);
    });

    it('should return true at exactly 80% boundary', () => {
      service.updateFromHeaders({
        'x-readratelimit-limit': '100,1000',
        'x-readratelimit-usage': '80,0',
      });

      expect(service.isApproachingLimit()).toBe(true);
    });

    it('should return true when only one window is above threshold', () => {
      service.updateFromHeaders({
        'x-ratelimit-limit': '200,2000',
        'x-ratelimit-usage': '10,10',
        'x-readratelimit-limit': '100,1000',
        'x-readratelimit-usage': '85,10',
      });

      expect(service.isApproachingLimit()).toBe(true);
    });
  });

  describe('isApproachingDailyLimit', () => {
    it('should return false when only 15min windows are near limit', () => {
      service.updateFromHeaders({
        'x-ratelimit-limit': '200,2000',
        'x-ratelimit-usage': '160,0',
        'x-readratelimit-limit': '100,1000',
        'x-readratelimit-usage': '80,0',
      });

      expect(service.isApproachingDailyLimit()).toBe(false);
    });

    it('should return true when readDaily reaches 80%', () => {
      service.updateFromHeaders({
        'x-readratelimit-limit': '100,1000',
        'x-readratelimit-usage': '0,800',
      });

      expect(service.isApproachingDailyLimit()).toBe(true);
    });

    it('should return true when overallDaily reaches 80%', () => {
      service.updateFromHeaders({
        'x-ratelimit-limit': '200,2000',
        'x-ratelimit-usage': '0,1600',
      });

      expect(service.isApproachingDailyLimit()).toBe(true);
    });

    it('should return false when both daily windows are below threshold', () => {
      service.updateFromHeaders({
        'x-ratelimit-limit': '200,2000',
        'x-ratelimit-usage': '0,1599',
        'x-readratelimit-limit': '100,1000',
        'x-readratelimit-usage': '0,799',
      });

      expect(service.isApproachingDailyLimit()).toBe(false);
    });
  });

  describe('window expiry', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should compute nextWindowResetAt and nextDailyResetAt when headers are parsed', () => {
      jest.setSystemTime(new Date('2026-02-18T14:14:00Z'));

      service.updateFromHeaders({
        'x-ratelimit-limit': '200,2000',
        'x-ratelimit-usage': '50,300',
      });

      const state = service.getCurrentState();
      expect(state.nextWindowResetAt).toEqual(new Date('2026-02-18T14:15:00Z'));
      expect(state.nextDailyResetAt).toEqual(new Date('2026-02-19T00:00:00Z'));
    });

    it('should unblock after the 15min window resets', () => {
      jest.setSystemTime(new Date('2026-02-18T14:14:00Z'));

      service.updateFromHeaders({
        'x-ratelimit-limit': '200,2000',
        'x-ratelimit-usage': '160,0',
      });

      expect(service.isApproachingLimit()).toBe(true);

      jest.setSystemTime(new Date('2026-02-18T14:15:01Z'));

      expect(service.isApproachingLimit()).toBe(false);
    });

    it('should remain blocked just before the 15min window resets', () => {
      jest.setSystemTime(new Date('2026-02-18T14:14:00Z'));

      service.updateFromHeaders({
        'x-readratelimit-limit': '100,1000',
        'x-readratelimit-usage': '80,0',
      });

      jest.setSystemTime(new Date('2026-02-18T14:14:59Z'));

      expect(service.isApproachingLimit()).toBe(true);
    });

    it('should unblock after midnight UTC when daily limit was approaching', () => {
      jest.setSystemTime(new Date('2026-02-18T23:59:00Z'));

      service.updateFromHeaders({
        'x-ratelimit-limit': '200,2000',
        'x-ratelimit-usage': '0,1600',
      });

      expect(service.isApproachingDailyLimit()).toBe(true);
      expect(service.isApproachingLimit()).toBe(true);

      jest.setSystemTime(new Date('2026-02-19T00:00:01Z'));

      expect(service.isApproachingDailyLimit()).toBe(false);
      expect(service.isApproachingLimit()).toBe(false);
    });

    it('should unblock 15min window independently while daily remains blocked', () => {
      jest.setSystemTime(new Date('2026-02-18T14:14:00Z'));

      service.updateFromHeaders({
        'x-ratelimit-limit': '200,2000',
        'x-ratelimit-usage': '160,1600',
      });

      expect(service.isApproachingLimit()).toBe(true);

      jest.setSystemTime(new Date('2026-02-18T14:15:01Z'));

      expect(service.isApproachingLimit()).toBe(true);
      expect(service.isApproachingDailyLimit()).toBe(true);
    });
  });
});
