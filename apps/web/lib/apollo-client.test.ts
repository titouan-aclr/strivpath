import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { gql } from '@apollo/client';
import { server } from '@/mocks/server';
import { graphql, HttpResponse, http } from 'msw';
import { MOCK_USERS } from '@/mocks/handlers';

vi.mock('@apollo/client-integration-nextjs', () => ({
  registerApolloClient: vi.fn((createClient: () => unknown) => {
    let cachedClient: unknown;
    return {
      getClient: () => {
        if (!cachedClient) {
          cachedClient = createClient();
        }
        return cachedClient;
      },
    };
  }),
}));

import { createApolloClient } from './apollo-client';

interface TestQueryData {
  currentUser: {
    id: string;
    username: string;
    firstname: string;
    lastname: string;
  };
}

const TEST_QUERY = gql`
  query CurrentUser {
    currentUser {
      id
      username
      firstname
      lastname
    }
  }
`;

describe('apollo-client (SSR)', () => {
  let consoleErrorSpy: vi.SpyInstance;
  let originalEnv: string | undefined;

  beforeEach(() => {
    vi.clearAllMocks();
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    originalEnv = process.env.NEXT_PUBLIC_GRAPHQL_URL;
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    process.env.NEXT_PUBLIC_GRAPHQL_URL = originalEnv;
  });

  describe('Client Creation', () => {
    it('should create a valid Apollo Client instance', () => {
      const client = createApolloClient();

      expect(client).toBeDefined();
      expect(client.cache).toBeDefined();
      expect(client.link).toBeDefined();
    });

    it('should handle successful GraphQL queries', async () => {
      const client = createApolloClient();

      server.use(
        graphql.query('CurrentUser', () => {
          return HttpResponse.json({
            data: {
              currentUser: {
                __typename: 'User',
                ...MOCK_USERS.john,
              },
            },
          });
        }),
      );

      const result = await client.query<TestQueryData>({
        query: TEST_QUERY,
        fetchPolicy: 'network-only',
      });

      expect(result.data).toBeDefined();
      expect(result.data?.currentUser.id).toBe(MOCK_USERS.john.id);
      expect(result.data?.currentUser.username).toBe(MOCK_USERS.john.username);
    });
  });

  describe('Cache Configuration', () => {
    it('should configure typePolicies for activities query', () => {
      const client = createApolloClient();
      const cache = client.cache as unknown as {
        config: {
          typePolicies?: {
            Query?: {
              fields?: {
                activities?: {
                  keyArgs?: string[] | [string, string[]];
                  merge?: (existing: unknown[], incoming: unknown[]) => unknown[];
                };
              };
            };
          };
        };
      };

      expect(cache.config.typePolicies?.Query?.fields?.activities).toBeDefined();
      expect(cache.config.typePolicies?.Query?.fields?.activities?.keyArgs).toEqual(['filter', ['type']]);
    });

    it('should merge activities arrays correctly', () => {
      const client = createApolloClient();
      const cache = client.cache as unknown as {
        config: {
          typePolicies?: {
            Query?: {
              fields?: {
                activities?: {
                  merge?: (existing: unknown[], incoming: unknown[]) => unknown[];
                };
              };
            };
          };
        };
      };

      const mergeFunction = cache.config.typePolicies?.Query?.fields?.activities?.merge;
      expect(mergeFunction).toBeDefined();

      if (mergeFunction) {
        const existing = [{ id: '1' }, { id: '2' }];
        const incoming = [{ id: '3' }, { id: '4' }];
        const merged = mergeFunction(existing, incoming);

        expect(merged).toEqual([{ id: '1' }, { id: '2' }, { id: '3' }, { id: '4' }]);
      }
    });

    it('should handle empty existing array in merge', () => {
      const client = createApolloClient();
      const cache = client.cache as unknown as {
        config: {
          typePolicies?: {
            Query?: {
              fields?: {
                activities?: {
                  merge?: (existing: unknown[], incoming: unknown[]) => unknown[];
                };
              };
            };
          };
        };
      };

      const mergeFunction = cache.config.typePolicies?.Query?.fields?.activities?.merge;

      if (mergeFunction) {
        const incoming = [{ id: '1' }, { id: '2' }];
        const merged = mergeFunction(undefined as unknown as [], incoming);

        expect(merged).toEqual([{ id: '1' }, { id: '2' }]);
      }
    });

    it('should configure Activity keyFields with stravaId', () => {
      const client = createApolloClient();
      const cache = client.cache as unknown as {
        config: {
          typePolicies?: {
            Activity?: {
              keyFields?: string[];
            };
          };
        };
      };

      expect(cache.config.typePolicies?.Activity?.keyFields).toEqual(['stravaId']);
    });

    it('should configure default watchQuery fetchPolicy', () => {
      const client = createApolloClient();

      expect(client.defaultOptions.watchQuery?.fetchPolicy).toBe('cache-and-network');
    });
  });

  describe('ErrorLink Behavior', () => {
    it('should log GraphQL errors to console with correct format', async () => {
      const client = createApolloClient();

      server.use(
        graphql.query('CurrentUser', () => {
          return HttpResponse.json({
            errors: [
              {
                message: 'Test GraphQL error',
                locations: [{ line: 1, column: 1 }],
                path: ['currentUser'],
              },
            ],
            data: null,
          });
        }),
      );

      await expect(
        client.query<TestQueryData>({
          query: TEST_QUERY,
          fetchPolicy: 'network-only',
          errorPolicy: 'none',
        }),
      ).rejects.toThrow();

      expect(
        consoleErrorSpy.mock.calls.some(call => {
          const message = String(call[0]);
          return (
            message.includes('[GraphQL error]: Message: Test GraphQL error') &&
            message.includes('Location:') &&
            message.includes('Path: currentUser')
          );
        }),
      ).toBe(true);
    });

    it('should log network errors to console', async () => {
      const client = createApolloClient();

      server.use(
        graphql.query('CurrentUser', () => {
          return HttpResponse.error();
        }),
      );

      await expect(
        client.query<TestQueryData>({
          query: TEST_QUERY,
          fetchPolicy: 'network-only',
          errorPolicy: 'none',
        }),
      ).rejects.toThrow();

      expect(consoleErrorSpy).toHaveBeenCalledWith('[Network error]:', expect.any(Object));
    });

    it('should handle multiple GraphQL errors', async () => {
      const client = createApolloClient();

      server.use(
        graphql.query('CurrentUser', () => {
          return HttpResponse.json({
            errors: [
              {
                message: 'Error 1',
                locations: [{ line: 1, column: 1 }],
                path: ['field1'],
              },
              {
                message: 'Error 2',
                locations: [{ line: 2, column: 1 }],
                path: ['field2'],
              },
            ],
            data: null,
          });
        }),
      );

      await expect(
        client.query<TestQueryData>({
          query: TEST_QUERY,
          fetchPolicy: 'network-only',
          errorPolicy: 'none',
        }),
      ).rejects.toThrow();

      expect(
        consoleErrorSpy.mock.calls.some(call => {
          const message = String(call[0]);
          return message.includes('[GraphQL error]: Message: Error 1') && message.includes('Path: field1');
        }),
      ).toBe(true);

      expect(
        consoleErrorSpy.mock.calls.some(call => {
          const message = String(call[0]);
          return message.includes('[GraphQL error]: Message: Error 2') && message.includes('Path: field2');
        }),
      ).toBe(true);
    });
  });

  describe('HttpLink Configuration', () => {
    it('should use default GraphQL URL when environment variable not set', async () => {
      delete process.env.NEXT_PUBLIC_GRAPHQL_URL;

      const client = createApolloClient();
      let capturedUrl = '';

      server.use(
        http.post('http://localhost:3011/graphql', ({ request }) => {
          capturedUrl = request.url;
          return HttpResponse.json({
            data: {
              currentUser: {
                __typename: 'User',
                ...MOCK_USERS.john,
              },
            },
          });
        }),
      );

      await client.query<TestQueryData>({
        query: TEST_QUERY,
        fetchPolicy: 'network-only',
      });

      expect(capturedUrl).toBe('http://localhost:3011/graphql');
    });

    it('should use custom GraphQL URL from environment variable', async () => {
      process.env.NEXT_PUBLIC_GRAPHQL_URL = 'http://custom-url:4000/graphql';

      const client = createApolloClient();
      let capturedUrl = '';

      server.use(
        http.post('http://custom-url:4000/graphql', ({ request }) => {
          capturedUrl = request.url;
          return HttpResponse.json({
            data: {
              currentUser: {
                __typename: 'User',
                ...MOCK_USERS.john,
              },
            },
          });
        }),
      );

      await client.query<TestQueryData>({
        query: TEST_QUERY,
        fetchPolicy: 'network-only',
      });

      expect(capturedUrl).toBe('http://custom-url:4000/graphql');
    });

    it('should successfully make HTTP requests with proper configuration', async () => {
      const client = createApolloClient();
      let requestMade = false;

      server.use(
        graphql.query('CurrentUser', () => {
          requestMade = true;
          return HttpResponse.json({
            data: {
              currentUser: {
                __typename: 'User',
                ...MOCK_USERS.john,
              },
            },
          });
        }),
      );

      const result = await client.query<TestQueryData>({
        query: TEST_QUERY,
        fetchPolicy: 'network-only',
      });

      expect(requestMade).toBe(true);
      expect(result.data?.currentUser).toBeDefined();
    });
  });
});
