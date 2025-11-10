import { getClient } from '../apollo-client';
import { CurrentUserDocument, UserFullInfoFragmentDoc } from '@/gql/graphql';
import { getFragmentData, type User } from '@/lib/graphql';
import { isNetworkError, isUnauthenticatedError } from './token-refresh-shared';
import { getServerRequestContext } from '../apollo-ssr-context';

export const MAX_RETRY_ATTEMPTS = 3;
export const INITIAL_RETRY_DELAY = 1000;

export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function fetchCurrentUserWithRetry(): Promise<User | null> {
  let lastError: unknown;

  const context = await getServerRequestContext();

  for (let attempt = 1; attempt <= MAX_RETRY_ATTEMPTS; attempt++) {
    try {
      const { data } = await getClient().query({
        query: CurrentUserDocument,
        context,
        errorPolicy: 'none',
      });

      const userFragment = data?.currentUser ? getFragmentData(UserFullInfoFragmentDoc, data.currentUser) : null;

      return userFragment as User | null;
    } catch (error) {
      lastError = error;

      if (isUnauthenticatedError(error)) {
        console.warn('[SSR Auth] Access token expired - deferring to client refresh', {
          attempt,
          message: error instanceof Error ? error.message : 'Unauthorized',
        });
        return null;
      }

      if (isNetworkError(error)) {
        if (attempt < MAX_RETRY_ATTEMPTS) {
          const delay = INITIAL_RETRY_DELAY * Math.pow(2, attempt - 1);
          console.warn('[SSR Auth] Network error - retrying', {
            attempt,
            nextAttempt: attempt + 1,
            delayMs: delay,
          });
          await sleep(delay);
          continue;
        } else {
          console.error('[SSR Auth] Network error - max retries exceeded', {
            attempt,
            error: error instanceof Error ? error.message : 'Unknown',
          });
        }
      } else {
        console.error('[SSR Auth] Unexpected error', {
          attempt,
          type: error instanceof Error ? error.constructor.name : typeof error,
          message: error instanceof Error ? error.message : 'Unknown',
        });
      }

      throw error;
    }
  }

  throw lastError;
}
