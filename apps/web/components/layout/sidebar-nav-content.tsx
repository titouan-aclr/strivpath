'use client';

import { LayoutDashboard, Activity, Target, Award, Settings } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useAvailableSports } from '@/lib/sports/hooks';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { label: 'navigation.dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'navigation.activities', href: '/activities', icon: Activity },
  { label: 'navigation.goals', href: '/goals', icon: Target },
  { label: 'navigation.badges', href: '/badges', icon: Award },
];

interface SidebarNavContentProps {
  onNavigate?: () => void;
}

export function SidebarNavContent({ onNavigate }: SidebarNavContentProps) {
  const t = useTranslations();
  const pathname = usePathname();
  const { sportConfigs, loading: sportsLoading } = useAvailableSports();

  const isActiveRoute = (href: string) => {
    const pathnameWithoutLocale = pathname.replace(/^\/(en|fr)/, '');
    return pathnameWithoutLocale === href || pathnameWithoutLocale.startsWith(`${href}/`);
  };

  return (
    <nav className="flex flex-col flex-1 space-y-1 p-4 bg-pattern-topo-bottom">
      {NAV_ITEMS.map(item => {
        const Icon = item.icon;
        const isActive = isActiveRoute(item.href);

        return (
          <Button
            key={item.href}
            asChild
            variant="ghost"
            className={cn(
              'w-full justify-start',
              isActive && 'bg-primary/10 text-primary hover:bg-primary/20 shadow-sm',
            )}
          >
            <Link href={item.href} onClick={onNavigate}>
              <Icon className="mr-2 h-4 w-4" />
              {t(item.label)}
            </Link>
          </Button>
        );
      })}

      {sportsLoading ? (
        <>
          <Separator className="my-4" />
          <Skeleton className="h-4 w-16 mx-3 mb-2" />
          <div className="space-y-1">
            <Skeleton className="h-9 w-full rounded-md" />
            <Skeleton className="h-9 w-full rounded-md" />
          </div>
        </>
      ) : (
        sportConfigs.length > 0 && (
          <>
            <Separator className="my-4" />
            <p className="px-3 text-xs font-semibold uppercase text-muted-foreground">{t('navigation.sports.title')}</p>

            {sportConfigs.map(sport => {
              const Icon = sport.icon;
              const isActive = isActiveRoute(sport.href);

              return (
                <Button
                  key={sport.href}
                  asChild
                  variant="ghost"
                  className={cn(
                    'w-full justify-start',
                    isActive && 'bg-primary/10 text-primary hover:bg-primary/20 shadow-sm',
                  )}
                >
                  <Link href={sport.href} onClick={onNavigate}>
                    <Icon className="mr-2 h-4 w-4" aria-hidden="true" />
                    {t(sport.labelKey)}
                  </Link>
                </Button>
              );
            })}
          </>
        )
      )}

      <Separator className="my-4" />

      <Button
        asChild
        variant="ghost"
        className={cn(
          'w-full justify-start',
          isActiveRoute('/settings') && 'bg-primary/10 text-primary hover:bg-primary/20 shadow-sm',
        )}
      >
        <Link href="/settings" onClick={onNavigate}>
          <Settings className="mr-2 h-4 w-4" />
          {t('navigation.settings')}
        </Link>
      </Button>
    </nav>
  );
}
