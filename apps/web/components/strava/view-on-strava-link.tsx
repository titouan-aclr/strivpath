'use client';

import { useTranslations } from 'next-intl';
import { ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ViewOnStravaLinkProps {
  stravaId: string | bigint;
  variant?: 'inline' | 'button';
  className?: string;
}

export function ViewOnStravaLink({ stravaId, variant = 'inline', className }: ViewOnStravaLinkProps) {
  const t = useTranslations('strava.viewOnStrava');

  const url = `https://www.strava.com/activities/${String(stravaId)}`;

  if (variant === 'button') {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={t('ariaLabel')}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors',
          'text-[#FC5200] border-[#FC5200]/30 hover:bg-[#FC5200]/10',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          className,
        )}
      >
        {t('label')}
        <ExternalLink className="h-3 w-3" aria-hidden="true" />
      </a>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t('ariaLabel')}
      onClick={e => e.stopPropagation()}
      onKeyDown={e => e.stopPropagation()}
      className={cn(
        'inline-flex items-center gap-1 text-xs text-muted-foreground underline underline-offset-2 transition-colors',
        'hover:text-foreground',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm',
        className,
      )}
    >
      {t('label')}
      <ExternalLink className="h-3 w-3" aria-hidden="true" />
    </a>
  );
}
