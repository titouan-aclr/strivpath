import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { PublicPageHeader } from '@/components/layout/public-page-header';

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ error?: string }>;
};

export default async function AuthErrorPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const { error } = await searchParams;
  setRequestLocale(locale);

  const t = await getTranslations('auth.error');

  return (
    <div className="bg-pattern-topo-subtle flex min-h-screen flex-col">
      <PublicPageHeader />

      <main className="flex flex-1 items-center justify-center px-6">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle>{t('title')}</CardTitle>
            <CardDescription>
              {t('description')}
              {error && <div className="mt-2 text-sm text-muted-foreground">Error: {error}</div>}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button asChild>
              <Link href="/login">{t('tryAgain')}</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
