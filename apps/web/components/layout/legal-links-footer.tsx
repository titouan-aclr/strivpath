'use client';

import { useTranslations } from 'next-intl';
import { getLegalLinks, type LegalLinks } from '@/lib/legal/legal-links';

export function LegalLinksFooter() {
  const t = useTranslations('legal');

  let links: LegalLinks | null = null;
  try {
    links = getLegalLinks();
  } catch {
    // env var not configured, legal links are hidden gracefully
  }

  if (!links) return null;

  return (
    <footer className="flex items-center justify-center gap-3 py-6 text-xs text-muted-foreground">
      <a
        href={links.legalNotice}
        target="_blank"
        rel="noopener noreferrer"
        className="transition-colors hover:text-foreground"
      >
        {t('legalNotice')}
      </a>
      <span aria-hidden="true">·</span>
      <a
        href={links.privacy}
        target="_blank"
        rel="noopener noreferrer"
        className="transition-colors hover:text-foreground"
      >
        {t('privacy')}
      </a>
      <span aria-hidden="true">·</span>
      <a
        href={links.terms}
        target="_blank"
        rel="noopener noreferrer"
        className="transition-colors hover:text-foreground"
      >
        {t('terms')}
      </a>
    </footer>
  );
}
