import { setRequestLocale } from 'next-intl/server';
import { ActivityDetailContent } from './activity-detail-content';

type Props = {
  params: Promise<{
    locale: string;
    id: string;
  }>;
};

export default async function ActivityDetailPage({ params }: Props) {
  const { locale, id } = await params;

  setRequestLocale(locale);

  return <ActivityDetailContent stravaId={id} />;
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;

  return {
    title: `Activity ${id} | Stravanalytics`,
    description: 'View detailed statistics and analysis for this activity',
  };
}
