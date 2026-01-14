import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { GoalsPageContent } from '@/components/goals/goals-page-content';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('goals.meta');

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default function GoalsPage() {
  return <GoalsPageContent />;
}
