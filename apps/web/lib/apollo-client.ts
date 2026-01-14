import { ApolloClient, HttpLink, InMemoryCache } from '@apollo/client';
import { registerApolloClient } from '@apollo/client-integration-nextjs';
import { AUTH_CONFIG } from './auth/auth.config';

export function createApolloClient() {
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
                return existing.length > 0 ? [...existing, ...incoming] : incoming;
              },
            },
            goals: {
              keyArgs: ['status', 'sportType', 'includeArchived'],
              merge(_: unknown[], incoming: unknown[]): unknown[] {
                return incoming;
              },
            },
            activeGoals: {
              merge(_: unknown[], incoming: unknown[]): unknown[] {
                return incoming;
              },
            },
            goalTemplates: {
              keyArgs: ['category', 'locale'],
              merge(_: unknown[], incoming: unknown[]): unknown[] {
                return incoming;
              },
            },
          },
        },
        Activity: {
          keyFields: ['stravaId'],
        },
        Goal: {
          keyFields: ['id'],
        },
        GoalTemplate: {
          keyFields: ['id'],
        },
      },
    }),
    link: httpLink,
    defaultOptions: {
      watchQuery: {
        fetchPolicy: 'cache-and-network',
      },
    },
  });
}

export const { getClient } = registerApolloClient(createApolloClient);
