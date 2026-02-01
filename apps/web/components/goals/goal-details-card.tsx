import type { Goal } from '@/gql/graphql';
import { useLocale, useTranslations } from 'next-intl';
import { Calendar, Clock, Target } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  formatPeriod,
  getSportIcon,
  getSportLabelKey,
  getUnitLabel,
  formatDate,
  normalizeGoalValue,
} from '@/lib/goals/formatting';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GoalDetailsCardProps {
  goal: Goal;
}

interface DetailRowProps {
  icon: LucideIcon;
  label: string;
  value: string;
  highlight?: boolean;
}

function DetailRow({ icon: Icon, label, value, highlight }: DetailRowProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="p-2 rounded-lg bg-muted">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="flex-1">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className={cn('font-medium', highlight && 'text-strava-orange')}>{value}</p>
      </div>
    </div>
  );
}

export function GoalDetailsCard({ goal }: GoalDetailsCardProps) {
  const locale = useLocale();
  const t = useTranslations('goals.detail');
  const tSport = useTranslations();

  const SportIcon = getSportIcon(goal.sportType);
  const sportLabelKey = getSportLabelKey(goal.sportType);
  const sportLabel = sportLabelKey ? tSport(sportLabelKey) : t('allSports');

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('information')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <DetailRow icon={Calendar} label={t('period')} value={formatPeriod(goal.startDate, goal.endDate, locale)} />

        {!goal.isExpired && goal.daysRemaining !== null && goal.daysRemaining !== undefined && (
          <DetailRow
            icon={Clock}
            label={t('daysRemaining')}
            value={t('daysRemainingValue', { days: goal.daysRemaining })}
            highlight
          />
        )}

        <DetailRow
          icon={Target}
          label={t('target')}
          value={`${normalizeGoalValue(goal.targetValue, goal.targetType)} ${getUnitLabel(goal.targetType)}`}
        />

        <DetailRow icon={SportIcon} label={t('sport')} value={sportLabel} />

        <Separator />

        <div className="text-xs text-muted-foreground space-y-1">
          <div>
            {t('createdAt')}: {formatDate(goal.createdAt, locale)}
          </div>
          <div>
            {t('updatedAt')}: {formatDate(goal.updatedAt, locale)}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
