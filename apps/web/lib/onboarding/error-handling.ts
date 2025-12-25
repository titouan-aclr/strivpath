import { CombinedGraphQLErrors } from '@apollo/client/errors';
import { isNetworkError as isAuthNetworkError } from '@/lib/auth/token-refresh-shared';

export type OnboardingErrorType = 'network' | 'token_expired' | 'rate_limit' | 'sync_failed' | 'unknown';

export interface OnboardingError {
  type: OnboardingErrorType;
  message: string;
  code?: string;
  supportId: string;
  retriable: boolean;
  rawError?: unknown;
}

export interface LogOnboardingErrorContext {
  location: string;
  errorType: OnboardingErrorType;
  errorCode?: string;
  supportId: string;
  userId?: string | number;
  syncHistoryId?: number;
  rawError?: unknown;
}

function generateSupportId(error: unknown): string {
  const timestamp = Date.now();
  const errorString = JSON.stringify({
    message: error instanceof Error ? error.message : String(error),
    timestamp,
  });

  let hash = 5381;
  for (let i = 0; i < errorString.length; i++) {
    hash = (hash * 33) ^ errorString.charCodeAt(i);
  }

  return `E-${Math.abs(hash).toString(36).toUpperCase().padStart(6, '0').substring(0, 6)}`;
}

function extractErrorCode(error: unknown): string | undefined {
  if (CombinedGraphQLErrors.is(error)) {
    return error.errors[0]?.extensions?.code as string | undefined;
  }
  return undefined;
}

function extractBackendErrorMessage(error: unknown): string | undefined {
  if (CombinedGraphQLErrors.is(error)) {
    const firstError = error.errors[0];
    const match = firstError?.message?.match(/Activity sync failed: (.+)/);
    return match?.[1];
  }
  return undefined;
}

export function isStravaTokenExpired(error: unknown): boolean {
  if (CombinedGraphQLErrors.is(error)) {
    return error.errors.some(
      err =>
        err.extensions?.code === 'STRAVA_REFRESH_TOKEN_EXPIRED' ||
        err.message?.includes('Strava refresh token expired'),
    );
  }
  return false;
}

export function isRateLimitError(error: unknown): boolean {
  if (CombinedGraphQLErrors.is(error)) {
    return error.errors.some(
      err =>
        err.extensions?.code === 'RATE_LIMIT_EXCEEDED' ||
        err.message?.includes('rate limit') ||
        err.message?.includes('Too Many Requests'),
    );
  }
  return false;
}

export function isSyncFailedError(error: unknown): boolean {
  if (CombinedGraphQLErrors.is(error)) {
    return error.errors.some(err => err.message?.includes('Activity sync failed') || err.message?.includes('sync'));
  }
  return false;
}

export function classifyOnboardingError(error: unknown, t: (key: string) => string): OnboardingError {
  const supportId = generateSupportId(error);
  const code = extractErrorCode(error);

  if (isAuthNetworkError(error)) {
    return {
      type: 'network',
      message: t('onboarding.errors.network'),
      code,
      supportId,
      retriable: true,
      rawError: error,
    };
  }

  if (isStravaTokenExpired(error)) {
    return {
      type: 'token_expired',
      message: t('onboarding.errors.tokenExpired'),
      code: code ?? 'STRAVA_REFRESH_TOKEN_EXPIRED',
      supportId,
      retriable: false,
      rawError: error,
    };
  }

  if (isRateLimitError(error)) {
    return {
      type: 'rate_limit',
      message: t('onboarding.errors.rateLimitTitle'),
      code: code ?? 'RATE_LIMIT_EXCEEDED',
      supportId,
      retriable: false,
      rawError: error,
    };
  }

  if (isSyncFailedError(error)) {
    const backendMessage = extractBackendErrorMessage(error);
    return {
      type: 'sync_failed',
      message: backendMessage ?? t('onboarding.errors.syncFailed'),
      code,
      supportId,
      retriable: true,
      rawError: error,
    };
  }

  return {
    type: 'unknown',
    message: t('onboarding.errors.unknownError'),
    code: code ?? 'UNKNOWN',
    supportId,
    retriable: false,
    rawError: error,
  };
}

export function logOnboardingError(context: LogOnboardingErrorContext): void {
  console.error(`[Onboarding] Error in ${context.location}`, {
    errorType: context.errorType,
    errorCode: context.errorCode,
    supportId: context.supportId,
    userId: context.userId,
    syncHistoryId: context.syncHistoryId,
    timestamp: new Date().toISOString(),
    message: context.rawError instanceof Error ? context.rawError.message : 'Unknown',
    stack: context.rawError instanceof Error ? context.rawError.stack : undefined,
  });
}
