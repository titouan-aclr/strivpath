export const AUTH_CONFIG = {
  graphqlUrl: process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:3011/graphql',

  retry: {
    maxAttempts: 3,
    initialDelay: 1000,
  },

  redirectReasons: {
    sessionExpired: 'session_expired',
    networkError: 'network_error',
  },

  routes: {
    login: '/login',
    dashboard: '/dashboard',
  },
} as const;

export type RedirectReason = (typeof AUTH_CONFIG.redirectReasons)[keyof typeof AUTH_CONFIG.redirectReasons];
