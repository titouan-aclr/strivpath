import { NextRequest, NextResponse } from 'next/server';
import createIntlMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

const ONBOARDING_ROUTES = ['/onboarding', '/sync'];
const DASHBOARD_ROUTES = ['/dashboard', '/activities', '/sports', '/goals', '/badges', '/settings'];

export default function proxy(request: NextRequest) {
  const intlMiddleware = createIntlMiddleware(routing);
  const response = intlMiddleware(request);

  const { pathname } = request.nextUrl;
  const localePattern = new RegExp(`^/(${routing.locales.join('|')})`);
  const pathnameWithoutLocale = pathname.replace(localePattern, '') || '/';
  const authToken = request.cookies.get('Authentication')?.value;
  const refreshToken = request.cookies.get('RefreshToken')?.value;
  const isAuthenticated = !!authToken || !!refreshToken;
  const isProtectedRoute =
    ONBOARDING_ROUTES.some(route => pathnameWithoutLocale.startsWith(route)) ||
    DASHBOARD_ROUTES.some(route => pathnameWithoutLocale.startsWith(route));

  if (isProtectedRoute && !isAuthenticated) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathnameWithoutLocale);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
