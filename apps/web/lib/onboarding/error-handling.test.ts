import { describe, it, expect, vi } from 'vitest';
import { CombinedGraphQLErrors } from '@apollo/client/errors';
import { GraphQLError } from 'graphql';
import {
  classifyOnboardingError,
  isStravaTokenExpired,
  isRateLimitError,
  isSyncFailedError,
  logOnboardingError,
} from './error-handling';

const mockT = (key: string) => {
  const translations: Record<string, string> = {
    'onboarding.errors.network': 'Connection error',
    'onboarding.errors.tokenExpired': 'Strava connection expired',
    'onboarding.errors.rateLimitTitle': 'Too many requests',
    'onboarding.errors.syncFailed': 'Failed to sync activities',
    'onboarding.errors.unknownError': 'An unexpected error occurred',
  };
  return translations[key] || key;
};

describe('isStravaTokenExpired', () => {
  it('should return true for STRAVA_REFRESH_TOKEN_EXPIRED error code', () => {
    const graphQLError = new GraphQLError('Token expired', {
      extensions: { code: 'STRAVA_REFRESH_TOKEN_EXPIRED' },
    });
    const combinedError = new CombinedGraphQLErrors({
      errors: [graphQLError],
    });

    expect(isStravaTokenExpired(combinedError)).toBe(true);
  });

  it('should return true for error message containing "Strava refresh token expired"', () => {
    const graphQLError = new GraphQLError('Strava refresh token expired. Please reconnect.');
    const combinedError = new CombinedGraphQLErrors({
      errors: [graphQLError],
    });

    expect(isStravaTokenExpired(combinedError)).toBe(true);
  });

  it('should return false for other errors', () => {
    const graphQLError = new GraphQLError('Some other error');
    const combinedError = new CombinedGraphQLErrors({
      errors: [graphQLError],
    });

    expect(isStravaTokenExpired(combinedError)).toBe(false);
  });

  it('should return false for non-GraphQL errors', () => {
    expect(isStravaTokenExpired(new Error('Network error'))).toBe(false);
    expect(isStravaTokenExpired(new TypeError('Failed to fetch'))).toBe(false);
  });
});

describe('isRateLimitError', () => {
  it('should return true for RATE_LIMIT_EXCEEDED error code', () => {
    const graphQLError = new GraphQLError('Rate limit exceeded', {
      extensions: { code: 'RATE_LIMIT_EXCEEDED' },
    });
    const combinedError = new CombinedGraphQLErrors({
      errors: [graphQLError],
    });

    expect(isRateLimitError(combinedError)).toBe(true);
  });

  it('should return true for error message containing "rate limit"', () => {
    const graphQLError = new GraphQLError('API rate limit exceeded');
    const combinedError = new CombinedGraphQLErrors({
      errors: [graphQLError],
    });

    expect(isRateLimitError(combinedError)).toBe(true);
  });

  it('should return true for "Too Many Requests" message', () => {
    const graphQLError = new GraphQLError('Too Many Requests');
    const combinedError = new CombinedGraphQLErrors({
      errors: [graphQLError],
    });

    expect(isRateLimitError(combinedError)).toBe(true);
  });

  it('should return false for other errors', () => {
    const graphQLError = new GraphQLError('Some other error');
    const combinedError = new CombinedGraphQLErrors({
      errors: [graphQLError],
    });

    expect(isRateLimitError(combinedError)).toBe(false);
  });
});

describe('isSyncFailedError', () => {
  it('should return true for error message containing "Activity sync failed"', () => {
    const graphQLError = new GraphQLError('Activity sync failed: Network timeout');
    const combinedError = new CombinedGraphQLErrors({
      errors: [graphQLError],
    });

    expect(isSyncFailedError(combinedError)).toBe(true);
  });

  it('should return true for error message containing "sync"', () => {
    const graphQLError = new GraphQLError('Database sync error');
    const combinedError = new CombinedGraphQLErrors({
      errors: [graphQLError],
    });

    expect(isSyncFailedError(combinedError)).toBe(true);
  });

  it('should return false for other errors', () => {
    const graphQLError = new GraphQLError('Some other error');
    const combinedError = new CombinedGraphQLErrors({
      errors: [graphQLError],
    });

    expect(isSyncFailedError(combinedError)).toBe(false);
  });
});

describe('classifyOnboardingError', () => {
  it('should classify network errors correctly', () => {
    const error = new TypeError('Failed to fetch');
    const result = classifyOnboardingError(error, mockT);

    expect(result.type).toBe('network');
    expect(result.message).toBe('Connection error');
    expect(result.retriable).toBe(true);
    expect(result.supportId).toMatch(/^E-[A-Z0-9]{1,6}$/);
  });

  it('should classify Strava token expired errors correctly', () => {
    const graphQLError = new GraphQLError('Token expired', {
      extensions: { code: 'STRAVA_REFRESH_TOKEN_EXPIRED' },
    });
    const combinedError = new CombinedGraphQLErrors({
      errors: [graphQLError],
    });
    const result = classifyOnboardingError(combinedError, mockT);

    expect(result.type).toBe('token_expired');
    expect(result.message).toBe('Strava connection expired');
    expect(result.code).toBe('STRAVA_REFRESH_TOKEN_EXPIRED');
    expect(result.retriable).toBe(false);
    expect(result.supportId).toMatch(/^E-[A-Z0-9]{1,6}$/);
  });

  it('should classify rate limit errors correctly', () => {
    const graphQLError = new GraphQLError('Rate limit exceeded', {
      extensions: { code: 'RATE_LIMIT_EXCEEDED' },
    });
    const combinedError = new CombinedGraphQLErrors({
      errors: [graphQLError],
    });
    const result = classifyOnboardingError(combinedError, mockT);

    expect(result.type).toBe('rate_limit');
    expect(result.message).toBe('Too many requests');
    expect(result.code).toBe('RATE_LIMIT_EXCEEDED');
    expect(result.retriable).toBe(false);
    expect(result.supportId).toMatch(/^E-[A-Z0-9]{1,6}$/);
  });

  it('should classify sync failed errors correctly', () => {
    const graphQLError = new GraphQLError('Activity sync failed: Database connection lost', {
      extensions: { code: 'SYNC_ERROR' },
    });
    const combinedError = new CombinedGraphQLErrors({
      errors: [graphQLError],
    });
    const result = classifyOnboardingError(combinedError, mockT);

    expect(result.type).toBe('sync_failed');
    expect(result.message).toBe('Database connection lost');
    expect(result.retriable).toBe(true);
    expect(result.supportId).toMatch(/^E-[A-Z0-9]{1,6}$/);
  });

  it('should classify unknown errors with fallback', () => {
    const error = new Error('Some random error');
    const result = classifyOnboardingError(error, mockT);

    expect(result.type).toBe('unknown');
    expect(result.message).toBe('An unexpected error occurred');
    expect(result.code).toBe('UNKNOWN');
    expect(result.retriable).toBe(false);
    expect(result.supportId).toMatch(/^E-[A-Z0-9]{1,6}$/);
  });

  it('should extract error code from GraphQL extensions', () => {
    const graphQLError = new GraphQLError('Custom error', {
      extensions: { code: 'CUSTOM_ERROR_CODE' },
    });
    const combinedError = new CombinedGraphQLErrors({
      errors: [graphQLError],
    });
    const result = classifyOnboardingError(combinedError, mockT);

    expect(result.code).toBe('CUSTOM_ERROR_CODE');
  });

  it('should generate unique support IDs for different errors', () => {
    const error1 = new Error('Error 1');
    const error2 = new Error('Error 2');

    const result1 = classifyOnboardingError(error1, mockT);
    const result2 = classifyOnboardingError(error2, mockT);

    expect(result1.supportId).not.toBe(result2.supportId);
  });

  it('should include rawError in result', () => {
    const error = new Error('Test error');
    const result = classifyOnboardingError(error, mockT);

    expect(result.rawError).toBe(error);
  });
});

describe('logOnboardingError', () => {
  it('should log error with structured context', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const error = new Error('Test error');

    logOnboardingError({
      location: 'test-location',
      errorType: 'network',
      errorCode: 'TEST_CODE',
      supportId: 'E-ABC123',
      userId: 42,
      syncHistoryId: 100,
      rawError: error,
    });

    expect(consoleSpy).toHaveBeenCalledWith(
      '[Onboarding] Error in test-location',
      expect.objectContaining({
        errorType: 'network',
        errorCode: 'TEST_CODE',
        supportId: 'E-ABC123',
        userId: 42,
        syncHistoryId: 100,
        message: 'Test error',
        timestamp: expect.any(String) as string,
        stack: expect.any(String) as string,
      }),
    );

    consoleSpy.mockRestore();
  });

  it('should handle non-Error objects in rawError', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    logOnboardingError({
      location: 'test-location',
      errorType: 'unknown',
      supportId: 'E-DEF456',
      rawError: 'string error',
    });

    expect(consoleSpy).toHaveBeenCalledWith(
      '[Onboarding] Error in test-location',
      expect.objectContaining({
        message: 'Unknown',
        stack: undefined,
      }),
    );

    consoleSpy.mockRestore();
  });

  it('should format timestamp as ISO string', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    logOnboardingError({
      location: 'test-location',
      errorType: 'network',
      supportId: 'E-GHI789',
      rawError: new Error('Test'),
    });

    const loggedData = consoleSpy.mock.calls[0]?.[1] as { timestamp: string } | undefined;
    expect(loggedData?.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);

    consoleSpy.mockRestore();
  });
});

describe('Support ID generation', () => {
  it('should generate deterministic support IDs for same errors at same timestamp', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-01T00:00:00Z'));

    const error = new Error('Same error');
    const result1 = classifyOnboardingError(error, mockT);
    const result2 = classifyOnboardingError(error, mockT);

    expect(result1.supportId).toBe(result2.supportId);

    vi.useRealTimers();
  });

  it('should generate different support IDs at different timestamps', () => {
    vi.useFakeTimers();

    vi.setSystemTime(new Date('2025-01-01T00:00:00Z'));
    const error = new Error('Same error');
    const result1 = classifyOnboardingError(error, mockT);

    vi.setSystemTime(new Date('2025-01-01T00:00:01Z'));
    const result2 = classifyOnboardingError(error, mockT);

    expect(result1.supportId).not.toBe(result2.supportId);

    vi.useRealTimers();
  });

  it('should generate 6-character alphanumeric support IDs', () => {
    const error = new Error('Test');
    const result = classifyOnboardingError(error, mockT);

    expect(result.supportId).toMatch(/^E-[A-Z0-9]{1,6}$/);
  });
});
