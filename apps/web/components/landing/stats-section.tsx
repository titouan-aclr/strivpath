'use client';

import { motion, useInView } from 'motion/react';
import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';

import { BlurFade } from '@/components/ui/blur-fade';
import { NumberTicker } from '@/components/ui/number-ticker';

function InfinityTicker() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });
  const [count, setCount] = useState(50);
  const [showInfinity, setShowInfinity] = useState(false);

  useEffect(() => {
    if (!inView) return;

    let timer: ReturnType<typeof setTimeout> | undefined;
    let current = 50;

    const tick = () => {
      current += 1;
      setCount(current);

      if (current < 100) {
        const progress = (current - 50) / 50;
        const delay = Math.max(5, 60 - progress * 55);
        timer = setTimeout(tick, delay);
      } else {
        if (current === 100) setShowInfinity(true);
        if (current < 250) timer = setTimeout(tick, 10);
      }
    };

    timer = setTimeout(tick, 50);
    return () => clearTimeout(timer);
  }, [inView]);

  return (
    <div ref={ref} className="inline-grid grid-cols-1">
      <motion.span
        className="col-start-1 row-start-1 text-5xl font-bold text-foreground"
        animate={{ opacity: showInfinity ? 0 : 1 }}
        transition={{ duration: 1.5, ease: 'easeIn' }}
      >
        {count}
      </motion.span>
      <motion.span
        className="col-start-1 row-start-1 text-5xl font-bold text-primary"
        initial={{ opacity: 0 }}
        animate={{ opacity: showInfinity ? 1 : 0 }}
        transition={{ duration: 2, ease: 'easeOut' }}
      >
        ∞
      </motion.span>
    </div>
  );
}

export function StatsSection() {
  const t = useTranslations('landing.stats');

  const stats: Array<{ id: string; value: number | null; label: string }> = [
    { id: 'goalTypes', value: 4, label: t('stat1.label') },
    { id: 'sports', value: 3, label: t('stat2.label') },
    { id: 'milestones', value: null, label: t('stat3.label') },
  ];

  return (
    <section id="stats" aria-labelledby="stats-heading" className="scroll-mt-28 bg-background py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <BlurFade delay={0} inView>
          <div className="mb-16 text-center">
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-primary">{t('sectionLabel')}</p>
            <h2 id="stats-heading" className="text-3xl font-bold md:text-4xl">
              {t('heading')}
            </h2>
          </div>
        </BlurFade>

        <div className="grid gap-8 md:grid-cols-3">
          {stats.map((stat, index) => (
            <BlurFade key={stat.id} delay={index * 0.1} inView>
              <div className="flex flex-col items-center text-center">
                <div className="mb-3">
                  {stat.value !== null ? (
                    <NumberTicker value={stat.value} className="text-5xl font-bold text-foreground" />
                  ) : (
                    <InfinityTicker />
                  )}
                </div>
                <p className="text-muted-foreground">{stat.label}</p>
              </div>
            </BlurFade>
          ))}
        </div>
      </div>
    </section>
  );
}
