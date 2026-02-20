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

// Re-export normalization function from lib for convenience
export { normalizeGoalValue } from '@/lib/goals/formatting';

// Goal status color configuration
export interface GoalStatusColorConfig {
  text: string;
  textSubtle: string;
  bg: string;
  bgSubtle: string;
  border: string;
  hoverBorder: string;
  hex: string;
}

export const GOAL_STATUS_COLORS: Record<GoalStatus, GoalStatusColorConfig> = {
  [GoalStatus.Active]: {
    text: 'text-primary',
    textSubtle: 'text-primary/10',
    bg: 'bg-primary',
    bgSubtle: 'bg-primary/10',
    border: 'border-primary',
    hoverBorder: 'hover:border-primary/50',
    hex: '#E5482D',
  },
  [GoalStatus.Completed]: {
    text: 'text-green-500',
    textSubtle: 'text-green-500/10',
    bg: 'bg-green-500',
    bgSubtle: 'bg-green-500/10',
    border: 'border-green-500',
    hoverBorder: 'hover:border-green-500/50',
    hex: '#22c55e',
  },
  [GoalStatus.Failed]: {
    text: 'text-destructive',
    textSubtle: 'text-destructive/10',
    bg: 'bg-destructive',
    bgSubtle: 'bg-destructive/10',
    border: 'border-destructive',
    hoverBorder: 'hover:border-destructive/50',
    hex: '#ef4444',
  },
  [GoalStatus.Archived]: {
    text: 'text-muted-foreground',
    textSubtle: 'text-muted-foreground/10',
    bg: 'bg-muted-foreground',
    bgSubtle: 'bg-muted-foreground/10',
    border: 'border-muted-foreground',
    hoverBorder: 'hover:border-muted-foreground/50',
    hex: '#64748b',
  },
};

export function getGoalStatusColors(status: GoalStatus | undefined): GoalStatusColorConfig {
  return GOAL_STATUS_COLORS[status ?? GoalStatus.Active];
}

export const CHART_TARGET_LINE_COLOR = '#94a3b8';
