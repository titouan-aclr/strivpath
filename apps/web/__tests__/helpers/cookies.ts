import { Page } from '@playwright/test';

export interface AuthCookies {
  accessToken: string;
  refreshToken: string;
}

export async function setAuthCookies(page: Page, cookies: AuthCookies): Promise<void> {
  const baseUrl = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';
  const url = new URL(baseUrl);

  await page.context().addCookies([
    {
      name: 'Authentication',
      value: cookies.accessToken,
      domain: url.hostname,
      path: '/',
      httpOnly: true,
      secure: false,
      sameSite: 'Lax',
    },
    {
      name: 'RefreshToken',
      value: cookies.refreshToken,
      domain: url.hostname,
      path: '/',
      httpOnly: true,
      secure: false,
      sameSite: 'Lax',
    },
  ]);
}

export async function getAuthCookies(page: Page): Promise<AuthCookies | null> {
  const cookies = await page.context().cookies();

  const authCookie = cookies.find(c => c.name === 'Authentication');
  const refreshCookie = cookies.find(c => c.name === 'RefreshToken');

  if (!authCookie || !refreshCookie) {
    return null;
  }

  return {
    accessToken: authCookie.value,
    refreshToken: refreshCookie.value,
  };
}

export async function clearAuthCookies(page: Page): Promise<void> {
  const baseUrl = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';
  const url = new URL(baseUrl);

  await page.context().clearCookies({
    domain: url.hostname,
  });
}
