'use client';

import Image from 'next/image';
import { AlertCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BlurFade } from '@/components/ui/blur-fade';
import { BorderBeam } from '@/components/ui/border-beam';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface LoginCardProps {
  stravaAuthUrl: string;
  error?: string;
}

export function LoginCard({ stravaAuthUrl, error }: LoginCardProps) {
  const t = useTranslations('auth.login');

  return (
    <BlurFade delay={0.1} duration={0.4}>
      <Card className="relative w-full max-w-sm overflow-hidden">
        <BorderBeam size={120} duration={12} colorFrom="transparent" colorTo="var(--primary)" />

        <CardHeader className="items-center text-center">
          <div className="mb-2 rounded-lg bg-primary/10 p-2">
            <Image src="/logo.svg" alt="" aria-hidden="true" width={24} height={24} className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl">{t('title')}</CardTitle>
          <CardDescription>{t('description')}</CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col items-center gap-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {t(`errors.${error}`)}
              </AlertDescription>
            </Alert>
          )}
          <Separator />
          <a
            href={stravaAuthUrl}
            className="rounded transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            aria-label={t('connectButton')}
          >
            <Image
              src="/strava/btn_strava_connect_with_orange.svg"
              alt=""
              width={237}
              height={48}
              priority
              unoptimized
            />
          </a>
          <p className="text-center text-xs text-muted-foreground">{t('oauthNote')}</p>
        </CardContent>
      </Card>
    </BlurFade>
  );
}
