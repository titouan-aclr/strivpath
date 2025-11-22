'use client';

import { ApolloLink, Observable, FetchResult } from '@apollo/client';
import { RefreshTokenDocument } from '@/gql/graphql';
import { isUnauthenticatedError, isRefreshTokenOperation, isValidRefreshResponse } from './auth/token-refresh-shared';

interface RefreshLinkContext {
  isRefreshing: boolean;
  pendingRequests: Array<(success: boolean) => void>;
}

const refreshContext: RefreshLinkContext = {
  isRefreshing: false,
  pendingRequests: [],
};

export const __resetRefreshContextForTests = () => {
  refreshContext.isRefreshing = false;
  refreshContext.pendingRequests = [];
};

const performTokenRefresh = async (): Promise<boolean> => {
  try {
    const response = await fetch(process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:3011/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        query: RefreshTokenDocument.loc?.source.body,
        operationName: 'RefreshToken',
      }),
    });

    if (!response.ok) {
      console.warn('[RefreshLink] Refresh failed', {
        status: response.status,
      });
      return false;
    }

    const result: unknown = await response.json();

    if (!isValidRefreshResponse(result)) {
      console.error('[RefreshLink] Invalid refresh response format');
      return false;
    }

    return true;
  } catch (error) {
    console.error('[RefreshLink] Token refresh failed', {
      error: error instanceof Error ? error.message : 'Unknown',
    });
    return false;
  }
};

const handleTokenRefresh = async (): Promise<boolean> => {
  if (refreshContext.isRefreshing) {
    return new Promise(resolve => {
      refreshContext.pendingRequests.push(resolve);
    });
  }

  refreshContext.isRefreshing = true;

  try {
    const success = await performTokenRefresh();

    refreshContext.pendingRequests.forEach(callback => callback(success));
    refreshContext.pendingRequests = [];

    return success;
  } catch (error) {
    refreshContext.pendingRequests.forEach(callback => callback(false));
    refreshContext.pendingRequests = [];
    console.error('[RefreshLink] Exception during token refresh', {
      error: error instanceof Error ? error.message : 'Unknown',
    });
    return false;
  } finally {
    refreshContext.isRefreshing = false;
  }
};

export const createRefreshLink = () => {
  return new ApolloLink((operation, forward) => {
    if (isRefreshTokenOperation(operation.operationName)) {
      return forward(operation);
    }

    return new Observable(observer => {
      let subscription: { unsubscribe: () => void } | null = null;

      const attemptRequest = (isRetry = false): void => {
        subscription = forward(operation).subscribe({
          next: (result: FetchResult) => {
            observer.next(result);
          },
          error: (error: Error) => {
            const isUnauth = isUnauthenticatedError(error);

            if (isUnauth && !isRetry) {
              handleTokenRefresh()
                .then(refreshSuccess => {
                  if (refreshSuccess) {
                    attemptRequest(true);
                  } else {
                    console.error('[RefreshLink] Refresh failed - redirecting to login');
                    if (typeof window !== 'undefined') {
                      window.location.href = '/login';
                    }
                    observer.error(error as unknown);
                  }
                })
                .catch(refreshError => {
                  console.error('[RefreshLink] Refresh error - redirecting to login', {
                    error: refreshError instanceof Error ? refreshError.message : 'Unknown',
                  });
                  if (typeof window !== 'undefined') {
                    window.location.href = '/login';
                  }
                  observer.error(error as unknown);
                });
            } else {
              observer.error(error as unknown);
            }
          },
          complete: () => {
            observer.complete();
          },
        });
      };

      attemptRequest();

      return () => {
        subscription?.unsubscribe();
      };
    });
  });
};
