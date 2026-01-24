import { setRequestLocale, getTranslations } from 'next-intl/server';
import { SettingsPageContent } from '@/components/settings/settings-page-content';
import type { Metadata } from 'next';

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('settings.meta');
  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function SettingsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <SettingsPageContent />;
}
