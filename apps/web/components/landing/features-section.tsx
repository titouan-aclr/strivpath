'use client';

import type { LucideIcon } from 'lucide-react';
import { Activity, Award, Target, TrendingUp } from 'lucide-react';
import { motion, type Variants } from 'motion/react';
import { useTranslations } from 'next-intl';

import { Badge } from '@/components/ui/badge';
import { BlurFade } from '@/components/ui/blur-fade';
import { BorderBeam } from '@/components/ui/border-beam';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const containerVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut' },
  },
};

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
  comingSoon?: boolean;
}

export function FeaturesSection() {
  const t = useTranslations('landing.features');

  const features: Feature[] = [
    {
      icon: Target,
      title: t('card1.title'),
      description: t('card1.description'),
    },
    {
      icon: TrendingUp,
      title: t('card2.title'),
      description: t('card2.description'),
    },
    {
      icon: Activity,
      title: t('card3.title'),
      description: t('card3.description'),
    },
    {
      icon: Award,
      title: t('card4.title'),
      description: t('card4.description'),
      comingSoon: true,
    },
  ];

  return (
    <section id="features" className="bg-muted dark:bg-muted/20 py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <BlurFade delay={0} inView>
          <div className="mb-16 text-center">
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-primary">{t('sectionLabel')}</p>
            <h2 className="text-3xl font-bold md:text-4xl">{t('heading')}</h2>
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">{t('subheading')}</p>
          </div>
        </BlurFade>

        <motion.div
          className="grid gap-6 md:grid-cols-2"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
        >
          {features.map(feature => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                className="group"
                variants={cardVariants}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
              >
                <Card
                  className={cn(
                    'relative h-full overflow-hidden p-6 transition-all hover:shadow-lg',
                    feature.comingSoon ? 'hover:border-border' : 'hover:border-primary/50',
                  )}
                >
                  {feature.comingSoon && (
                    <Badge
                      variant="outline"
                      className="absolute right-3 top-3 border-emerald-500/20 bg-emerald-500/10 text-xs text-emerald-600 dark:text-emerald-400"
                    >
                      {t('card4.comingSoon')}
                    </Badge>
                  )}
                  {feature.comingSoon && (
                    <>
                      <BorderBeam duration={8} size={250} colorFrom="transparent" colorTo="var(--primary)" />
                      <BorderBeam
                        duration={8}
                        delay={4}
                        size={250}
                        colorFrom="transparent"
                        colorTo="var(--primary)"
                        reverse
                      />
                    </>
                  )}
                  <div className="flex items-center gap-5">
                    <div className="shrink-0 origin-left transform-gpu rounded-lg bg-primary/10 p-3 transition-transform duration-300 group-hover:scale-75">
                      <Icon className="h-12 w-12 text-primary" aria-hidden="true" />
                    </div>
                    <div>
                      <h3 className="mb-1.5 font-semibold text-foreground">{feature.title}</h3>
                      <p className="text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
                    </div>
                  </div>
                  <div className="pointer-events-none absolute inset-0 transform-gpu rounded-xl transition-all duration-300 group-hover:bg-black/[.03] dark:group-hover:bg-white/[.02]" />
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
