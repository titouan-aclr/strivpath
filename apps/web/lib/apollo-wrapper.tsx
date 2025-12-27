'use client';

import { ApolloLink, HttpLink } from '@apollo/client';
import {
  ApolloClient,
  ApolloNextAppProvider,
  InMemoryCache,
  SSRMultipartLink,
} from '@apollo/client-integration-nextjs';
import { createRefreshLink } from './apollo-refresh-link';
import { AUTH_CONFIG } from './auth/auth.config';

function makeClient() {
  const refreshLink = createRefreshLink();

  const httpLink = new HttpLink({
    uri: AUTH_CONFIG.graphqlUrl,
    credentials: 'include',
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
    link:
      typeof window === 'undefined'
        ? ApolloLink.from([new SSRMultipartLink({ stripDefer: true }), httpLink])
        : ApolloLink.from([refreshLink, httpLink]),
    defaultOptions: {
      watchQuery: {
        fetchPolicy: 'cache-and-network',
      },
    },
  });
}

export function ApolloWrapper({ children }: { children: React.ReactNode }) {
  return <ApolloNextAppProvider makeClient={makeClient}>{children}</ApolloNextAppProvider>;
}
