import { Footprints, Bike, Waves, type LucideIcon } from 'lucide-react';
import { SportType } from '@/gql/graphql';
import type { DateRangePreset } from './types';

export enum OrderBy {
  Date = 'DATE',
  Distance = 'DISTANCE',
  Duration = 'DURATION',
}

export enum OrderDirection {
  Asc = 'ASC',
  Desc = 'DESC',
}

export interface SportTypeConfig {
  icon: LucideIcon;
  color: string;
  label: string;
}

export const SPORT_TYPE_CONFIG: Record<SportType, SportTypeConfig> = {
  [SportType.Run]: {
    icon: Footprints,
    color: 'text-primary',
    label: 'activities.sportTypes.run',
  },
  [SportType.Ride]: {
    icon: Bike,
    color: 'text-primary',
    label: 'activities.sportTypes.ride',
  },
  [SportType.Swim]: {
    icon: Waves,
    color: 'text-primary',
    label: 'activities.sportTypes.swim',
  },
};

export const ACTIVITIES_PAGE_SIZE = 20;

export const DATE_RANGE_PRESETS: DateRangePreset[] = [
  {
    label: 'activities.filters.dateRange.last7Days',
    getValue: () => {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 7);
      return { start, end };
    },
  },
  {
    label: 'activities.filters.dateRange.last30Days',
    getValue: () => {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 30);
      return { start, end };
    },
  },
  {
    label: 'activities.filters.dateRange.last90Days',
    getValue: () => {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 90);
      return { start, end };
    },
  },
  {
    label: 'activities.filters.dateRange.thisYear',
    getValue: () => {
      const end = new Date();
      const start = new Date(end.getFullYear(), 0, 1);
      return { start, end };
    },
  },
  {
    label: 'activities.filters.dateRange.allTime',
    getValue: () => ({ start: undefined, end: undefined }),
  },
];

export interface SortOption {
  value: string;
  label: string;
  orderBy: OrderBy;
  orderDirection: OrderDirection;
}

export const SORT_OPTIONS: SortOption[] = [
  {
    value: 'DATE_DESC',
    label: 'activities.sort.dateDesc',
    orderBy: OrderBy.Date,
    orderDirection: OrderDirection.Desc,
  },
  {
    value: 'DATE_ASC',
    label: 'activities.sort.dateAsc',
    orderBy: OrderBy.Date,
    orderDirection: OrderDirection.Asc,
  },
  {
    value: 'DISTANCE_DESC',
    label: 'activities.sort.distanceDesc',
    orderBy: OrderBy.Distance,
    orderDirection: OrderDirection.Desc,
  },
  {
    value: 'DISTANCE_ASC',
    label: 'activities.sort.distanceAsc',
    orderBy: OrderBy.Distance,
    orderDirection: OrderDirection.Asc,
  },
  {
    value: 'DURATION_DESC',
    label: 'activities.sort.durationDesc',
    orderBy: OrderBy.Duration,
    orderDirection: OrderDirection.Desc,
  },
  {
    value: 'DURATION_ASC',
    label: 'activities.sort.durationAsc',
    orderBy: OrderBy.Duration,
    orderDirection: OrderDirection.Asc,
  },
];
