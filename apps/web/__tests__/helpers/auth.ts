import { Page, expect } from '@playwright/test';
import { seedAuthenticatedUser, type AuthenticatedTestUser } from '../setup/db-helpers';
import { setAuthCookies, clearAuthCookies } from './cookies';

export interface LoginOptions {
  stravaId?: number;
  username?: string;
  onboardingCompleted?: boolean;
}

export async function loginViaBackend(page: Page, options?: LoginOptions): Promise<AuthenticatedTestUser> {
  const authenticatedUser = await seedAuthenticatedUser(options);

  await setAuthCookies(page, {
    accessToken: authenticatedUser.accessToken,
    refreshToken: authenticatedUser.refreshToken,
  });

  return authenticatedUser;
}

export interface OAuthLoginOptions {
  mockCode?: string;
  expectedRedirect?: string | RegExp;
}

export async function loginViaOAuth(page: Page, options?: OAuthLoginOptions): Promise<void> {
  const code = options?.mockCode || 'mock-oauth-code-123456';
  const state = 'test-state';
  const apiPort = process.env.API_PORT || 3011;
  const callbackUrl = `http://localhost:${apiPort}/api/v1/auth/strava/callback?code=${code}&state=${state}`;

  await page.goto(callbackUrl);

  const expectedUrl = options?.expectedRedirect || /\/en\/onboarding/;
  await page.waitForURL(expectedUrl, { timeout: 10000 });

  const cookies = await page.context().cookies();
  const authCookie = cookies.find(c => c.name === 'Authentication');
  const refreshCookie = cookies.find(c => c.name === 'RefreshToken');

  expect(authCookie).toBeDefined();
  expect(refreshCookie).toBeDefined();
}

export async function logout(page: Page): Promise<void> {
  const graphqlUrl = process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:3011/graphql';

  const response = await page.request.post(graphqlUrl, {
    data: {
      query: `
        mutation {
          logout
        }
      `,
    },
  });

  expect(response.ok()).toBeTruthy();

  await clearAuthCookies(page);
}

export async function waitForAuth(page: Page, options?: { timeout?: number }): Promise<void> {
  const timeout = options?.timeout ?? 10000;

  await page.waitForFunction(
    () => {
      const apolloCache = (window as any).__APOLLO_STATE__;
      if (!apolloCache) return false;

      const currentUserKey = Object.keys(apolloCache).find(key => key.includes('currentUser'));
      return currentUserKey && apolloCache[currentUserKey];
    },
    { timeout },
  );
}

export async function expectUnauthenticated(page: Page): Promise<void> {
  await expect(page).toHaveURL(/\/login/);
}

export async function expectAuthenticated(page: Page, expectedUrl?: string | RegExp): Promise<void> {
  if (expectedUrl) {
    await expect(page).toHaveURL(expectedUrl);
  } else {
    await expect(page).not.toHaveURL(/\/login/);
  }
}

export async function waitForGraphQL(page: Page, operationName: string, options?: { timeout?: number }): Promise<void> {
  const timeout = options?.timeout ?? 10000;
  const graphqlUrl = process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:3011/graphql';

  await page.waitForResponse(
    response =>
      response.url().includes(graphqlUrl) && response.request().postDataJSON()?.operationName === operationName,
    { timeout },
  );
}
