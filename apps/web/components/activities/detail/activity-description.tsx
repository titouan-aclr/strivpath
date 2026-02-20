'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { FileText } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { ActivityDetail } from '@/lib/activities/activity-types';

interface ActivityDescriptionProps {
  activity: ActivityDetail;
}

export function ActivityDescription({ activity }: ActivityDescriptionProps) {
  const t = useTranslations('activities.detail');

  if (!activity.detailsFetched || !activity.description) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" aria-hidden="true" />
          {t('description.title')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{activity.description}</p>
      </CardContent>
    </Card>
  );
}
