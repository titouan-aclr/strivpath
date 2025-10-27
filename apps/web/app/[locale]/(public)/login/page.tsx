import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ModeToggle } from '@/components/mode-toggle';
import { LanguageSwitcher } from '@/components/language-switcher';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { getClient } from '@/lib/apollo-client';
import { gql } from '@apollo/client';

const GET_STRAVA_AUTH_URL = gql`
  query GetStravaAuthUrl {
    stravaAuthUrl
  }
`;

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function LoginPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('auth.login');

  const client = getClient();
  const { data } = await client.query<{ stravaAuthUrl: string }>({
    query: GET_STRAVA_AUTH_URL,
  });

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between p-6">
        <h1 className="text-2xl font-bold">Stravanalytics</h1>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <ModeToggle />
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-6">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl">{t('title')}</CardTitle>
            <CardDescription>{t('description')}</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button asChild size="lg" className="w-full">
              <a href={data?.stravaAuthUrl || '#'}>{t('connectButton')}</a>
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
