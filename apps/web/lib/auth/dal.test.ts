import { describe, it, expect, vi, beforeEach } from 'vitest';
import { verifyAuth, requireAuth, redirectIfAuthenticated } from './dal';

const { mockCookies, mockRedirect } = vi.hoisted(() => ({
  mockCookies: vi.fn(),
  mockRedirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT: ${url}`);
  }),
}));

vi.mock('next/headers', () => ({
  cookies: mockCookies,
}));

vi.mock('next/navigation', () => ({
  redirect: mockRedirect,
}));

const createMockCookieStore = (hasAuthCookie: boolean) => ({
  get: vi.fn((name: string) => {
    if (name === 'Authentication' && hasAuthCookie) {
      return { name: 'Authentication', value: 'mock-jwt-token' };
    }
    return undefined;
  }),
});

describe('Server-side Auth DAL', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('verifyAuth', () => {
    it('should return true when Authentication cookie exists', async () => {
      const mockCookieStore = createMockCookieStore(true);
      mockCookies.mockResolvedValue(mockCookieStore);

      const result = await verifyAuth();

      expect(result).toBe(true);
      expect(mockCookies).toHaveBeenCalledTimes(1);
      expect(mockCookieStore.get).toHaveBeenCalledWith('Authentication');
    });

    it('should return false when Authentication cookie is missing', async () => {
      const mockCookieStore = createMockCookieStore(false);
      mockCookies.mockResolvedValue(mockCookieStore);

      const result = await verifyAuth();

      expect(result).toBe(false);
      expect(mockCookies).toHaveBeenCalledTimes(1);
      expect(mockCookieStore.get).toHaveBeenCalledWith('Authentication');
    });

    it('should handle empty cookie store gracefully', async () => {
      const emptyCookieStore = {
        get: vi.fn().mockReturnValue(undefined),
      };
      mockCookies.mockResolvedValue(emptyCookieStore);

      const result = await verifyAuth();

      expect(result).toBe(false);
      expect(emptyCookieStore.get).toHaveBeenCalledWith('Authentication');
    });
  });

  describe('requireAuth', () => {
    it('should not redirect when user is authenticated', async () => {
      const mockCookieStore = createMockCookieStore(true);
      mockCookies.mockResolvedValue(mockCookieStore);

      await requireAuth();

      expect(mockRedirect).not.toHaveBeenCalled();
    });

    it('should redirect to /login when not authenticated', async () => {
      const mockCookieStore = createMockCookieStore(false);
      mockCookies.mockResolvedValue(mockCookieStore);

      await expect(requireAuth()).rejects.toThrow('NEXT_REDIRECT: /login');

      expect(mockRedirect).toHaveBeenCalledWith('/login');
      expect(mockRedirect).toHaveBeenCalledTimes(1);
    });

    it('should redirect with error param when errorReason provided', async () => {
      const mockCookieStore = createMockCookieStore(false);
      mockCookies.mockResolvedValue(mockCookieStore);
      const errorReason = 'session_expired';

      await expect(requireAuth(errorReason)).rejects.toThrow('NEXT_REDIRECT: /login?error=session_expired');

      expect(mockRedirect).toHaveBeenCalledWith('/login?error=session_expired');
      expect(mockRedirect).toHaveBeenCalledTimes(1);
    });

    it('should call redirect function when unauthorized', async () => {
      const mockCookieStore = createMockCookieStore(false);
      mockCookies.mockResolvedValue(mockCookieStore);

      try {
        await requireAuth();
      } catch {
        expect(mockRedirect).toHaveBeenCalled();
      }
    });

    it('should throw redirect error from Next.js', async () => {
      const mockCookieStore = createMockCookieStore(false);
      mockCookies.mockResolvedValue(mockCookieStore);

      await expect(requireAuth()).rejects.toThrow();
    });

    it('should handle errorReason with special characters', async () => {
      const mockCookieStore = createMockCookieStore(false);
      mockCookies.mockResolvedValue(mockCookieStore);
      const errorReason = 'invalid token!@#$%';

      await expect(requireAuth(errorReason)).rejects.toThrow();

      expect(mockRedirect).toHaveBeenCalledWith(`/login?error=${errorReason}`);
    });

    it('should not append error param when errorReason is empty string', async () => {
      const mockCookieStore = createMockCookieStore(false);
      mockCookies.mockResolvedValue(mockCookieStore);

      await expect(requireAuth('')).rejects.toThrow('NEXT_REDIRECT: /login');

      expect(mockRedirect).toHaveBeenCalledWith('/login');
    });
  });

  describe('redirectIfAuthenticated', () => {
    it('should redirect to /dashboard when authenticated', async () => {
      const mockCookieStore = createMockCookieStore(true);
      mockCookies.mockResolvedValue(mockCookieStore);

      await expect(redirectIfAuthenticated()).rejects.toThrow('NEXT_REDIRECT: /dashboard');

      expect(mockRedirect).toHaveBeenCalledWith('/dashboard');
      expect(mockRedirect).toHaveBeenCalledTimes(1);
    });

    it('should not redirect when not authenticated', async () => {
      const mockCookieStore = createMockCookieStore(false);
      mockCookies.mockResolvedValue(mockCookieStore);

      await redirectIfAuthenticated();

      expect(mockRedirect).not.toHaveBeenCalled();
    });

    it('should call redirect function correctly when authenticated', async () => {
      const mockCookieStore = createMockCookieStore(true);
      mockCookies.mockResolvedValue(mockCookieStore);

      try {
        await redirectIfAuthenticated();
      } catch {
        expect(mockRedirect).toHaveBeenCalledWith('/dashboard');
      }
    });

    it('should throw redirect error from Next.js when authenticated', async () => {
      const mockCookieStore = createMockCookieStore(true);
      mockCookies.mockResolvedValue(mockCookieStore);

      await expect(redirectIfAuthenticated()).rejects.toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('should handle async cookie resolution in verifyAuth', async () => {
      const mockCookieStore = createMockCookieStore(true);
      mockCookies.mockImplementation(
        () =>
          new Promise(resolve => {
            setTimeout(() => resolve(mockCookieStore), 10);
          }),
      );

      const result = await verifyAuth();

      expect(result).toBe(true);
    });

    it('should handle async cookie resolution in requireAuth', async () => {
      const mockCookieStore = createMockCookieStore(true);
      mockCookies.mockImplementation(
        () =>
          new Promise(resolve => {
            setTimeout(() => resolve(mockCookieStore), 10);
          }),
      );

      await requireAuth();

      expect(mockRedirect).not.toHaveBeenCalled();
    });

    it('should handle async cookie resolution in redirectIfAuthenticated', async () => {
      const mockCookieStore = createMockCookieStore(false);
      mockCookies.mockImplementation(
        () =>
          new Promise(resolve => {
            setTimeout(() => resolve(mockCookieStore), 10);
          }),
      );

      await redirectIfAuthenticated();

      expect(mockRedirect).not.toHaveBeenCalled();
    });
  });
});
