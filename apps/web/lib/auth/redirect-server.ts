import { redirect } from '@/i18n/navigation';
import { getLocale } from 'next-intl/server';
import { AUTH_CONFIG } from './auth.config';

/**
 * Server-side redirect helpers for authentication flows
 *
 * Uses @/i18n/navigation for locale-aware redirects.
 * With localePrefix: 'as-needed':
 * - Default locale (en): /login, /dashboard (no prefix)
 * - Other locales (fr): /fr/login, /fr/dashboard
 *
 * Future-proof: When adding French locale, redirects will preserve user's language.
 */

export async function redirectToLoginServer(error?: string): Promise<never> {
  const locale = await getLocale();
  const path = error ? `${AUTH_CONFIG.routes.login}?error=${error}` : AUTH_CONFIG.routes.login;
  redirect({ href: path, locale } as Parameters<typeof redirect>[0]);
  throw new Error('Redirect failed'); // Satisfies TypeScript never return type
}

export async function redirectToDashboard(): Promise<never> {
  const locale = await getLocale();
  redirect({ href: AUTH_CONFIG.routes.dashboard, locale } as Parameters<typeof redirect>[0]);
  throw new Error('Redirect failed'); // Satisfies TypeScript never return type
}
