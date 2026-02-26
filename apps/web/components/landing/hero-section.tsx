'use client';

import { ChevronDown } from 'lucide-react';
import { motion } from 'motion/react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';

import { AnimatedGradientText } from '@/components/ui/animated-gradient-text';
import { Button } from '@/components/ui/button';

interface HeroSectionProps {
  isAuthenticated: boolean;
}

const STAGGER = {
  badge: 0,
  headline: 0.15,
  subtitle: 0.3,
  ctas: 0.45,
  sports: 0.6,
  scroll: 0.8,
} as const;

function FadeUp({ children, delay, className }: { children: React.ReactNode; delay: number; className?: string }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}

export function HeroSection({ isAuthenticated }: HeroSectionProps) {
  const t = useTranslations('landing.hero');
  const ctaHref = isAuthenticated ? '/dashboard' : '/login';
  const ctaLabel = isAuthenticated ? t('ctaAuthenticated') : t('cta');

  return (
    <section
      className="flex min-h-screen flex-col items-center justify-center px-6 py-32 text-center"
      aria-labelledby="hero-heading"
    >
      <FadeUp delay={STAGGER.badge} className="mb-6">
        <div className="inline-flex items-center rounded-full border border-border/50 bg-background/30 px-4 py-1.5 text-sm">
          <AnimatedGradientText colorFrom="oklch(0.6216 0.198 32.23)" colorTo="oklch(0.78 0.12 45)" speed={0.6}>
            {t('badge')}
          </AnimatedGradientText>
        </div>
      </FadeUp>

      <FadeUp delay={STAGGER.headline}>
        <h1 id="hero-heading" className="text-5xl font-black tracking-tighter md:text-7xl">
          {t('headline1')}
          <br />
          <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            {t('headline2')}
          </span>
        </h1>
      </FadeUp>

      <FadeUp delay={STAGGER.subtitle} className="mt-6">
        <p className="max-w-2xl text-lg text-muted-foreground md:text-xl">{t('subtitle')}</p>
      </FadeUp>

      <FadeUp delay={STAGGER.ctas} className="mt-10">
        <div className="flex flex-col items-center gap-4 sm:flex-row">
          <Button asChild size="lg" className="rounded-xl px-8">
            <Link href={ctaHref}>→ {ctaLabel}</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="rounded-xl px-8">
            <a href="#how-it-works">{t('ctaSecondary')}</a>
          </Button>
        </div>
      </FadeUp>

      <FadeUp delay={STAGGER.sports} className="mt-8">
        <p className="text-sm text-muted-foreground" aria-label="Supported sports">
          {t('sports')}
        </p>
      </FadeUp>

      <FadeUp delay={STAGGER.scroll} className="mt-16">
        <a href="#problem" aria-label="Scroll to next section">
          <motion.div animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}>
            <ChevronDown className="h-6 w-6 text-muted-foreground transition-colors hover:text-foreground" />
          </motion.div>
        </a>
      </FadeUp>
    </section>
  );
}
