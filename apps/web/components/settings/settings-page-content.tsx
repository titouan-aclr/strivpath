'use client';

import { useTranslations } from 'next-intl';
import { ProfileSection } from './profile-section';
import { SportsSection } from './sports-section';
import { SyncSection } from './sync-section';
import { AppearanceSection } from './appearance-section';
import { SessionSection } from './session-section';
import { DangerZoneSection } from './danger-zone-section';

export function SettingsPageContent() {
  const t = useTranslations('settings');

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
        <p className="text-muted-foreground mt-2">{t('description')}</p>
      </div>

      <div className="mx-auto max-w-4xl space-y-6">
        <ProfileSection />
        <SportsSection />
        <SyncSection />
        <AppearanceSection />
        <SessionSection />
        <DangerZoneSection />
      </div>
    </div>
  );
}
