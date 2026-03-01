'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';

import { Separator } from '@/components/ui/separator';
import { UserMenu } from './user-menu';
import { SidebarNavContent } from './sidebar-nav-content';

export function Sidebar() {
  const t = useTranslations();

  return (
    <aside className="hidden w-64 flex-col border-r bg-card md:flex">
      <div className="p-6">
        <h1 className="flex items-center gap-2 text-xl font-bold">
          <Image src="/logo.svg" alt="StrivPath logo" width={28} height={28} className="h-7 w-7" />
          {t('common.appName')}
        </h1>
      </div>

      <Separator />

      <SidebarNavContent />

      <div className="border-t p-4">
        <UserMenu />
      </div>
    </aside>
  );
}
