import { test, expect } from '../fixtures/auth.fixture';
import { resetDatabase } from '../setup/db-helpers';
import { loginViaBackend } from '../helpers/auth';

test.describe('E2E Infrastructure Smoke Tests', () => {
  test.describe('Database setup', () => {
    test('should connect to E2E database', async ({ db }) => {
      const userCount = await db.user.count();
      expect(userCount).toBeGreaterThanOrEqual(0);
    });

    test('should reset database correctly', async ({ db }) => {
      await resetDatabase();

      const usersBefore = await db.user.count();
      expect(usersBefore).toBe(0);

      await db.user.create({
        data: {
          stravaId: 123456,
          username: 'testuser',
          firstname: 'Test',
          lastname: 'User',
        },
      });

      const usersAfter = await db.user.count();
      expect(usersAfter).toBe(1);
    });
  });

  test.describe('Auth helpers', () => {
    test('should create authenticated user via helper', async ({ page, db }) => {
      await resetDatabase();

      const user = await loginViaBackend(page, {
        username: 'smoke_test_user',
        stravaId: 999999999,
      });

      expect(user.user.username).toBe('smoke_test_user');
      expect(user.user.stravaId).toBe(999999999);
      expect(user.accessToken).toBeTruthy();
      expect(user.refreshToken).toBeTruthy();

      const dbUser = await db.user.findUnique({
        where: { stravaId: 999999999 },
      });

      expect(dbUser).toBeDefined();
      expect(dbUser?.username).toBe('smoke_test_user');
    });

    test('should set cookies correctly', async ({ authenticatedPage }) => {
      const cookies = await authenticatedPage.context().cookies();

      const authCookie = cookies.find(c => c.name === 'Authentication');
      const refreshCookie = cookies.find(c => c.name === 'RefreshToken');

      expect(authCookie).toBeDefined();
      expect(authCookie?.value).toBeTruthy();
      expect(authCookie?.httpOnly).toBe(true);

      expect(refreshCookie).toBeDefined();
      expect(refreshCookie?.value).toBeTruthy();
      expect(refreshCookie?.httpOnly).toBe(true);
    });
  });

  test.describe('Authenticated page fixture', () => {
    test('should have authenticated user data', async ({ authenticatedUser }) => {
      expect(authenticatedUser.user.id).toBeDefined();
      expect(authenticatedUser.user.stravaId).toBeDefined();
      expect(authenticatedUser.accessToken).toBeDefined();
      expect(authenticatedUser.refreshToken).toBeDefined();
    });

    test('should have browser context with page', async ({ authenticatedPage }) => {
      expect(authenticatedPage).toBeDefined();
      expect(authenticatedPage.context()).toBeDefined();
    });
  });
});
