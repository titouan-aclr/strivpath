import { NextRequest, NextResponse } from 'next/server';
import createIntlMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

const ONBOARDING_ROUTES = ['/onboarding', '/sync'];
const DASHBOARD_ROUTES = ['/dashboard', '/activities', '/sports', '/goals', '/badges', '/settings'];

export default function proxy(request: NextRequest) {
  const intlMiddleware = createIntlMiddleware(routing);
  const response = intlMiddleware(request);

  const { pathname } = request.nextUrl;
  const pathnameWithoutLocale = pathname.replace(/^\/en/, '') || '/';
  const authToken = request.cookies.get('Authentication')?.value;
  const isAuthenticated = !!authToken;
  const isProtectedRoute =
    ONBOARDING_ROUTES.some(route => pathnameWithoutLocale.startsWith(route)) ||
    DASHBOARD_ROUTES.some(route => pathnameWithoutLocale.startsWith(route));

  if (isProtectedRoute && !isAuthenticated) {
    const locale = pathname.split('/')[1];
    const loginUrl = new URL(`/${locale}/login`, request.url);
    loginUrl.searchParams.set('redirect', pathnameWithoutLocale);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
