'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { usePathname, useRouter } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import { Monitor, Moon, Palette, Sun } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

const THEMES = [
  { value: 'light', icon: Sun, labelKey: 'light' },
  { value: 'dark', icon: Moon, labelKey: 'dark' },
  { value: 'system', icon: Monitor, labelKey: 'system' },
] as const;

const LOCALES = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
];

export function AppearanceSection() {
  const t = useTranslations('settings.appearance');
  const { theme, setTheme } = useTheme();
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLocaleChange = (newLocale: string) => {
    router.push(pathname, { locale: newLocale });
    router.refresh();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5" aria-hidden="true" />
          {t('title')}
        </CardTitle>
        <CardDescription>{t('description')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 flex items-start gap-6">
        <div className="space-y-3">
          <Label className="text-sm font-medium mb-2 block">{t('language.label')}</Label>
          <div className="flex flex-wrap gap-2">
            {LOCALES.map(loc => (
              <Button
                key={loc.code}
                variant={locale === loc.code ? 'default' : 'outline'}
                size="sm"
                className={cn('gap-2', locale === loc.code && 'bg-primary hover:bg-primary/90')}
                onClick={() => handleLocaleChange(loc.code)}
              >
                <span aria-hidden="true">{loc.flag}</span>
                {loc.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <Label className="text-sm font-medium mb-2 block">{t('theme.label')}</Label>
          <div className="flex flex-wrap gap-2">
            {!mounted ? (
              <>
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-8 w-20" />
              </>
            ) : (
              THEMES.map(({ value, icon: Icon, labelKey }) => (
                <Button
                  key={value}
                  variant={theme === value ? 'default' : 'outline'}
                  size="sm"
                  className={cn('gap-2', theme === value && 'bg-primary hover:bg-primary/90')}
                  onClick={() => setTheme(value)}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {t(`theme.${labelKey}`)}
                </Button>
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
