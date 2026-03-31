'use client';

import { Check } from 'lucide-react';
import { motion } from 'motion/react';
import { useTranslations } from 'next-intl';
import { Area, AreaChart } from 'recharts';

import { BlurFade } from '@/components/ui/blur-fade';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';

const WEEKLY_DATA = [
  { week: 'W1', distance: 18 },
  { week: 'W2', distance: 22 },
  { week: 'W3', distance: 19 },
  { week: 'W4', distance: 28 },
  { week: 'W5', distance: 25 },
  { week: 'W6', distance: 32 },
  { week: 'W7', distance: 30 },
  { week: 'W8', distance: 37 },
];

const chartConfig = {
  distance: {
    color: 'var(--primary)',
  },
} satisfies ChartConfig;

export function GoalPreviewSection() {
  const t = useTranslations('landing.goalPreview');

  const bullets = [t('bullet1'), t('bullet2'), t('bullet3')];

  return (
    <section
      id="goal-preview"
      aria-labelledby="goal-preview-heading"
      className="scroll-mt-28 bg-muted dark:bg-muted/20 py-24 md:py-32"
    >
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid items-center gap-16 md:grid-cols-2">
          <BlurFade delay={0} inView>
            <div>
              <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-primary">{t('sectionLabel')}</p>
              <h2 id="goal-preview-heading" className="mb-4 text-3xl font-bold md:text-4xl">
                {t('heading')}
              </h2>
              <p className="mb-8 leading-relaxed text-muted-foreground">{t('subheading')}</p>
              <ul className="space-y-3">
                {bullets.map(bullet => (
                  <li key={bullet} className="flex items-center gap-3">
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <Check className="h-3 w-3 text-primary" aria-hidden="true" />
                    </div>
                    <span className="text-sm text-muted-foreground">{bullet}</span>
                  </li>
                ))}
              </ul>
            </div>
          </BlurFade>

          <BlurFade delay={0.2} inView>
            <div className="overflow-hidden rounded-xl border border-border bg-card shadow-2xl">
              <div className="flex items-center gap-1.5 border-b border-border bg-muted/30 px-4 py-3">
                <div className="h-3 w-3 rounded-full bg-red-400" aria-hidden="true" />
                <div className="h-3 w-3 rounded-full bg-yellow-400" aria-hidden="true" />
                <div className="h-3 w-3 rounded-full bg-green-400" aria-hidden="true" />
              </div>

              <div className="p-5">
                <div className="mb-4 rounded-lg border border-border bg-background p-4">
                  <div className="mb-3 flex items-start justify-between gap-4">
                    <div>
                      <p className="mb-0.5 text-xs text-muted-foreground">{t('goalSport')}</p>
                      <h3 className="text-sm font-semibold text-foreground">{t('goalTitle')}</h3>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-xs text-muted-foreground">{t('goalDaysLeft')}</p>
                      <p className="text-xs font-medium text-primary">{t('goalProgress')}</p>
                    </div>
                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-primary/10">
                    <motion.div
                      className="h-full rounded-full bg-primary"
                      initial={{ width: '0%' }}
                      whileInView={{ width: '74%' }}
                      transition={{ duration: 1.5, ease: 'easeOut', delay: 0.3 }}
                      viewport={{ once: true }}
                    />
                  </div>
                  <p className="mt-1.5 text-right text-xs text-muted-foreground">74%</p>
                </div>

                <p className="mb-2 text-xs font-medium text-muted-foreground">{t('chartLabel')}</p>
                <ChartContainer config={chartConfig} className="h-[120px] w-full">
                  <AreaChart data={WEEKLY_DATA} margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
                    <defs>
                      <linearGradient id="distanceFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" style={{ stopColor: 'var(--color-distance)' }} stopOpacity={0.3} />
                        <stop offset="95%" style={{ stopColor: 'var(--color-distance)' }} stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                    <Area
                      type="monotone"
                      dataKey="distance"
                      stroke="var(--color-distance)"
                      strokeWidth={2}
                      fill="url(#distanceFill)"
                      dot={false}
                    />
                  </AreaChart>
                </ChartContainer>
              </div>
            </div>
          </BlurFade>
        </div>
      </div>
    </section>
  );
}
