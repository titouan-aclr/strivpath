const APP_SLUG = 'strivpath';

export interface LegalLinks {
  legalNotice: string;
  privacy: string;
  terms: string;
}

export function getLegalLinks(locale: string = 'en'): LegalLinks {
  const baseUrl = process.env.NEXT_PUBLIC_LEGAL_BASE_URL;

  if (!baseUrl) {
    throw new Error(
      'NEXT_PUBLIC_LEGAL_BASE_URL environment variable is required. ' +
        'Set it to the base URL of your legal pages (e.g., https://example.com).',
    );
  }

  const normalizedBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  const localePrefix = locale !== 'en' ? `/${locale}` : '';

  return {
    legalNotice: `${normalizedBaseUrl}${localePrefix}/legal-notice`,
    privacy: `${normalizedBaseUrl}${localePrefix}/${APP_SLUG}/privacy`,
    terms: `${normalizedBaseUrl}${localePrefix}/${APP_SLUG}/terms`,
  };
}
