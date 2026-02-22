import type { MetadataRoute } from 'next';

import { routing } from '@/i18n/routing';

export default function sitemap(): MetadataRoute.Sitemap {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

  return routing.locales.map(locale => {
    const localePrefix = locale === routing.defaultLocale ? '' : `/${locale as string}`;
    return {
      url: `${appUrl}${localePrefix}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 1,
    };
  });
}
