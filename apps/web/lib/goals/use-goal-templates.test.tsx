import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { ApolloClient, InMemoryCache, HttpLink, from } from '@apollo/client';
import { ApolloProvider } from '@apollo/client/react';
import { ErrorLink } from '@apollo/client/link/error';
import { server } from '@/mocks/server';
import { graphql, HttpResponse } from 'msw';
import { MOCK_TEMPLATES_ARRAY } from '@/mocks/fixtures/goal.fixture';
import { useGoalTemplates } from './use-goal-templates';

vi.mock('next-intl', () => ({
  useLocale: () => 'fr',
}));

let testClient: ReturnType<typeof createTestApolloClient>;

const createTestApolloClient = () => {
  const errorLink = new ErrorLink(({ error }) => {
    console.error('[GraphQL error]:', error);
  });

  const httpLink = new HttpLink({
    uri: 'http://localhost:3011/graphql',
    credentials: 'include',
  });

  return new ApolloClient({
    cache: new InMemoryCache({
      typePolicies: {
        Query: {
          fields: {
            goalTemplates: {
              keyArgs: ['category', 'locale'],
              merge(_: unknown[], incoming: unknown[]): unknown[] {
                return incoming;
              },
            },
          },
        },
        GoalTemplate: {
          keyFields: ['id'],
        },
      },
    }),
    link: from([errorLink, httpLink]),
    defaultOptions: {
      watchQuery: {
        fetchPolicy: 'cache-and-network',
      },
    },
  });
};

const createWrapper = () => {
  return ({ children }: { children: React.ReactNode }) => (
    <ApolloProvider client={testClient}>{children}</ApolloProvider>
  );
};

describe('useGoalTemplates', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    testClient = createTestApolloClient();
  });

  afterEach(async () => {
    await testClient.clearStore();
  });

  describe('Fetching templates', () => {
    it('should fetch templates successfully', async () => {
      server.use(
        graphql.query('GoalTemplates', () => {
          return HttpResponse.json({
            data: { goalTemplates: MOCK_TEMPLATES_ARRAY },
          });
        }),
      );

      const { result } = renderHook(() => useGoalTemplates(), {
        wrapper: createWrapper(),
      });

      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.templates).toHaveLength(MOCK_TEMPLATES_ARRAY.length);
      expect(result.current.error).toBeUndefined();
    });

    it('should return empty array when no templates', async () => {
      server.use(
        graphql.query('GoalTemplates', () => {
          return HttpResponse.json({
            data: { goalTemplates: [] },
          });
        }),
      );

      const { result } = renderHook(() => useGoalTemplates(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.templates).toEqual([]);
    });
  });

  describe('Locale support', () => {
    it('should use context locale by default', async () => {
      let capturedLocale: string | undefined;

      server.use(
        graphql.query('GoalTemplates', ({ variables }) => {
          capturedLocale = variables.locale as string;
          return HttpResponse.json({
            data: { goalTemplates: MOCK_TEMPLATES_ARRAY },
          });
        }),
      );

      const { result } = renderHook(() => useGoalTemplates(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(capturedLocale).toBe('FR');
    });

    it('should override locale when provided', async () => {
      let capturedLocale: string | undefined;

      server.use(
        graphql.query('GoalTemplates', ({ variables }) => {
          capturedLocale = variables.locale as string;
          return HttpResponse.json({
            data: { goalTemplates: MOCK_TEMPLATES_ARRAY },
          });
        }),
      );

      const { result } = renderHook(() => useGoalTemplates({ locale: 'en' }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(capturedLocale).toBe('EN');
    });
  });

  describe('Category filtering', () => {
    it('should filter by category', async () => {
      let capturedCategory: string | undefined;

      server.use(
        graphql.query('GoalTemplates', ({ variables }) => {
          capturedCategory = variables.category as string;
          const filtered = variables.category
            ? MOCK_TEMPLATES_ARRAY.filter(t => t.category === variables.category)
            : MOCK_TEMPLATES_ARRAY;

          return HttpResponse.json({
            data: { goalTemplates: filtered },
          });
        }),
      );

      const { result } = renderHook(() => useGoalTemplates({ category: 'beginner' }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(capturedCategory).toBe('beginner');
      expect(result.current.templates.every(t => t.category === 'beginner')).toBe(true);
    });
  });

  describe('Error handling', () => {
    it('should handle network errors', async () => {
      server.use(graphql.query('GoalTemplates', () => HttpResponse.error()));

      const { result } = renderHook(() => useGoalTemplates(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBeDefined();
      expect(result.current.templates).toEqual([]);
    });

    it('should handle GraphQL errors', async () => {
      server.use(
        graphql.query('GoalTemplates', () => {
          return HttpResponse.json({
            errors: [
              {
                message: 'Unauthorized',
                extensions: { code: 'UNAUTHENTICATED' },
              },
            ],
            data: null,
          });
        }),
      );

      const { result } = renderHook(() => useGoalTemplates(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBeDefined();
    });
  });

  describe('Refetch', () => {
    it('should refetch templates', async () => {
      const spy = vi.fn();

      server.use(
        graphql.query('GoalTemplates', () => {
          spy();
          return HttpResponse.json({
            data: { goalTemplates: MOCK_TEMPLATES_ARRAY },
          });
        }),
      );

      const { result } = renderHook(() => useGoalTemplates(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(spy).toHaveBeenCalledTimes(1);

      await result.current.refetch();

      expect(spy).toHaveBeenCalledTimes(2);
    });
  });
});
