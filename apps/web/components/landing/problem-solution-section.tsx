'use client';

import { useTranslations } from 'next-intl';

import { BlurFade } from '@/components/ui/blur-fade';

export function ProblemSolutionSection() {
  const t = useTranslations('landing.problem');

  return (
    <section id="problem" className="py-24 md:py-32 bg-muted dark:bg-muted/20">
      <div className="mx-auto max-w-6xl px-6">
        <BlurFade delay={0} inView>
          <h2 className="text-center text-3xl font-bold md:text-4xl">
            <span className="text-muted-foreground">{t('heading.line1Intro')} </span>
            <span className="text-foreground">{t('heading.line1Emphasis')}</span>
            <br />
            <span className="text-muted-foreground">{t('heading.line2Intro')} </span>
            <span className="text-foreground">{t('heading.line2Emphasis')}</span>
          </h2>
        </BlurFade>

        <div className="mt-16 grid gap-6 md:grid-cols-2">
          <BlurFade delay={0.1} inView>
            <div className="rounded-2xl border border-border/50 bg-muted/30 p-8 h-full">
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                {t('without.title')}
              </p>
              <p className="text-lg font-medium text-foreground">{t('without.headline')}</p>
              <ul className="mt-5 space-y-2 text-sm text-muted-foreground">
                <li>· {t('without.point1')}</li>
                <li>· {t('without.point2')}</li>
                <li>· {t('without.point3')}</li>
              </ul>
            </div>
          </BlurFade>

          <BlurFade delay={0.2} inView>
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-8 h-full">
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-primary">{t('with.title')}</p>
              <p className="text-lg font-medium text-foreground">{t('with.headline')}</p>
              <ul className="mt-5 space-y-2 text-sm text-muted-foreground">
                <li>· {t('with.point1')}</li>
                <li>· {t('with.point2')}</li>
                <li>· {t('with.point3')}</li>
              </ul>
            </div>
          </BlurFade>
        </div>
      </div>
    </section>
  );
}
