'use client';

import { useTranslations } from 'next-intl';
import { type ProgressionMetric, type SportType } from '@/gql/graphql';
import { getSportColors } from '@/lib/sports/config';
import { cn } from '@/lib/utils';

export interface MetricSelectorProps {
  metrics: ProgressionMetric[];
  activeMetric: ProgressionMetric;
  onMetricChange: (metric: ProgressionMetric) => void;
  sportType: SportType;
  disabled?: boolean;
}

const METRIC_TRANSLATION_KEYS: Record<string, string> = {
  DISTANCE: 'distance',
  DURATION: 'duration',
  PACE: 'pace',
  SPEED: 'speed',
  SESSIONS: 'sessions',
  ELEVATION: 'elevation',
};

export function MetricSelector({ metrics, activeMetric, onMetricChange, sportType, disabled }: MetricSelectorProps) {
  const t = useTranslations('sportDashboard.progression.metrics');
  const sportColors = getSportColors(sportType);

  return (
    <div className="flex flex-wrap gap-1" role="radiogroup" aria-label="Metric selection">
      {metrics.map(metric => {
        const isActive = metric === activeMetric;
        const translationKey = METRIC_TRANSLATION_KEYS[metric] ?? metric.toLowerCase();

        return (
          <button
            key={metric}
            type="button"
            role="radio"
            aria-checked={isActive}
            onClick={() => onMetricChange(metric)}
            disabled={disabled}
            className={cn(
              'px-3 py-1.5 text-sm font-medium rounded-md transition-all',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              'disabled:pointer-events-none disabled:opacity-50',
              isActive
                ? `${sportColors.bgMuted} ${sportColors.text}`
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
            )}
          >
            {t(translationKey)}
          </button>
        );
      })}
    </div>
  );
}
