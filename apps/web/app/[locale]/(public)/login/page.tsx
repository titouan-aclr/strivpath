import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ModeToggle } from '@/components/mode-toggle';
import { LanguageSwitcher } from '@/components/language-switcher';
import { AlertCircle } from 'lucide-react';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { getClient } from '@/lib/apollo-client';
import { StravaAuthUrlDocument, type StravaAuthUrlQuery } from '@/gql/graphql';
import { validateRedirect } from '@/lib/auth/redirect-to-login';
import { redirectIfAuthenticated } from '@/lib/auth/dal';

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ error?: string; redirect?: string }>;
};

export default async function LoginPage({ params, searchParams }: Props) {
  await redirectIfAuthenticated();

  const { locale } = await params;
  const { error, redirect } = await searchParams;
  setRequestLocale(locale);

  const t = await getTranslations('auth.login');

  const validatedRedirect = redirect ? validateRedirect(redirect) : undefined;

  const client = getClient();
  const { data } = await client.query<StravaAuthUrlQuery>({
    query: StravaAuthUrlDocument,
    variables: { redirect: validatedRedirect },
  });

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between p-6">
        <h1 className="text-2xl font-bold">StrivPath</h1>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <ModeToggle />
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-6">
        <Card className="w-full max-w-md">
          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              <span>{t(`errors.${error}`)}</span>
            </div>
          )}
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
