import { GoalStatus, GoalTargetType, GoalPeriodType, SportType } from '@/gql/graphql';
import type { GoalCardFragment, GoalDetailFragment, GoalTemplateInfoFragment } from '@/gql/graphql';

export const MOCK_GOAL_CARD_RUN_50K: GoalCardFragment = {
  __typename: 'Goal',
  id: '1',
  title: 'Courir 50km ce mois',
  description: 'Objectif mensuel de running',
  targetType: GoalTargetType.Distance,
  targetValue: 50,
  periodType: GoalPeriodType.Monthly,
  startDate: new Date('2025-01-01'),
  endDate: new Date('2025-01-31'),
  isRecurring: false,
  sportType: SportType.Run,
  status: GoalStatus.Active,
  currentValue: 23.5,
  progressPercentage: 47,
  isExpired: false,
  daysRemaining: 15,
  createdAt: new Date('2025-01-01'),
} as GoalCardFragment;

export const MOCK_GOAL_DETAIL_RUN_50K: GoalDetailFragment = {
  ...MOCK_GOAL_CARD_RUN_50K,
  userId: 1,
  templateId: null,
  recurrenceEndDate: null,
  completedAt: null,
  updatedAt: new Date('2025-01-15'),
} as GoalDetailFragment;

export const MOCK_GOAL_COMPLETED: GoalCardFragment = {
  __typename: 'Goal',
  id: '2',
  title: 'Rouler 100km cette semaine',
  description: null,
  targetType: GoalTargetType.Distance,
  targetValue: 100,
  periodType: GoalPeriodType.Weekly,
  startDate: new Date('2025-01-06'),
  endDate: new Date('2025-01-12'),
  isRecurring: true,
  sportType: SportType.Ride,
  status: GoalStatus.Completed,
  currentValue: 112.3,
  progressPercentage: 112,
  isExpired: false,
  daysRemaining: 0,
  createdAt: new Date('2025-01-06'),
} as GoalCardFragment;

export const MOCK_GOAL_FAILED: GoalCardFragment = {
  __typename: 'Goal',
  id: '3',
  title: 'Nager 5km ce mois',
  description: 'Challenge natation',
  targetType: GoalTargetType.Distance,
  targetValue: 5,
  periodType: GoalPeriodType.Monthly,
  startDate: new Date('2024-12-01'),
  endDate: new Date('2024-12-31'),
  isRecurring: false,
  sportType: SportType.Swim,
  status: GoalStatus.Failed,
  currentValue: 3.2,
  progressPercentage: 64,
  isExpired: true,
  daysRemaining: 0,
  createdAt: new Date('2024-12-01'),
} as GoalCardFragment;

export const MOCK_TEMPLATE_BEGINNER_10K: GoalTemplateInfoFragment = {
  __typename: 'GoalTemplate',
  id: '1',
  title: 'Courir 10km ce mois',
  description: 'Objectif idéal pour débutants',
  category: 'beginner',
  targetType: GoalTargetType.Distance,
  targetValue: 10,
  periodType: GoalPeriodType.Monthly,
  sportType: SportType.Run,
  isPreset: true,
  createdAt: new Date('2024-01-01'),
} as GoalTemplateInfoFragment;

export const MOCK_TEMPLATE_CHALLENGE_EVEREST: GoalTemplateInfoFragment = {
  __typename: 'GoalTemplate',
  id: '10',
  title: 'Everest Challenge (8848m D+)',
  description: "Gravir l'équivalent de l'Everest en dénivelé",
  category: 'challenge',
  targetType: GoalTargetType.Elevation,
  targetValue: 8848,
  periodType: GoalPeriodType.Yearly,
  sportType: null,
  isPreset: true,
  createdAt: new Date('2024-01-01'),
} as GoalTemplateInfoFragment;

export const MOCK_TEMPLATE_INTERMEDIATE_FREQUENCY: GoalTemplateInfoFragment = {
  __typename: 'GoalTemplate',
  id: '5',
  title: '3 sorties par semaine',
  description: "Maintenir une régularité d'entraînement",
  category: 'intermediate',
  targetType: GoalTargetType.Frequency,
  targetValue: 3,
  periodType: GoalPeriodType.Weekly,
  sportType: null,
  isPreset: true,
  createdAt: new Date('2024-01-01'),
} as GoalTemplateInfoFragment;

export const MOCK_GOALS_ARRAY: GoalCardFragment[] = [MOCK_GOAL_CARD_RUN_50K, MOCK_GOAL_COMPLETED, MOCK_GOAL_FAILED];

export const MOCK_TEMPLATES_ARRAY: GoalTemplateInfoFragment[] = [
  MOCK_TEMPLATE_BEGINNER_10K,
  MOCK_TEMPLATE_INTERMEDIATE_FREQUENCY,
  MOCK_TEMPLATE_CHALLENGE_EVEREST,
];
