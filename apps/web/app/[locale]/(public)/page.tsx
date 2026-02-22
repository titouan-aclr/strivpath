import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';

import { routing } from '@/i18n/routing';
import { verifyAuth } from '@/lib/auth/dal';
import { LandingHeader } from '@/components/landing/landing-header';
import { TopoGlowSection } from '@/components/landing/topo-glow-section';
import { HeroSection } from '@/components/landing/hero-section';
import { ProblemSolutionSection } from '@/components/landing/problem-solution-section';
import { FeaturesSection } from '@/components/landing/features-section';
import { HowItWorksSection } from '@/components/landing/how-it-works-section';
import { StatsSection } from '@/components/landing/stats-section';
import { GoalPreviewSection } from '@/components/landing/goal-preview-section';

type Props = {
  params: Promise<{ locale: string }>;
};

function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
}

function getCanonicalUrl(locale: string): string {
  const appUrl = getAppUrl();
  return locale === routing.defaultLocale ? appUrl : `${appUrl}/${locale}`;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'landing.meta' });
  const canonicalUrl = getCanonicalUrl(locale);

  return {
    title: t('title'),
    description: t('description'),
    alternates: {
      canonical: canonicalUrl,
      languages: Object.fromEntries(routing.locales.map(l => [l, getCanonicalUrl(l)])),
    },
    openGraph: {
      title: t('title'),
      description: t('description'),
      url: canonicalUrl,
      siteName: 'StrivPath',
      locale: locale === 'fr' ? 'fr_FR' : 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: t('title'),
      description: t('description'),
    },
  };
}

export default async function LandingPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [isAuthenticated, t] = await Promise.all([
    verifyAuth(),
    getTranslations({ locale, namespace: 'landing.meta' }),
  ]);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'StrivPath',
    description: t('description'),
    url: getCanonicalUrl(locale),
    applicationCategory: 'SportsApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <LandingHeader isAuthenticated={isAuthenticated} />
      <main>
        <TopoGlowSection>
          <HeroSection isAuthenticated={isAuthenticated} />
        </TopoGlowSection>
        <ProblemSolutionSection />
        <FeaturesSection />
        <HowItWorksSection />
        <StatsSection />
        <GoalPreviewSection />
      </main>
    </>
  );
}
