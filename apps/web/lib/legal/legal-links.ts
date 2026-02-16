const APP_SLUG = 'strivpath';

export interface LegalLinks {
  legalNotice: string;
  privacy: string;
  terms: string;
}

export function getLegalLinks(): LegalLinks {
  const baseUrl = process.env.NEXT_PUBLIC_LEGAL_BASE_URL;

  if (!baseUrl) {
    throw new Error(
      'NEXT_PUBLIC_LEGAL_BASE_URL environment variable is required. ' +
        'Set it to the base URL of your legal pages (e.g., https://example.com).',
    );
  }

  const normalizedBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;

  return {
    legalNotice: `${normalizedBaseUrl}/legal-notice`,
    privacy: `${normalizedBaseUrl}/${APP_SLUG}/privacy`,
    terms: `${normalizedBaseUrl}/${APP_SLUG}/terms`,
  };
}
