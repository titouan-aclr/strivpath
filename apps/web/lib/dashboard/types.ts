import type { StatisticsPeriod, SportType, GoalStatus, GoalTargetType } from '@/gql/graphql';

export interface GoalProgressPoint {
  date: Date;
  value: number;
}

export interface BaseGoal {
  id: string;
  title: string;
  targetType: GoalTargetType;
  targetValue: number;
  currentValue: number;
  startDate: Date;
  endDate: Date;
  sportType: SportType | null;
  status: GoalStatus;
  progressPercentage: number;
  daysRemaining: number | null;
  isExpired: boolean;
}

export interface PrimaryGoal extends BaseGoal {
  progressHistory: GoalProgressPoint[];
}

export type SecondaryGoal = BaseGoal;

export interface PeriodStats {
  totalTime: number;
  activityCount: number;
  averageTimePerSession: number;
  periodStart: Date;
  periodEnd: Date;
}

export interface ActivityCalendarDay {
  date: Date;
  hasActivity: boolean;
}

export interface SportDistributionItem {
  sport: SportType;
  percentage: number;
  totalTime: number;
}

export interface DashboardUser {
  id: string;
  firstname: string | null;
  lastname: string | null;
}

export interface DashboardSyncHistory {
  id: string;
  completedAt: Date | null;
  status: string;
  stage: string | null;
}

export interface DashboardActivity {
  id: string;
  stravaId: string;
  name: string;
  type: string;
  distance: number;
  movingTime: number;
  elapsedTime: number;
  totalElevationGain: number;
  startDate: Date;
  averageSpeed: number | null;
  maxHeartrate: number | null;
  kudosCount: number;
}

export interface DashboardUserPreferences {
  selectedSports: SportType[];
}

export interface DashboardData {
  periodStatistics: PeriodStats;
  primaryGoal: PrimaryGoal | null;
  secondaryGoals: SecondaryGoal[];
  activityCalendar: ActivityCalendarDay[];
  sportDistribution: SportDistributionItem[];
  activities: DashboardActivity[];
  latestSyncHistory: DashboardSyncHistory | null;
  currentUser: DashboardUser | null;
  userPreferences: DashboardUserPreferences | null;
}

export type ProgressStatus = 'ahead' | 'behind' | 'onTrack';

export interface DashboardQueryVariables {
  period: StatisticsPeriod;
  year: number;
  month?: number | null;
  activitiesLimit?: number;
}

export { StatisticsPeriod } from '@/gql/graphql';
