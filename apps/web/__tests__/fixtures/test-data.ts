export const TEST_USERS = {
  default: {
    stravaId: 123456789,
    username: 'e2euser_default',
    firstname: 'E2E',
    lastname: 'User',
  },
  onboarded: {
    stravaId: 987654321,
    username: 'e2euser_onboarded',
    firstname: 'Onboarded',
    lastname: 'User',
    onboardingCompleted: true,
  },
  newUser: {
    stravaId: 111222333,
    username: 'e2euser_new',
    firstname: 'New',
    lastname: 'User',
    onboardingCompleted: false,
  },
} as const;

export const GRAPHQL_URL = process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:3011/graphql';
export const FRONTEND_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';
