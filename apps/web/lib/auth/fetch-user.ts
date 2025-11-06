import { getClient } from '../apollo-client';
import { CurrentUserDocument, UserFullInfoFragmentDoc } from '@/gql/graphql';
import { getFragmentData, type User } from '@/lib/graphql';
import { isNetworkError, isUnauthenticatedError } from './token-refresh-shared';

export const MAX_RETRY_ATTEMPTS = 3;
export const INITIAL_RETRY_DELAY = 1000;

export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function fetchCurrentUserWithRetry(): Promise<User | null> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_RETRY_ATTEMPTS; attempt++) {
    try {
      const { data } = await getClient().query({
        query: CurrentUserDocument,
        errorPolicy: 'none',
      });

      const userFragment = data?.currentUser ? getFragmentData(UserFullInfoFragmentDoc, data.currentUser) : null;

      if (attempt > 1) {
        console.info('[AuthProvider] Successfully fetched user after retry', { attempt });
      }

      return userFragment as User | null;
    } catch (error) {
      lastError = error;

      if (isUnauthenticatedError(error)) {
        console.warn('[AuthProvider] Authentication error - redirecting to login', {
          attempt,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        throw error;
      }

      if (isNetworkError(error)) {
        if (attempt < MAX_RETRY_ATTEMPTS) {
          const delay = INITIAL_RETRY_DELAY * Math.pow(2, attempt - 1);
          console.warn('[AuthProvider] Network error - retrying', {
            attempt,
            nextAttempt: attempt + 1,
            delayMs: delay,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
          await sleep(delay);
          continue;
        } else {
          console.error('[AuthProvider] Network error - max retries exceeded', {
            attempt,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      } else {
        console.error('[AuthProvider] Unexpected error during user fetch', {
          attempt,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }

      throw error;
    }
  }

  throw lastError;
}
