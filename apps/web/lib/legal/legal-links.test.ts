import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { getLegalLinks } from './legal-links';

describe('getLegalLinks', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('builds correct URLs from base URL', () => {
    process.env.NEXT_PUBLIC_LEGAL_BASE_URL = 'https://example.com';

    const links = getLegalLinks();

    expect(links).toEqual({
      legalNotice: 'https://example.com/legal-notice',
      privacy: 'https://example.com/strivpath/privacy',
      terms: 'https://example.com/strivpath/terms',
    });
  });

  it('strips trailing slash from base URL', () => {
    process.env.NEXT_PUBLIC_LEGAL_BASE_URL = 'https://example.com/';

    const links = getLegalLinks();

    expect(links.legalNotice).toBe('https://example.com/legal-notice');
  });

  it('throws when NEXT_PUBLIC_LEGAL_BASE_URL is not set', () => {
    delete process.env.NEXT_PUBLIC_LEGAL_BASE_URL;

    expect(() => getLegalLinks()).toThrow('NEXT_PUBLIC_LEGAL_BASE_URL environment variable is required');
  });

  it('throws when NEXT_PUBLIC_LEGAL_BASE_URL is empty', () => {
    process.env.NEXT_PUBLIC_LEGAL_BASE_URL = '';

    expect(() => getLegalLinks()).toThrow('NEXT_PUBLIC_LEGAL_BASE_URL environment variable is required');
  });
});
