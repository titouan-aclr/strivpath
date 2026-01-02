import { GoalStatus, GoalPeriodType, GoalTargetType, SportType } from '@/gql/graphql';
import { Footprints, Bike, Waves, Target } from 'lucide-react';

// Sport type options
export const SPORT_TYPE_OPTIONS = [
  { value: null, label: 'filters.sport.all', icon: Target },
  { value: SportType.Run, label: 'filters.sport.run', icon: Footprints },
  { value: SportType.Ride, label: 'filters.sport.ride', icon: Bike },
  { value: SportType.Swim, label: 'filters.sport.swim', icon: Waves },
];

// Status options
export const STATUS_OPTIONS = [
  { value: null, label: 'filters.status.all' },
  { value: GoalStatus.Active, label: 'filters.status.active' },
  { value: GoalStatus.Completed, label: 'filters.status.completed' },
  { value: GoalStatus.Failed, label: 'filters.status.failed' },
  { value: GoalStatus.Archived, label: 'filters.status.archived' },
];

// Period type options
export const PERIOD_TYPE_OPTIONS = [
  { value: null, label: 'filters.period.all' },
  { value: GoalPeriodType.Weekly, label: 'filters.period.weekly' },
  { value: GoalPeriodType.Monthly, label: 'filters.period.monthly' },
  { value: GoalPeriodType.Yearly, label: 'filters.period.yearly' },
  { value: GoalPeriodType.Custom, label: 'filters.period.custom' },
];

// Target type options
export const TARGET_TYPE_OPTIONS = [
  { value: null, label: 'filters.target.all' },
  { value: GoalTargetType.Distance, label: 'filters.target.distance' },
  { value: GoalTargetType.Duration, label: 'filters.target.duration' },
  { value: GoalTargetType.Elevation, label: 'filters.target.elevation' },
  { value: GoalTargetType.Frequency, label: 'filters.target.frequency' },
];

// Sort options
export enum GoalOrderBy {
  PROGRESS = 'PROGRESS',
  DEADLINE = 'DEADLINE',
  CREATED = 'CREATED',
}

export enum OrderDirection {
  ASC = 'ASC',
  DESC = 'DESC',
}

export interface SortOption {
  value: string;
  label: string;
  orderBy: GoalOrderBy;
  orderDirection: OrderDirection;
}

export const SORT_OPTIONS: SortOption[] = [
  {
    value: 'PROGRESS_DESC',
    label: 'filters.sort.progressDesc',
    orderBy: GoalOrderBy.PROGRESS,
    orderDirection: OrderDirection.DESC,
  },
  {
    value: 'PROGRESS_ASC',
    label: 'filters.sort.progressAsc',
    orderBy: GoalOrderBy.PROGRESS,
    orderDirection: OrderDirection.ASC,
  },
  {
    value: 'DEADLINE_ASC',
    label: 'filters.sort.deadlineAsc',
    orderBy: GoalOrderBy.DEADLINE,
    orderDirection: OrderDirection.ASC,
  },
  {
    value: 'DEADLINE_DESC',
    label: 'filters.sort.deadlineDesc',
    orderBy: GoalOrderBy.DEADLINE,
    orderDirection: OrderDirection.DESC,
  },
  {
    value: 'CREATED_DESC',
    label: 'filters.sort.createdDesc',
    orderBy: GoalOrderBy.CREATED,
    orderDirection: OrderDirection.DESC,
  },
  {
    value: 'CREATED_ASC',
    label: 'filters.sort.createdAsc',
    orderBy: GoalOrderBy.CREATED,
    orderDirection: OrderDirection.ASC,
  },
];

// Unit labels
export const UNIT_LABELS = {
  [GoalTargetType.Distance]: 'km',
  [GoalTargetType.Duration]: 'hours',
  [GoalTargetType.Elevation]: 'meters',
  [GoalTargetType.Frequency]: 'sessions',
};
