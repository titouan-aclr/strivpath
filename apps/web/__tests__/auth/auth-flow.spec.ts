import { test, expect } from '../fixtures/auth.fixture';
import { resetDatabase } from '../setup/db-helpers';
import { loginViaBackend, logout } from '../helpers/auth';
import { clearAuthCookies } from '../helpers/cookies';

test.describe('E2E Authentication Flow', () => {
  test.describe('Authentication Setup', () => {
    test('should setup authenticated user and access protected pages', async ({ page }) => {
      await resetDatabase();

      const authUser = await loginViaBackend(page, {
        username: 'test_auth_user',
        stravaId: 111222333,
      });

      expect(authUser.accessToken).toBeTruthy();
      expect(authUser.refreshToken).toBeTruthy();

      const cookies = await page.context().cookies();
      const authCookie = cookies.find(c => c.name === 'Authentication');
      const refreshCookie = cookies.find(c => c.name === 'RefreshToken');

      expect(authCookie).toBeDefined();
      expect(authCookie?.value).toBe(authUser.accessToken);
      expect(authCookie?.httpOnly).toBe(true);
      expect(authCookie?.path).toBe('/');
      expect(authCookie?.sameSite).toBe('Lax');

      expect(refreshCookie).toBeDefined();
      expect(refreshCookie?.value).toBe(authUser.refreshToken);
      expect(refreshCookie?.httpOnly).toBe(true);
      expect(refreshCookie?.path).toBe('/');
      expect(refreshCookie?.sameSite).toBe('Lax');
    });

    test('should persist user data in database after authentication', async ({ page, db }) => {
      await resetDatabase();

      await loginViaBackend(page, {
        username: 'db_persist_user',
        stravaId: 444555666,
      });

      const dbUser = await db.user.findUnique({
        where: { stravaId: 444555666 },
        include: { preferences: true },
      });

      expect(dbUser).toBeDefined();
      expect(dbUser?.username).toBe('db_persist_user');
      expect(dbUser?.preferences).toBeDefined();
      expect(dbUser?.preferences?.onboardingCompleted).toBe(false);
    });
  });

  test.describe('Navigation Protected Pages', () => {
    test('should navigate to dashboard when authenticated', async ({ authenticatedPage }) => {
      await authenticatedPage.goto('/en/dashboard');
      await authenticatedPage.waitForLoadState('domcontentloaded');

      await expect(authenticatedPage).toHaveURL(/\/en\/dashboard/);

      const cookies = await authenticatedPage.context().cookies();
      const authCookie = cookies.find(c => c.name === 'Authentication');
      expect(authCookie).toBeDefined();
      expect(authCookie?.httpOnly).toBe(true);
    });

    test('should navigate to settings when authenticated', async ({ authenticatedPage }) => {
      await authenticatedPage.goto('/en/settings');
      await authenticatedPage.waitForLoadState('domcontentloaded');

      await expect(authenticatedPage).toHaveURL(/\/en\/settings/);

      const cookies = await authenticatedPage.context().cookies();
      const authCookie = cookies.find(c => c.name === 'Authentication');
      expect(authCookie).toBeDefined();
      expect(authCookie?.httpOnly).toBe(true);
    });

    test('should maintain authentication across page navigations', async ({ authenticatedPage }) => {
      const initialCookies = await authenticatedPage.context().cookies();
      const initialAuthToken = initialCookies.find(c => c.name === 'Authentication')?.value;
      const initialRefreshToken = initialCookies.find(c => c.name === 'RefreshToken')?.value;

      await authenticatedPage.goto('/en/dashboard');
      await authenticatedPage.waitForLoadState('domcontentloaded');

      let cookies = await authenticatedPage.context().cookies();
      expect(cookies.find(c => c.name === 'Authentication')?.value).toBe(initialAuthToken);

      await authenticatedPage.goto('/en/settings');
      await authenticatedPage.waitForLoadState('domcontentloaded');

      cookies = await authenticatedPage.context().cookies();
      expect(cookies.find(c => c.name === 'Authentication')?.value).toBe(initialAuthToken);
      expect(cookies.find(c => c.name === 'RefreshToken')?.value).toBe(initialRefreshToken);
    });
  });

  test.describe('Logout Flow', () => {
    test('should clear cookies after logout', async ({ authenticatedPage }) => {
      await authenticatedPage.goto('/en/dashboard');
      await authenticatedPage.waitForLoadState('networkidle');

      const cookiesBefore = await authenticatedPage.context().cookies();
      expect(cookiesBefore.find(c => c.name === 'Authentication')).toBeDefined();
      expect(cookiesBefore.find(c => c.name === 'RefreshToken')).toBeDefined();

      await logout(authenticatedPage);

      const cookiesAfter = await authenticatedPage.context().cookies();
      expect(cookiesAfter.find(c => c.name === 'Authentication')).toBeUndefined();
      expect(cookiesAfter.find(c => c.name === 'RefreshToken')).toBeUndefined();
    });

    test('should clear cookies manually and verify removal', async ({ page }) => {
      await resetDatabase();

      await loginViaBackend(page, {
        username: 'logout_test_user',
        stravaId: 777888999,
      });

      let cookies = await page.context().cookies();
      expect(cookies.find(c => c.name === 'Authentication')).toBeDefined();

      await clearAuthCookies(page);

      cookies = await page.context().cookies();
      expect(cookies.find(c => c.name === 'Authentication')).toBeUndefined();
      expect(cookies.find(c => c.name === 'RefreshToken')).toBeUndefined();
    });
  });

  test.describe('Cookie Verification & Persistence', () => {
    test('should have correct security attributes on authentication cookies', async ({
      authenticatedUser,
      authenticatedPage,
    }) => {
      const cookies = await authenticatedPage.context().cookies();

      const authCookie = cookies.find(c => c.name === 'Authentication');
      expect(authCookie).toBeDefined();
      expect(authCookie?.value).toBe(authenticatedUser.accessToken);
      expect(authCookie?.httpOnly).toBe(true);
      expect(authCookie?.path).toBe('/');
      expect(authCookie?.sameSite).toBe('Lax');

      const refreshCookie = cookies.find(c => c.name === 'RefreshToken');
      expect(refreshCookie).toBeDefined();
      expect(refreshCookie?.value).toBe(authenticatedUser.refreshToken);
      expect(refreshCookie?.value).not.toBe(authCookie?.value);
      expect(refreshCookie?.httpOnly).toBe(true);
      expect(refreshCookie?.path).toBe('/');
      expect(refreshCookie?.sameSite).toBe('Lax');
    });

    test('should persist cookies during multiple page loads', async ({ authenticatedPage }) => {
      const initialCookies = await authenticatedPage.context().cookies();
      const initialAuth = initialCookies.find(c => c.name === 'Authentication')?.value;
      const initialRefresh = initialCookies.find(c => c.name === 'RefreshToken')?.value;

      await authenticatedPage.goto('/en/dashboard');
      await authenticatedPage.waitForLoadState('networkidle');

      let cookies = await authenticatedPage.context().cookies();
      expect(cookies.find(c => c.name === 'Authentication')?.value).toBe(initialAuth);
      expect(cookies.find(c => c.name === 'RefreshToken')?.value).toBe(initialRefresh);

      await authenticatedPage.goto('/en/settings');
      await authenticatedPage.waitForLoadState('networkidle');

      cookies = await authenticatedPage.context().cookies();
      expect(cookies.find(c => c.name === 'Authentication')?.value).toBe(initialAuth);
      expect(cookies.find(c => c.name === 'RefreshToken')?.value).toBe(initialRefresh);
    });
  });
});
