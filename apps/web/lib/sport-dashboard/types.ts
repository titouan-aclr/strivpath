import {
  ProgressionMetric,
  SportType,
  StatisticsPeriod,
  type PersonalRecord,
  type ProgressionDataPoint,
  type SportAverageMetrics,
} from '@/gql/graphql';

export type {
  IntervalType,
  PersonalRecord,
  ProgressionDataPoint,
  SportAverageMetrics,
  SportPeriodStatistics,
} from '@/gql/graphql';

export { ProgressionMetric, SportType, StatisticsPeriod };

export interface SportDashboardProps {
  sportType: SportType;
}

export interface SportStatsSectionProps {
  sportType: SportType;
  period: StatisticsPeriod;
  onPeriodChange: (period: StatisticsPeriod) => void;
}

export interface ProgressionChartProps {
  sportType: SportType;
  data: ProgressionDataPoint[];
  metric: ProgressionMetric;
  period: StatisticsPeriod;
  onMetricChange: (metric: ProgressionMetric) => void;
  onPeriodChange: (period: StatisticsPeriod) => void;
  isLoading?: boolean;
}

export interface AverageMetricsProps {
  sportType: SportType;
  metrics: SportAverageMetrics | null;
  period: StatisticsPeriod;
  onPeriodChange: (period: StatisticsPeriod) => void;
  isLoading?: boolean;
}

export interface PersonalRecordsProps {
  sportType: SportType;
  records: PersonalRecord[];
  isLoading?: boolean;
}

export type { TrendDisplay } from '@/lib/sports/formatters';

export const SPORT_METRICS: Record<SportType, ProgressionMetric[]> = {
  [SportType.Run]: [
    ProgressionMetric.Distance,
    ProgressionMetric.Duration,
    ProgressionMetric.Pace,
    ProgressionMetric.Sessions,
    ProgressionMetric.Elevation,
  ],
  [SportType.Ride]: [
    ProgressionMetric.Distance,
    ProgressionMetric.Duration,
    ProgressionMetric.Speed,
    ProgressionMetric.Sessions,
    ProgressionMetric.Elevation,
  ],
  [SportType.Swim]: [
    ProgressionMetric.Distance,
    ProgressionMetric.Duration,
    ProgressionMetric.Pace,
    ProgressionMetric.Sessions,
  ],
};

export function getAvailableMetrics(sportType: SportType): ProgressionMetric[] {
  return (
    SPORT_METRICS[sportType] ?? [ProgressionMetric.Distance, ProgressionMetric.Duration, ProgressionMetric.Sessions]
  );
}
