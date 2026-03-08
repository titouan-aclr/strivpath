import { getTranslations, getLocale, getMessages } from 'next-intl/server';
import { NextIntlClientProvider } from 'next-intl';
import { MapPinOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PublicPageHeader } from '@/components/layout/public-page-header';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { Link } from '@/i18n/navigation';
import './globals.css';

export default async function RootNotFound() {
  const locale = await getLocale();
  const messages = await getMessages();
  const t = await getTranslations('errors.notFound');

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className="min-h-screen bg-background antialiased">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
            <div className="bg-pattern-topo-subtle flex min-h-screen flex-col">
              <PublicPageHeader />
              <main className="flex flex-1 items-center justify-center px-6">
                <div className="flex max-w-md flex-col items-center gap-6 text-center">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                    <MapPinOff className="h-10 w-10 text-primary" aria-hidden="true" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-7xl font-bold text-primary">404</p>
                    <h1 className="text-2xl font-semibold">{t('title')}</h1>
                    <p className="text-muted-foreground">{t('description')}</p>
                  </div>
                  <Button asChild size="lg">
                    <Link href="/">{t('goHome')}</Link>
                  </Button>
                </div>
              </main>
            </div>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
