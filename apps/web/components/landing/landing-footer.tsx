'use client';

import { useTranslations } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';

import { getLegalLinks, type LegalLinks } from '@/lib/legal/legal-links';

export function LandingFooter() {
  const t = useTranslations('landing.footer');

  let legalLinks: LegalLinks | null = null;
  try {
    legalLinks = getLegalLinks();
  } catch {
    // env var not configured, legal links are hidden gracefully
  }

  return (
    <footer className="border-t border-border bg-muted dark:bg-background">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
          <div className="flex flex-col items-center text-center md:items-start md:text-left md:max-w-xs">
            <Link href="/" className="mb-3 flex items-center gap-2 text-lg font-bold">
              <Image src="/logo.svg" alt="StrivPath logo" width={20} height={20} className="h-5 w-5" />
              StrivPath
            </Link>
            <p className="text-sm leading-relaxed text-muted-foreground">{t('tagline')}</p>
          </div>

          <div className="flex flex-col items-center gap-3 text-center text-sm text-muted-foreground md:items-end md:text-right">
            <div className="flex flex-wrap justify-center gap-4 md:justify-end">
              <a
                href="https://github.com/titouan-aclr/strivpath"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:text-foreground"
              >
                {t('github')}
              </a>
              {legalLinks && (
                <>
                  <a
                    href={legalLinks.legalNotice}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transition-colors hover:text-foreground"
                  >
                    {t('legalNotice')}
                  </a>
                  <a
                    href={legalLinks.privacy}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transition-colors hover:text-foreground"
                  >
                    {t('privacy')}
                  </a>
                  <a
                    href={legalLinks.terms}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transition-colors hover:text-foreground"
                  >
                    {t('terms')}
                  </a>
                </>
              )}
            </div>
            <p>{t('nonCommercial')}</p>
            <p>{t('disclaimer')}</p>
            <p>{t('copyright')}</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
