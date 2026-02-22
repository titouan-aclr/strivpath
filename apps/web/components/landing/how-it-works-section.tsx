'use client';

import { useRef } from 'react';
import { motion, type Variants } from 'motion/react';
import { useTranslations } from 'next-intl';

import { AnimatedBeam } from '@/components/ui/animated-beam';
import { BlurFade } from '@/components/ui/blur-fade';

const containerVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.2,
    },
  },
};

const stepVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.4, ease: 'easeOut' },
  },
};

export function HowItWorksSection() {
  const t = useTranslations('landing.howItWorks');

  const containerRef = useRef<HTMLDivElement>(null);
  const step1Ref = useRef<HTMLDivElement>(null);
  const step2Ref = useRef<HTMLDivElement>(null);
  const step3Ref = useRef<HTMLDivElement>(null);

  const steps = [
    { ref: step1Ref, number: 1, title: t('step1.title'), description: t('step1.description') },
    { ref: step2Ref, number: 2, title: t('step2.title'), description: t('step2.description') },
    { ref: step3Ref, number: 3, title: t('step3.title'), description: t('step3.description') },
  ];

  return (
    <section id="how-it-works" className="bg-background py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <BlurFade delay={0} inView>
          <div className="mb-16 text-center">
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-primary">{t('sectionLabel')}</p>
            <h2 className="text-3xl font-bold md:text-4xl">{t('heading')}</h2>
          </div>
        </BlurFade>

        <div ref={containerRef} className="relative">
          <div className="hidden md:block">
            <AnimatedBeam
              containerRef={containerRef}
              fromRef={step1Ref}
              toRef={step2Ref}
              gradientStartColor={'var(--primary)'}
              gradientStopColor={'var(--primary)'}
              pathOpacity={0.12}
              duration={5}
              startXOffset={30}
              endXOffset={-30}
            />
            <AnimatedBeam
              containerRef={containerRef}
              fromRef={step2Ref}
              toRef={step3Ref}
              gradientStartColor={'var(--primary)'}
              gradientStopColor={'var(--primary)'}
              pathOpacity={0.12}
              duration={5}
              delay={1}
              startXOffset={30}
              endXOffset={-30}
            />
          </div>

          <motion.div
            className="relative z-10 grid gap-10 md:grid-cols-3"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
          >
            {steps.map(step => (
              <motion.div key={step.number} variants={stepVariants} className="flex flex-col items-center text-center">
                <div
                  ref={step.ref}
                  className="mb-5 flex h-14 w-14 items-center justify-center rounded-full border-2 border-primary/20 bg-primary/10"
                >
                  <span className="text-xl font-bold text-primary">{step.number}</span>
                </div>
                <h3 className="mb-2 font-semibold text-foreground">{step.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{step.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
