import { getClient } from '../apollo-client';
import { CurrentUserDocument, UserFullInfoFragmentDoc } from '@/gql/graphql';
import { getFragmentData, type User } from '@/lib/graphql';
import { isNetworkError, isUnauthenticatedError } from './token-refresh-shared';
import { getServerRequestContext, type ApolloServerContext } from '../apollo-ssr-context';
import { AUTH_CONFIG } from './auth.config';

export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

function isUser(value: unknown): value is User {
  if (!value || typeof value !== 'object') return false;
  const user = value as Record<string, unknown>;
  return typeof user.id === 'string' && typeof user.username === 'string';
}

export async function fetchCurrentUserWithRetry(context?: ApolloServerContext): Promise<User | null> {
  let lastError: unknown;

  const apolloContext = context ?? (await getServerRequestContext());

  for (let attempt = 1; attempt <= AUTH_CONFIG.retry.maxAttempts; attempt++) {
    try {
      const { data } = await getClient().query({
        query: CurrentUserDocument,
        context: apolloContext,
        errorPolicy: 'none',
      });

      const userFragment = data?.currentUser ? getFragmentData(UserFullInfoFragmentDoc, data.currentUser) : null;

      if (userFragment && isUser(userFragment)) {
        return userFragment;
      }

      return null;
    } catch (error) {
      lastError = error;

      if (isUnauthenticatedError(error)) {
        return null;
      }

      if (isNetworkError(error)) {
        if (attempt < AUTH_CONFIG.retry.maxAttempts) {
          const delay = AUTH_CONFIG.retry.initialDelay * Math.pow(2, attempt - 1);
          await sleep(delay);
          continue;
        }
      }

      throw error;
    }
  }

  throw lastError;
}
