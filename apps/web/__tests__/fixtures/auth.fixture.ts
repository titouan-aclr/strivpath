import { test as base, Page } from '@playwright/test';
import { PrismaClient } from '../setup/prisma-client';
import { getE2EPrismaClient, resetDatabase, type AuthenticatedTestUser } from '../setup/db-helpers';
import { loginViaBackend } from '../helpers/auth';

type AuthFixtures = {
  authenticatedPage: Page;
  authenticatedUser: AuthenticatedTestUser;
  db: PrismaClient;
};

export const test = base.extend<AuthFixtures>({
  db: async ({}, use: (r: PrismaClient) => Promise<void>) => {
    const client = getE2EPrismaClient();
    await use(client);
  },

  authenticatedUser: async ({ page }, use) => {
    await resetDatabase();

    const user = await loginViaBackend(page);
    await use(user);
  },

  authenticatedPage: async ({ page, authenticatedUser: _authenticatedUser }, use) => {
    await use(page);
  },
});

export { expect } from '@playwright/test';
