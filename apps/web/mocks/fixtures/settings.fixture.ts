import { SportType, type UserPreferencesInfoFragment, type SportDataCount } from '@/gql/graphql';

export const createMockUserPreferences = (
  overrides?: Partial<UserPreferencesInfoFragment>,
): UserPreferencesInfoFragment => {
  const now = new Date();

  return {
    __typename: 'UserPreferences',
    id: 1,
    selectedSports: [SportType.Run, SportType.Ride],
    onboardingCompleted: true,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
};

export const MOCK_USER_PREFERENCES = {
  default: createMockUserPreferences(),

  singleSport: createMockUserPreferences({
    selectedSports: [SportType.Run],
  }),

  allSports: createMockUserPreferences({
    selectedSports: [SportType.Run, SportType.Ride, SportType.Swim],
  }),

  onboardingNotCompleted: createMockUserPreferences({
    onboardingCompleted: false,
  }),
};

export const createMockSportDataCount = (overrides?: Partial<SportDataCount>): SportDataCount => {
  return {
    __typename: 'SportDataCount',
    activitiesCount: 42,
    goalsCount: 3,
    ...overrides,
  };
};

export const MOCK_SPORT_DATA_COUNTS = {
  withData: createMockSportDataCount(),

  empty: createMockSportDataCount({
    activitiesCount: 0,
    goalsCount: 0,
  }),

  manyActivities: createMockSportDataCount({
    activitiesCount: 150,
    goalsCount: 5,
  }),
};
