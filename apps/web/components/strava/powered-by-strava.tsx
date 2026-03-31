'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { useTranslations } from 'next-intl';
import Image from 'next/image';

export function PoweredByStrava() {
  const { resolvedTheme } = useTheme();
  const t = useTranslations('strava.poweredBy');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex justify-center py-6" aria-hidden="true">
        <div className="h-6 w-40" />
      </div>
    );
  }

  const logoSrc =
    resolvedTheme === 'dark'
      ? '/strava/api_logo_pwrdBy_strava_horiz_white.svg'
      : '/strava/api_logo_pwrdBy_strava_horiz_orange.svg';

  return (
    <div className="flex justify-center py-6">
      <a
        href="https://www.strava.com"
        target="_blank"
        rel="noopener noreferrer"
        className="opacity-70 transition-opacity hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
        aria-label={t('alt')}
      >
        <Image src={logoSrc} alt={t('alt')} width={146} height={15} unoptimized />
      </a>
    </div>
  );
}
