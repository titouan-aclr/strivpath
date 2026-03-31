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

export function isRateLimitError(error: unknown): error is CombinedGraphQLErrors {
  if (CombinedGraphQLErrors.is(error)) {
    return error.errors.some(
      err =>
        err.extensions?.code === 'RATE_LIMIT_EXCEEDED' ||
        err.extensions?.code === 'STRAVA_RATE_LIMIT_EXCEEDED' ||
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

  if (error instanceof Error && !CombinedGraphQLErrors.is(error)) {
    const msg = error.message.toLowerCase();
    if (msg.includes('rate limit') || msg.includes('strava_rate_limit')) {
      const isDaily = msg.includes('daily') || msg.includes('midnight');
      return {
        type: 'rate_limit',
        message: isDaily ? t('onboarding.errors.rateLimitDailyTitle') : t('onboarding.errors.rateLimitTitle'),
        code: 'STRAVA_RATE_LIMIT_EXCEEDED',
        supportId,
        retriable: !isDaily,
        rawError: error,
      };
    }
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
    const limitType = (error.errors[0]?.extensions?.limitType as string | undefined) ?? '15min';
    return {
      type: 'rate_limit',
      message:
        limitType === 'daily' ? t('onboarding.errors.rateLimitDailyTitle') : t('onboarding.errors.rateLimitTitle'),
      code: code ?? 'STRAVA_RATE_LIMIT_EXCEEDED',
      supportId,
      retriable: limitType !== 'daily',
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
  // TODO: Implement centralized logging system
  void context;
}
