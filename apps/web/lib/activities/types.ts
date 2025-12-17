import type { ActivityType } from '@/gql/graphql';
import type { OrderBy, OrderDirection } from './constants';

export interface ActivityFilter {
  type?: ActivityType;
  startDate?: Date;
  endDate?: Date;
  orderBy?: OrderBy;
  orderDirection?: OrderDirection;
}

export interface DateRangePreset {
  label: string;
  getValue: () => { start: Date | undefined; end: Date | undefined };
}

export interface Split {
  distance: number;
  movingTime: number;
  elapsedTime: number;
  averageSpeed: number;
  elevationDifference?: number | null;
}

export interface ChartDataPoint {
  km: number;
  pace: number;
  speed: number;
  label: string;
}
