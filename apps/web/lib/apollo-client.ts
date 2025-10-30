import { ApolloClient, HttpLink, InMemoryCache, from, ApolloLink, Observable } from '@apollo/client';
import { registerApolloClient } from '@apollo/client-integration-nextjs';
import { SetContextLink } from '@apollo/client/link/context';
import { CombinedGraphQLErrors } from '@apollo/client/errors';
import { ErrorLink } from '@apollo/client/link/error';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { refreshTokenSSR } from './auth/refresh-token-ssr';

const isUnauthenticatedError = (error: unknown): boolean => {
  if (!CombinedGraphQLErrors.is(error)) {
    return false;
  }

  return error.errors.some(
    err => err.extensions?.code === 'UNAUTHENTICATED' || err.message?.includes('UNAUTHENTICATED'),
  );
};

const isRefreshTokenOperation = (operationName?: string): boolean => {
  return operationName === 'RefreshToken';
};

const refreshLinkSSR = new ApolloLink((operation, forward) => {
  if (isRefreshTokenOperation(operation.operationName)) {
    return forward(operation);
  }

  return new Observable(observer => {
    let subscription: { unsubscribe: () => void } | null = null;

    const attemptRequest = (isRetry = false): void => {
      subscription = forward(operation).subscribe({
        next: result => {
          observer.next(result);
        },
        error: (error: Error) => {
          if (isUnauthenticatedError(error) && !isRetry) {
            refreshTokenSSR()
              .then(refreshSuccess => {
                if (refreshSuccess) {
                  attemptRequest(true);
                } else {
                  console.error('[SSR RefreshLink] Refresh failed, redirecting to login');
                  redirect('/login');
                }
              })
              .catch(refreshError => {
                console.error('[SSR RefreshLink] Refresh error:', refreshError);
                redirect('/login');
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

const errorLink = new ErrorLink(({ error }) => {
  if (CombinedGraphQLErrors.is(error)) {
    error.errors.forEach(({ message, locations, path }) => {
      console.error(
        `[GraphQL error]: Message: ${message}, Location: ${JSON.stringify(locations)}, Path: ${String(path)}`,
      );
    });
  } else {
    console.error('[Network error]:', error);
  }
});

function createApolloClient() {
  const httpLink = new HttpLink({
    uri: process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:3011/graphql',
    credentials: 'include',
  });

  const authLink = new SetContextLink(async prevContext => {
    const cookieStore = await cookies();
    const authCookie = cookieStore.get('Authentication');
    const refreshCookie = cookieStore.get('RefreshToken');

    const cookieHeader = [
      authCookie ? `Authentication=${authCookie.value}` : null,
      refreshCookie ? `RefreshToken=${refreshCookie.value}` : null,
    ]
      .filter(Boolean)
      .join('; ');

    return {
      headers: {
        ...(prevContext.headers as Record<string, string>),
        ...(cookieHeader && { cookie: cookieHeader }),
      },
    };
  });

  return new ApolloClient({
    cache: new InMemoryCache({
      typePolicies: {
        Query: {
          fields: {
            activities: {
              keyArgs: ['filter', ['type']],
              merge(existing: unknown[] = [], incoming: unknown[]): unknown[] {
                return [...existing, ...incoming];
              },
            },
          },
        },
        Activity: {
          keyFields: ['stravaId'],
        },
      },
    }),
    link: from([refreshLinkSSR, errorLink, authLink, httpLink]),
    defaultOptions: {
      watchQuery: {
        fetchPolicy: 'cache-and-network',
      },
    },
  });
}

export const { getClient, query, PreloadQuery } = registerApolloClient(createApolloClient);
