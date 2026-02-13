'use client';

import { useTranslations } from 'next-intl';
import { Repeat, Footprints, Bike, Waves, Activity } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SportType, type GoalTemplateInfoFragment } from '@/gql/graphql';
import { formatGoalTarget, getTargetTypeConfig } from '@/lib/goals/form-utils';

interface GoalTemplateCardProps {
  template: GoalTemplateInfoFragment;
  onSelect: () => void;
}

export function GoalTemplateCard({ template, onSelect }: GoalTemplateCardProps) {
  const t = useTranslations('goals');

  const SportIcon = getSportIcon(template.sportType);
  const config = getTargetTypeConfig(template.targetType);
  const formattedValue = formatGoalTarget(template.targetValue, template.targetType);

  return (
    <Card
      className="cursor-pointer transition-all hover:shadow-lg hover:border-primary/50"
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect();
        }
      }}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <SportIcon className="h-5 w-5 text-primary" aria-hidden="true" />
            </div>
            <CardTitle className="text-lg">{template.title}</CardTitle>
          </div>
          <Badge variant="outline">{t(`periodTypes.${template.periodType.toLowerCase()}`)}</Badge>
        </div>
        {template.description && <CardDescription>{template.description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-primary">{formattedValue}</span>
          <span className="text-sm text-muted-foreground">{config.unit}</span>
        </div>
        {template.isPreset && (
          <Badge variant="secondary" className="mt-2">
            <Repeat className="mr-1 h-3 w-3" />
            {t('create.templateSelector.recurring')}
          </Badge>
        )}
      </CardContent>
    </Card>
  );
}

function getSportIcon(sportType: SportType | null | undefined) {
  if (sportType === SportType.Run) return Footprints;
  if (sportType === SportType.Ride) return Bike;
  if (sportType === SportType.Swim) return Waves;
  return Activity;
}
