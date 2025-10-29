'use client';

import { LayoutDashboard, Activity, Target, Award, Settings, Footprints, Bike, Waves } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { UserMenu } from './user-menu';

const NAV_ITEMS = [
  { label: 'navigation.dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'navigation.activities', href: '/activities', icon: Activity },
  { label: 'navigation.goals', href: '/goals', icon: Target },
  { label: 'navigation.badges', href: '/badges', icon: Award },
];

const SPORT_ITEMS = [
  { label: 'navigation.sports.running', href: '/sports/running', icon: Footprints, sportType: 'RUN' },
  { label: 'navigation.sports.cycling', href: '/sports/cycling', icon: Bike, sportType: 'RIDE' },
  { label: 'navigation.sports.swimming', href: '/sports/swimming', icon: Waves, sportType: 'SWIM' },
];

export function Sidebar() {
  const t = useTranslations();
  const pathname = usePathname();

  const selectedSports = ['RUN', 'RIDE', 'SWIM'];

  const filteredSports = SPORT_ITEMS.filter(sport => selectedSports.includes(sport.sportType));

  const isActiveRoute = (href: string) => {
    const pathnameWithoutLocale = pathname.replace(/^\/(en|fr)/, '');
    return pathnameWithoutLocale === href || pathnameWithoutLocale.startsWith(`${href}/`);
  };

  return (
    <aside className="hidden w-64 flex-col border-r bg-card md:flex">
      <div className="p-6">
        <h1 className="text-2xl font-bold">{t('common.appName')}</h1>
      </div>

      <Separator />

      <nav className="flex-1 space-y-1 p-4">
        {NAV_ITEMS.map(item => {
          const Icon = item.icon;
          const isActive = isActiveRoute(item.href);

          return (
            <Button key={item.href} asChild variant={isActive ? 'secondary' : 'ghost'} className="w-full justify-start">
              <Link href={item.href}>
                <Icon className="mr-2 h-4 w-4" />
                {t(item.label)}
              </Link>
            </Button>
          );
        })}

        {filteredSports.length > 0 && (
          <>
            <Separator className="my-4" />
            <p className="px-3 text-xs font-semibold uppercase text-muted-foreground">{t('navigation.sports.title')}</p>

            {filteredSports.map(sport => {
              const Icon = sport.icon;
              const isActive = isActiveRoute(sport.href);

              return (
                <Button
                  key={sport.href}
                  asChild
                  variant={isActive ? 'secondary' : 'ghost'}
                  className="w-full justify-start"
                >
                  <Link href={sport.href}>
                    <Icon className="mr-2 h-4 w-4" />
                    {t(sport.label)}
                  </Link>
                </Button>
              );
            })}
          </>
        )}

        <Separator className="my-4" />

        <Button asChild variant={isActiveRoute('/settings') ? 'secondary' : 'ghost'} className="w-full justify-start">
          <Link href="/settings">
            <Settings className="mr-2 h-4 w-4" />
            {t('navigation.settings')}
          </Link>
        </Button>
      </nav>

      <div className="border-t p-4">
        <UserMenu />
      </div>
    </aside>
  );
}
