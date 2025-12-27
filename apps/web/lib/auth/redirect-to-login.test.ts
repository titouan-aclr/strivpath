import { describe, it, expect } from 'vitest';
import { getLoginUrl, validateRedirect } from './redirect-to-login';

describe('getLoginUrl', () => {
  it('should return /login without error', () => {
    expect(getLoginUrl()).toBe('/login');
  });

  it('should return /login with error param', () => {
    expect(getLoginUrl('session_expired')).toBe('/login?error=session_expired');
  });

  it('should encode special characters', () => {
    expect(getLoginUrl('network error')).toBe('/login?error=network+error');
  });
});

describe('validateRedirect - Sécurité Open Redirect', () => {
  describe('Redirections valides', () => {
    it('should accept valid internal paths', () => {
      expect(validateRedirect('/dashboard')).toBe('/dashboard');
      expect(validateRedirect('/activities')).toBe('/activities');
      expect(validateRedirect('/onboarding')).toBe('/onboarding');
    });

    it('should accept paths with query params', () => {
      expect(validateRedirect('/activities?filter=run')).toBe('/activities?filter=run');
    });
  });

  describe('Attaques bloquées - URLs externes', () => {
    it('should block absolute URLs with protocol', () => {
      expect(validateRedirect('https://evil.com')).toBe('/dashboard');
      expect(validateRedirect('http://evil.com')).toBe('/dashboard');
    });

    it('should block protocol-relative URLs', () => {
      expect(validateRedirect('//evil.com')).toBe('/dashboard');
    });

    it('should block javascript: protocol', () => {
      expect(validateRedirect('javascript:alert(1)')).toBe('/dashboard');
    });
  });

  describe('Boucles infinies bloquées', () => {
    it('should block redirect to /login', () => {
      expect(validateRedirect('/login')).toBe('/dashboard');
      expect(validateRedirect('/login?error=test')).toBe('/dashboard');
    });
  });

  describe('Routes système bloquées', () => {
    it('should block /api routes', () => {
      expect(validateRedirect('/api/graphql')).toBe('/dashboard');
      expect(validateRedirect('/api/auth/callback')).toBe('/dashboard');
    });
  });

  describe('Cas limites', () => {
    it('should return /dashboard for null/undefined', () => {
      expect(validateRedirect(null)).toBe('/dashboard');
      expect(validateRedirect(undefined)).toBe('/dashboard');
      expect(validateRedirect('')).toBe('/dashboard');
    });
  });
});
