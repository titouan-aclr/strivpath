import { setRequestLocale } from 'next-intl/server';
import { ActivitiesPageContent } from './activities-page-content';

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function ActivitiesPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <ActivitiesPageContent />;
}
