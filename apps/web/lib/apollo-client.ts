import { ApolloClient, HttpLink, InMemoryCache, from } from '@apollo/client';
import { registerApolloClient } from '@apollo/client-integration-nextjs';
import { SetContextLink } from '@apollo/client/link/context';
import { CombinedGraphQLErrors } from '@apollo/client/errors';
import { ErrorLink } from '@apollo/client/link/error';
import { cookies } from 'next/headers';

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
    link: from([errorLink, authLink, httpLink]),
    defaultOptions: {
      watchQuery: {
        fetchPolicy: 'cache-and-network',
      },
    },
  });
}

export const { getClient, query, PreloadQuery } = registerApolloClient(createApolloClient);
