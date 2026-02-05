import { IntervalType, SportType, StatisticsPeriod } from '@/gql/graphql';
import type { PersonalRecord, ProgressionDataPoint, SportAverageMetrics, SportPeriodStatistics } from '@/gql/graphql';

export const MOCK_SPORT_PERIOD_STATISTICS: Record<SportType, SportPeriodStatistics> = {
  [SportType.Run]: {
    __typename: 'SportPeriodStatistics',
    totalDistance: 42500,
    totalDuration: 14400,
    activityCount: 8,
    totalElevation: 850,
    distanceTrend: 12.5,
    durationTrend: 8.3,
    activityTrend: 14.3,
    elevationTrend: -5.2,
  },
  [SportType.Ride]: {
    __typename: 'SportPeriodStatistics',
    totalDistance: 185000,
    totalDuration: 21600,
    activityCount: 5,
    totalElevation: 2100,
    distanceTrend: 25.0,
    durationTrend: 18.5,
    activityTrend: 0,
    elevationTrend: 32.1,
  },
  [SportType.Swim]: {
    __typename: 'SportPeriodStatistics',
    totalDistance: 4500,
    totalDuration: 5400,
    activityCount: 3,
    totalElevation: 0,
    distanceTrend: -10.0,
    durationTrend: -8.5,
    activityTrend: -25.0,
    elevationTrend: null,
  },
};

export const MOCK_PROGRESSION_DATA_WEEK: ProgressionDataPoint[] = [
  { __typename: 'ProgressionDataPoint', index: 0, intervalType: IntervalType.Day, value: 5200 },
  { __typename: 'ProgressionDataPoint', index: 1, intervalType: IntervalType.Day, value: 0 },
  { __typename: 'ProgressionDataPoint', index: 2, intervalType: IntervalType.Day, value: 8100 },
  { __typename: 'ProgressionDataPoint', index: 3, intervalType: IntervalType.Day, value: 0 },
  { __typename: 'ProgressionDataPoint', index: 4, intervalType: IntervalType.Day, value: 6300 },
  { __typename: 'ProgressionDataPoint', index: 5, intervalType: IntervalType.Day, value: 12500 },
  { __typename: 'ProgressionDataPoint', index: 6, intervalType: IntervalType.Day, value: 0 },
];

export const MOCK_PROGRESSION_DATA_MONTH: ProgressionDataPoint[] = [
  { __typename: 'ProgressionDataPoint', index: 1, intervalType: IntervalType.Week, value: 28500 },
  { __typename: 'ProgressionDataPoint', index: 2, intervalType: IntervalType.Week, value: 32100 },
  { __typename: 'ProgressionDataPoint', index: 3, intervalType: IntervalType.Week, value: 18900 },
  { __typename: 'ProgressionDataPoint', index: 4, intervalType: IntervalType.Week, value: 42500 },
];

export const MOCK_PROGRESSION_DATA_YEAR: ProgressionDataPoint[] = [
  { __typename: 'ProgressionDataPoint', index: 0, intervalType: IntervalType.Month, value: 95000 },
  { __typename: 'ProgressionDataPoint', index: 1, intervalType: IntervalType.Month, value: 88000 },
  { __typename: 'ProgressionDataPoint', index: 2, intervalType: IntervalType.Month, value: 102000 },
  { __typename: 'ProgressionDataPoint', index: 3, intervalType: IntervalType.Month, value: 115000 },
  { __typename: 'ProgressionDataPoint', index: 4, intervalType: IntervalType.Month, value: 98000 },
  { __typename: 'ProgressionDataPoint', index: 5, intervalType: IntervalType.Month, value: 78000 },
  { __typename: 'ProgressionDataPoint', index: 6, intervalType: IntervalType.Month, value: 92000 },
  { __typename: 'ProgressionDataPoint', index: 7, intervalType: IntervalType.Month, value: 105000 },
  { __typename: 'ProgressionDataPoint', index: 8, intervalType: IntervalType.Month, value: 118000 },
  { __typename: 'ProgressionDataPoint', index: 9, intervalType: IntervalType.Month, value: 125000 },
  { __typename: 'ProgressionDataPoint', index: 10, intervalType: IntervalType.Month, value: 110000 },
  { __typename: 'ProgressionDataPoint', index: 11, intervalType: IntervalType.Month, value: 95000 },
];

export const MOCK_SPORT_AVERAGE_METRICS: Record<SportType, SportAverageMetrics> = {
  [SportType.Run]: {
    __typename: 'SportAverageMetrics',
    averagePace: 330,
    averageSpeed: null,
    averageHeartRate: 152,
    averageCadence: 178,
    averagePower: null,
  },
  [SportType.Ride]: {
    __typename: 'SportAverageMetrics',
    averagePace: null,
    averageSpeed: 8.5,
    averageHeartRate: 145,
    averageCadence: 85,
    averagePower: 210,
  },
  [SportType.Swim]: {
    __typename: 'SportAverageMetrics',
    averagePace: 120,
    averageSpeed: null,
    averageHeartRate: 138,
    averageCadence: 32,
    averagePower: null,
  },
};

export const MOCK_PERSONAL_RECORDS: Record<SportType, PersonalRecord[]> = {
  [SportType.Run]: [
    {
      __typename: 'PersonalRecord',
      type: 'longest_distance',
      value: 21097,
      achievedAt: new Date('2025-01-15T08:30:00Z'),
      activityId: '12345678901',
    },
    {
      __typename: 'PersonalRecord',
      type: 'best_pace_5k',
      value: 285,
      achievedAt: new Date('2025-01-10T07:00:00Z'),
      activityId: '12345678902',
    },
    {
      __typename: 'PersonalRecord',
      type: 'longest_duration',
      value: 7200,
      achievedAt: new Date('2025-01-15T08:30:00Z'),
      activityId: '12345678901',
    },
  ],
  [SportType.Ride]: [
    {
      __typename: 'PersonalRecord',
      type: 'longest_distance',
      value: 102500,
      achievedAt: new Date('2024-12-20T06:00:00Z'),
      activityId: '12345678903',
    },
    {
      __typename: 'PersonalRecord',
      type: 'highest_elevation',
      value: 1850,
      achievedAt: new Date('2024-11-15T07:30:00Z'),
      activityId: '12345678904',
    },
    {
      __typename: 'PersonalRecord',
      type: 'best_average_speed',
      value: 12.5,
      achievedAt: new Date('2025-01-05T09:00:00Z'),
      activityId: '12345678905',
    },
  ],
  [SportType.Swim]: [
    {
      __typename: 'PersonalRecord',
      type: 'longest_distance',
      value: 2500,
      achievedAt: new Date('2025-01-08T12:00:00Z'),
      activityId: '12345678906',
    },
    {
      __typename: 'PersonalRecord',
      type: 'best_pace_1k',
      value: 95,
      achievedAt: new Date('2024-12-28T11:30:00Z'),
      activityId: '12345678907',
    },
  ],
};

export function getProgressionDataForPeriod(period: StatisticsPeriod): ProgressionDataPoint[] {
  switch (period) {
    case StatisticsPeriod.Week:
      return MOCK_PROGRESSION_DATA_WEEK;
    case StatisticsPeriod.Month:
      return MOCK_PROGRESSION_DATA_MONTH;
    case StatisticsPeriod.Year:
      return MOCK_PROGRESSION_DATA_YEAR;
    default:
      return MOCK_PROGRESSION_DATA_MONTH;
  }
}
