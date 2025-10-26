import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';

export default async function LocaleNotFound() {
  const t = await getTranslations('errors.notFound');

  return (
    <div className="container mx-auto p-8">
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <h1 className="text-6xl font-bold text-primary">404</h1>
        <h2 className="text-2xl font-semibold">{t('title')}</h2>
        <p className="text-muted-foreground">{t('description')}</p>
        <Link href="/" className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
          {t('goHome')}
        </Link>
      </div>
    </div>
  );
}
