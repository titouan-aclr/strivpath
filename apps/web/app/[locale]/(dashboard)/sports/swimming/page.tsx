import { setRequestLocale } from 'next-intl/server';
import { SportDashboardContent } from '@/components/sport-dashboard';
import { SportType } from '@/gql/graphql';

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function SwimmingPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <SportDashboardContent sportType={SportType.Swim} />;
}
