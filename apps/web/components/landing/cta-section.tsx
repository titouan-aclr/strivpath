'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

import { BlurFade } from '@/components/ui/blur-fade';
import { Button } from '@/components/ui/button';

interface CtaSectionProps {
  isAuthenticated: boolean;
}

export function CtaSection({ isAuthenticated }: CtaSectionProps) {
  const t = useTranslations('landing.cta');

  const ctaHref = isAuthenticated ? '/dashboard' : '/login';
  const ctaLabel = isAuthenticated ? t('ctaAuthenticated') : t('cta');

  return (
    <section
      id="cta"
      aria-labelledby="cta-heading"
      className="scroll-mt-28 bg-background bg-pattern-topo-subtle py-24 md:py-32"
    >
      <div className="relative mx-auto max-w-3xl px-6 text-center">
        <BlurFade delay={0} inView>
          <h2 id="cta-heading" className="mb-6 text-3xl font-bold md:text-4xl">
            {t('heading')}
          </h2>
          <Button asChild size="lg" className="mb-6">
            <Link href={ctaHref}>{ctaLabel}</Link>
          </Button>
          <p className="text-sm text-muted-foreground">{t('reassurance')}</p>
        </BlurFade>
      </div>
    </section>
  );
}
