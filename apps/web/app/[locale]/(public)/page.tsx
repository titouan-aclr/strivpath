import { Button } from '@/components/ui/button';
import { ModeToggle } from '@/components/mode-toggle';
import { LanguageSwitcher } from '@/components/language-switcher';
import Link from 'next/link';
import { setRequestLocale, getTranslations } from 'next-intl/server';

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function LandingPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('auth.login');

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
        <div className="w-full max-w-md text-center">
          <h2 className="mb-4 text-4xl font-bold">{t('title')}</h2>
          <p className="mb-8 text-lg text-muted-foreground">{t('description')}</p>
          <Button asChild size="lg">
            <Link href="/login">{t('connectButton')}</Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
