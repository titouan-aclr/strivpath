import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import proxy from './proxy';

const { mockIntlMiddleware } = vi.hoisted(() => ({
  mockIntlMiddleware: vi.fn(() => NextResponse.next()),
}));

vi.mock('next-intl/middleware', () => ({
  default: vi.fn(() => mockIntlMiddleware),
}));

vi.mock('./i18n/routing', () => ({
  routing: {
    locales: ['en'],
    defaultLocale: 'en',
  },
}));

const createMockRequest = (pathname: string, cookies: Record<string, string> = {}): NextRequest => {
  const url = `http://localhost:3000${pathname}`;
  const request = new NextRequest(url);

  Object.entries(cookies).forEach(([name, value]) => {
    Object.defineProperty(request.cookies, 'get', {
      value: vi.fn((cookieName: string) => {
        if (cookieName === name) {
          return { name, value };
        }
        return undefined;
      }),
      configurable: true,
    });
  });

  return request;
};

describe('proxy (Next.js Middleware)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Protected Routes - Unauthenticated Users', () => {
    it('should redirect to login when accessing /dashboard without authentication', () => {
      const request = createMockRequest('/dashboard');
      const response = proxy(request);

      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toBe('http://localhost:3000/login?redirect=%2Fdashboard');
    });

    it('should redirect to login when accessing /activities without authentication', () => {
      const request = createMockRequest('/activities');
      const response = proxy(request);

      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toBe('http://localhost:3000/login?redirect=%2Factivities');
    });

    it('should redirect to login when accessing /onboarding without authentication', () => {
      const request = createMockRequest('/onboarding');
      const response = proxy(request);

      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toBe('http://localhost:3000/login?redirect=%2Fonboarding');
    });

    it('should redirect to login when accessing /sync without authentication', () => {
      const request = createMockRequest('/sync');
      const response = proxy(request);

      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toBe('http://localhost:3000/login?redirect=%2Fsync');
    });

    it('should set redirect parameter correctly for nested routes', () => {
      const request = createMockRequest('/activities/123');
      const response = proxy(request);

      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toBe('http://localhost:3000/login?redirect=%2Factivities%2F123');
    });
  });

  describe('Protected Routes - Authenticated Users', () => {
    it('should allow access to protected routes with Authentication cookie', () => {
      const request = createMockRequest('/dashboard', { Authentication: 'valid-token' });
      const response = proxy(request);

      expect(mockIntlMiddleware).toHaveBeenCalledWith(request);
      expect(response.status).not.toBe(307);
    });

    it('should allow access to protected routes with RefreshToken cookie', () => {
      const request = createMockRequest('/dashboard', { RefreshToken: 'valid-refresh-token' });
      const response = proxy(request);

      expect(mockIntlMiddleware).toHaveBeenCalledWith(request);
      expect(response.status).not.toBe(307);
    });

    it('should allow access to protected routes with both cookies', () => {
      const request = createMockRequest('/activities', {
        Authentication: 'valid-token',
        RefreshToken: 'valid-refresh-token',
      });
      const response = proxy(request);

      expect(mockIntlMiddleware).toHaveBeenCalledWith(request);
      expect(response.status).not.toBe(307);
    });
  });

  describe('Public Routes', () => {
    it('should allow access to /login without authentication', () => {
      const request = createMockRequest('/login');
      const response = proxy(request);

      expect(mockIntlMiddleware).toHaveBeenCalledWith(request);
      expect(response.status).not.toBe(307);
    });

    it('should allow access to root path without authentication', () => {
      const request = createMockRequest('/');
      const response = proxy(request);

      expect(mockIntlMiddleware).toHaveBeenCalledWith(request);
      expect(response.status).not.toBe(307);
    });
  });

  describe('Locale Handling', () => {
    it('should handle URLs with /en prefix correctly', () => {
      const request = createMockRequest('/en/dashboard');
      const response = proxy(request);

      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toBe('http://localhost:3000/login?redirect=%2Fdashboard');
    });

    it('should preserve non-locale path segments when redirecting', () => {
      const request = createMockRequest('/en/activities/run/123');
      const response = proxy(request);

      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toBe('http://localhost:3000/login?redirect=%2Factivities%2Frun%2F123');
    });
  });

  describe('All Protected Routes', () => {
    const protectedRoutes = ['/dashboard', '/activities', '/sports', '/goals', '/badges', '/settings'];

    protectedRoutes.forEach(route => {
      it(`should protect ${route} route`, () => {
        const request = createMockRequest(route);
        const response = proxy(request);

        expect(response.status).toBe(307);
        expect(response.headers.get('location')).toContain('/login');
      });
    });
  });

  describe('Edge Cases', () => {
    it('should call intl middleware for all requests', () => {
      const request = createMockRequest('/dashboard');
      proxy(request);

      expect(mockIntlMiddleware).toHaveBeenCalledWith(request);
    });

    it('should handle routes that start with protected route prefix', () => {
      const request = createMockRequest('/dashboard/custom-view');
      const response = proxy(request);

      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toBe('http://localhost:3000/login?redirect=%2Fdashboard%2Fcustom-view');
    });
  });
});
