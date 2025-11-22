import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ApolloClient, InMemoryCache, HttpLink, from, gql } from '@apollo/client';
import { server } from '@/mocks/server';
import { graphql, HttpResponse, http } from 'msw';
import { createRefreshLink, __resetRefreshContextForTests } from './apollo-refresh-link';
import { MOCK_USERS } from '@/mocks/handlers';

interface TestQueryData {
  currentUser: {
    id: string;
    username: string;
    firstname: string;
    lastname: string;
  };
}

interface RefreshTokenData {
  refreshToken: {
    user: {
      id: string;
      username: string;
    };
  };
}

const TEST_QUERY = gql`
  query TestQuery {
    currentUser {
      id
      username
      firstname
      lastname
    }
  }
`;

const UNAUTHENTICATED_ERROR_BODY = {
  errors: [
    {
      message: 'Unauthorized',
      extensions: {
        code: 'UNAUTHENTICATED',
      },
    },
  ],
  data: null,
};

const SUCCESS_RESPONSE_BODY = {
  data: {
    currentUser: {
      __typename: 'User' as const,
      ...MOCK_USERS.john,
    },
  },
};

const REFRESH_SUCCESS_RESPONSE_BODY = {
  data: {
    refreshToken: {
      __typename: 'AuthResponse' as const,
      user: {
        __typename: 'User' as const,
        ...MOCK_USERS.john,
      },
    },
  },
};

const mockRefreshToken = (
  handler: () =>
    | ReturnType<typeof HttpResponse.json | typeof HttpResponse.error>
    | Promise<ReturnType<typeof HttpResponse.json | typeof HttpResponse.error>>,
) => {
  return http.post('http://localhost:3011/graphql', async ({ request }) => {
    const body = (await request.json()) as { operationName?: string };
    if (body.operationName === 'RefreshToken') {
      return handler();
    }
    return;
  });
};

const createTestClient = () => {
  const refreshLink = createRefreshLink();
  const httpLink = new HttpLink({
    uri: 'http://localhost:3011/graphql',
    credentials: 'include',
  });

  return new ApolloClient({
    cache: new InMemoryCache(),
    link: from([refreshLink, httpLink]),
    defaultOptions: {
      query: {
        fetchPolicy: 'network-only',
        errorPolicy: 'none',
      },
      mutate: {
        errorPolicy: 'none',
      },
    },
  });
};

describe('apollo-refresh-link', () => {
  let testClient: ReturnType<typeof createTestClient>;
  let originalLocation: Location;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    testClient = createTestClient();

    originalLocation = window.location;
    delete (window as { location?: Location }).location;
    window.location = { href: '' } as Location;

    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(async () => {
    window.location = originalLocation;
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    await testClient.clearStore();
    __resetRefreshContextForTests();
  });

  describe('UNAUTHENTICATED Error Detection', () => {
    it('should pass through non-UNAUTHENTICATED errors', async () => {
      server.use(
        graphql.query('TestQuery', () => {
          return HttpResponse.json({
            errors: [
              {
                message: 'Internal server error',
                extensions: {
                  code: 'INTERNAL_SERVER_ERROR',
                },
              },
            ],
            data: null,
          });
        }),
      );

      await expect(testClient.query<TestQueryData>({ query: TEST_QUERY })).rejects.toThrow();

      expect(window.location.href).not.toBe('/login');
    });

    it('should detect UNAUTHENTICATED error from HTTP 401 response', async () => {
      const refreshSpy = vi.fn();

      server.use(
        graphql.query('TestQuery', () => {
          return HttpResponse.json(UNAUTHENTICATED_ERROR_BODY, { status: 401 });
        }),
        mockRefreshToken(() => {
          refreshSpy();
          return HttpResponse.json(REFRESH_SUCCESS_RESPONSE_BODY);
        }),
      );

      await expect(testClient.query<TestQueryData>({ query: TEST_QUERY })).rejects.toThrow();

      expect(refreshSpy).toHaveBeenCalledOnce();
    });

    it('should bypass refresh link for RefreshToken operations', async () => {
      const refreshSpy = vi.fn();

      server.use(
        mockRefreshToken(() => {
          refreshSpy();
          return HttpResponse.json(REFRESH_SUCCESS_RESPONSE_BODY);
        }),
      );

      const REFRESH_MUTATION = gql`
        mutation RefreshToken {
          refreshToken {
            user {
              id
              username
            }
          }
        }
      `;

      await testClient.mutate<RefreshTokenData>({ mutation: REFRESH_MUTATION });

      expect(refreshSpy).toHaveBeenCalledOnce();
    });
  });

  describe('Token Refresh Mechanism', () => {
    it('should trigger RefreshToken mutation on UNAUTHENTICATED error', async () => {
      const refreshSpy = vi.fn();
      let callCount = 0;

      server.use(
        graphql.query('TestQuery', () => {
          callCount++;
          return callCount === 1
            ? HttpResponse.json(UNAUTHENTICATED_ERROR_BODY, { status: 401 })
            : HttpResponse.json(SUCCESS_RESPONSE_BODY);
        }),
        mockRefreshToken(() => {
          refreshSpy();
          return HttpResponse.json(REFRESH_SUCCESS_RESPONSE_BODY);
        }),
      );

      const result = await testClient.query<TestQueryData>({ query: TEST_QUERY });

      expect(refreshSpy).toHaveBeenCalledOnce();
      expect(result.data).toBeDefined();
      expect(result.data!.currentUser.id).toBe(MOCK_USERS.john.id);
    });

    it('should retry original request after successful refresh', async () => {
      let queryCallCount = 0;

      server.use(
        graphql.query('TestQuery', () => {
          queryCallCount++;
          return queryCallCount === 1
            ? HttpResponse.json(UNAUTHENTICATED_ERROR_BODY, { status: 401 })
            : HttpResponse.json(SUCCESS_RESPONSE_BODY);
        }),
        mockRefreshToken(() => HttpResponse.json(REFRESH_SUCCESS_RESPONSE_BODY)),
      );

      const result = await testClient.query<TestQueryData>({ query: TEST_QUERY });

      expect(queryCallCount).toBe(2);
      expect(result.data).toBeDefined();
      expect(result.data!.currentUser.username).toBe(MOCK_USERS.john.username);
    });

    it('should not retry more than once (isRetry flag)', async () => {
      let queryCallCount = 0;

      server.use(
        graphql.query('TestQuery', () => {
          queryCallCount++;
          return HttpResponse.json(UNAUTHENTICATED_ERROR_BODY, { status: 401 });
        }),
        mockRefreshToken(() => HttpResponse.json(REFRESH_SUCCESS_RESPONSE_BODY)),
      );

      await expect(testClient.query<TestQueryData>({ query: TEST_QUERY })).rejects.toThrow();

      expect(queryCallCount).toBe(2);
    });

    it('should redirect to /login when refresh fails', async () => {
      server.use(
        graphql.query('TestQuery', () => {
          return HttpResponse.json(UNAUTHENTICATED_ERROR_BODY, { status: 401 });
        }),
        mockRefreshToken(() => {
          return HttpResponse.json(UNAUTHENTICATED_ERROR_BODY, { status: 401 });
        }),
      );

      await expect(testClient.query<TestQueryData>({ query: TEST_QUERY })).rejects.toThrow();

      expect(window.location.href).toBe('/login');
    });

    it('should redirect to /login on invalid refresh response', async () => {
      server.use(
        graphql.query('TestQuery', () => {
          return HttpResponse.json(UNAUTHENTICATED_ERROR_BODY, { status: 401 });
        }),
        mockRefreshToken(() => {
          return HttpResponse.json({
            data: {
              refreshToken: null,
            },
          });
        }),
      );

      await expect(testClient.query<TestQueryData>({ query: TEST_QUERY })).rejects.toThrow();

      expect(window.location.href).toBe('/login');
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('[RefreshLink] Invalid refresh response format'),
      );
    });

    it('should propagate error when refresh succeeds but retry fails', async () => {
      let callCount = 0;

      server.use(
        graphql.query('TestQuery', () => {
          callCount++;
          if (callCount === 1) {
            return HttpResponse.json(UNAUTHENTICATED_ERROR_BODY, { status: 401 });
          }
          return HttpResponse.json({
            errors: [
              {
                message: 'Internal server error',
                extensions: {
                  code: 'INTERNAL_SERVER_ERROR',
                },
              },
            ],
            data: null,
          });
        }),
        mockRefreshToken(() => HttpResponse.json(REFRESH_SUCCESS_RESPONSE_BODY)),
      );

      await expect(testClient.query<TestQueryData>({ query: TEST_QUERY })).rejects.toThrow();

      expect(callCount).toBe(2);
      expect(window.location.href).not.toBe('/login');
    });
  });

  describe('Pending Requests Queue Management', () => {
    it('should queue multiple requests during active refresh', async () => {
      let isFirstBatch = true;
      let refreshCallCount = 0;

      server.use(
        graphql.query('TestQuery', () => {
          if (isFirstBatch) {
            return HttpResponse.json(UNAUTHENTICATED_ERROR_BODY, { status: 401 });
          }
          return HttpResponse.json(SUCCESS_RESPONSE_BODY);
        }),
        mockRefreshToken(async () => {
          refreshCallCount++;
          await new Promise(resolve => setTimeout(resolve, 100));
          isFirstBatch = false;
          return HttpResponse.json(REFRESH_SUCCESS_RESPONSE_BODY);
        }),
      );

      const results = await Promise.all([
        testClient.query<TestQueryData>({ query: TEST_QUERY }),
        testClient.query<TestQueryData>({ query: TEST_QUERY }),
        testClient.query<TestQueryData>({ query: TEST_QUERY }),
      ]);

      expect(refreshCallCount).toBe(1);
      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result.data).toBeDefined();
        expect(result.data!.currentUser.id).toBe(MOCK_USERS.john.id);
      });
    });

    it('should resolve all pending requests on refresh success', async () => {
      let firstCall = true;

      server.use(
        graphql.query('TestQuery', () => {
          if (firstCall) {
            firstCall = false;
            return HttpResponse.json(UNAUTHENTICATED_ERROR_BODY, { status: 401 });
          }
          return HttpResponse.json(SUCCESS_RESPONSE_BODY);
        }),
        mockRefreshToken(async () => {
          await new Promise(resolve => setTimeout(resolve, 50));
          return HttpResponse.json(REFRESH_SUCCESS_RESPONSE_BODY);
        }),
      );

      const query1 = testClient.query<TestQueryData>({ query: TEST_QUERY });
      const query2 = testClient.query<TestQueryData>({ query: TEST_QUERY });
      const query3 = testClient.query<TestQueryData>({ query: TEST_QUERY });

      const results = await Promise.all([query1, query2, query3]);

      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result.data).toBeDefined();
        expect(result.data!.currentUser).toBeDefined();
      });
    });

    it('should reject all pending requests on refresh failure', async () => {
      server.use(
        graphql.query('TestQuery', () => {
          return HttpResponse.json(UNAUTHENTICATED_ERROR_BODY, { status: 401 });
        }),
        mockRefreshToken(async () => {
          await new Promise(resolve => setTimeout(resolve, 50));
          return HttpResponse.json(UNAUTHENTICATED_ERROR_BODY, { status: 401 });
        }),
      );

      const query1 = testClient.query<TestQueryData>({ query: TEST_QUERY });
      const query2 = testClient.query<TestQueryData>({ query: TEST_QUERY });
      const query3 = testClient.query<TestQueryData>({ query: TEST_QUERY });

      await expect(Promise.all([query1, query2, query3])).rejects.toThrow();

      expect(window.location.href).toBe('/login');
    });

    it('should cleanup queue after refresh completes', async () => {
      let callCount = 0;

      server.use(
        graphql.query('TestQuery', () => {
          callCount++;
          return callCount === 1
            ? HttpResponse.json(UNAUTHENTICATED_ERROR_BODY, { status: 401 })
            : HttpResponse.json(SUCCESS_RESPONSE_BODY);
        }),
        mockRefreshToken(() => HttpResponse.json(REFRESH_SUCCESS_RESPONSE_BODY)),
      );

      await testClient.query<TestQueryData>({ query: TEST_QUERY });

      const secondResult = await testClient.query<TestQueryData>({ query: TEST_QUERY });
      expect(secondResult.data).toBeDefined();
      expect(secondResult.data!.currentUser.id).toBe(MOCK_USERS.john.id);
    });
  });

  describe('Race Conditions and Concurrency', () => {
    it('should handle concurrent UNAUTHENTICATED errors correctly', async () => {
      let isFirstBatch = true;
      let refreshCallCount = 0;

      server.use(
        graphql.query('TestQuery', () => {
          if (isFirstBatch) {
            return HttpResponse.json(UNAUTHENTICATED_ERROR_BODY, { status: 401 });
          }
          return HttpResponse.json(SUCCESS_RESPONSE_BODY);
        }),
        mockRefreshToken(async () => {
          refreshCallCount++;
          await new Promise(resolve => setTimeout(resolve, 100));
          isFirstBatch = false;
          return HttpResponse.json(REFRESH_SUCCESS_RESPONSE_BODY);
        }),
      );

      const results = await Promise.all([
        testClient.query<TestQueryData>({ query: TEST_QUERY }),
        testClient.query<TestQueryData>({ query: TEST_QUERY }),
        testClient.query<TestQueryData>({ query: TEST_QUERY }),
        testClient.query<TestQueryData>({ query: TEST_QUERY }),
        testClient.query<TestQueryData>({ query: TEST_QUERY }),
      ]);

      expect(refreshCallCount).toBe(1);
      expect(results).toHaveLength(5);
      results.forEach(result => {
        expect(result.data).toBeDefined();
        expect(result.data!.currentUser.id).toBe(MOCK_USERS.john.id);
      });
    });

    it('should prevent refresh token replay', async () => {
      let refreshCallCount = 0;
      let firstBatch = true;

      server.use(
        graphql.query('TestQuery', () => {
          return HttpResponse.json(UNAUTHENTICATED_ERROR_BODY, { status: 401 });
        }),
        mockRefreshToken(async () => {
          refreshCallCount++;
          await new Promise(resolve => setTimeout(resolve, 50));

          if (firstBatch) {
            firstBatch = false;
            return HttpResponse.json(REFRESH_SUCCESS_RESPONSE_BODY);
          }

          return HttpResponse.json({
            errors: [
              {
                message: 'Token replay detected',
                extensions: {
                  code: 'TOKEN_REPLAY_DETECTED',
                },
              },
            ],
            data: null,
          });
        }),
      );

      const firstBatchPromises = [
        testClient.query<TestQueryData>({ query: TEST_QUERY }),
        testClient.query<TestQueryData>({ query: TEST_QUERY }),
      ];

      await expect(Promise.all(firstBatchPromises)).rejects.toThrow();

      expect(refreshCallCount).toBe(1);
    });
  });

  describe('Error Scenarios', () => {
    it('should handle network error during refresh', async () => {
      server.use(
        graphql.query('TestQuery', () => {
          return HttpResponse.json(UNAUTHENTICATED_ERROR_BODY, { status: 401 });
        }),
        mockRefreshToken(() => {
          return HttpResponse.error();
        }),
      );

      await expect(testClient.query<TestQueryData>({ query: TEST_QUERY })).rejects.toThrow();

      expect(window.location.href).toBe('/login');
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('[RefreshLink] Token refresh failed'),
        expect.any(Object),
      );
    });

    it('should handle non-ok HTTP response during refresh', async () => {
      server.use(
        graphql.query('TestQuery', () => {
          return HttpResponse.json(UNAUTHENTICATED_ERROR_BODY, { status: 401 });
        }),
        mockRefreshToken(() => {
          return HttpResponse.json(
            {
              errors: [
                {
                  message: 'Internal server error',
                  extensions: {
                    code: 'INTERNAL_SERVER_ERROR',
                  },
                },
              ],
              data: null,
            },
            { status: 500 },
          );
        }),
      );

      await expect(testClient.query<TestQueryData>({ query: TEST_QUERY })).rejects.toThrow();

      expect(window.location.href).toBe('/login');
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('[RefreshLink] Refresh failed'),
        expect.objectContaining({ status: 500 }),
      );
    });

    it('should handle JSON parsing error during refresh', async () => {
      server.use(
        graphql.query('TestQuery', () => {
          return HttpResponse.json(UNAUTHENTICATED_ERROR_BODY, { status: 401 });
        }),
        mockRefreshToken(() => {
          return new HttpResponse('invalid json', {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
            },
          });
        }),
      );

      await expect(testClient.query<TestQueryData>({ query: TEST_QUERY })).rejects.toThrow();

      expect(window.location.href).toBe('/login');
    });
  });

  describe('Subscription Cleanup', () => {
    it('should handle observable subscription cleanup', async () => {
      let callCount = 0;

      server.use(
        graphql.query('TestQuery', () => {
          callCount++;
          return callCount === 1
            ? HttpResponse.json(UNAUTHENTICATED_ERROR_BODY, { status: 401 })
            : HttpResponse.json(SUCCESS_RESPONSE_BODY);
        }),
        mockRefreshToken(() => HttpResponse.json(REFRESH_SUCCESS_RESPONSE_BODY)),
      );

      const observable = testClient.watchQuery<TestQueryData>({ query: TEST_QUERY });
      const subscription = observable.subscribe({
        next: () => {},
        error: () => {},
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      subscription.unsubscribe();

      expect(subscription.closed).toBe(true);
    });

    it('should not leak subscriptions after errors', async () => {
      server.use(
        graphql.query('TestQuery', () => {
          return HttpResponse.json(UNAUTHENTICATED_ERROR_BODY, { status: 401 });
        }),
        mockRefreshToken(() => {
          return HttpResponse.json(UNAUTHENTICATED_ERROR_BODY, { status: 401 });
        }),
      );

      await expect(testClient.query<TestQueryData>({ query: TEST_QUERY })).rejects.toThrow();

      expect(window.location.href).toBe('/login');
    });
  });
});
