'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Award, Flame, Mountain, Target, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const BADGE_CATEGORIES = [
  { icon: TrendingUp, key: 'distance' },
  { icon: Flame, key: 'consistency' },
  { icon: Target, key: 'records' },
  { icon: Mountain, key: 'elevation' },
] as const;

export function BadgesComingSoon() {
  const t = useTranslations('badges');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
        <p className="mt-2 text-muted-foreground">{t('subtitle')}</p>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center px-6 py-12 text-center">
          <div className="mb-6 rounded-2xl bg-primary/10 p-5">
            <Award className="h-12 w-12 text-primary" aria-hidden="true" />
          </div>

          <Badge
            variant="outline"
            className="mb-4 border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          >
            {t('comingSoon.badge')}
          </Badge>

          <h2 className="text-xl font-semibold">{t('comingSoon.heading')}</h2>
          <p className="mt-2 max-w-md text-muted-foreground">{t('comingSoon.description')}</p>

          <div className="mt-8 grid w-full max-w-lg grid-cols-2 gap-3 sm:grid-cols-4">
            {BADGE_CATEGORIES.map(({ icon: Icon, key }) => (
              <div
                key={key}
                className="flex flex-col items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-4"
              >
                <Icon className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                <span className="text-center text-xs text-muted-foreground">{t(`comingSoon.categories.${key}`)}</span>
              </div>
            ))}
          </div>

          <Button asChild variant="outline" className="mt-8">
            <Link href="/goals">{t('comingSoon.cta')}</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
