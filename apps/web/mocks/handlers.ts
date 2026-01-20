import { graphql, HttpResponse } from 'msw';
import { createMockUser, MOCK_USERS } from './fixtures/user.fixture';
import { MOCK_ACTIVITIES_ARRAY } from './fixtures/activity.fixture';
import { SportType, SyncStatus } from '@/gql/graphql';

function serializeActivity(activity: (typeof MOCK_ACTIVITIES_ARRAY)[number]) {
  return {
    ...activity,
    stravaId: activity.stravaId.toString(),
  };
}

export const handlers = [
  graphql.query('CurrentUser', () => {
    return HttpResponse.json({
      data: {
        currentUser: {
          __typename: 'User',
          ...createMockUser(),
        },
      },
    });
  }),

  graphql.mutation('RefreshToken', () => {
    return HttpResponse.json({
      data: {
        refreshToken: {
          __typename: 'AuthResponse',
          user: {
            __typename: 'User',
            ...createMockUser(),
          },
        },
      },
    });
  }),

  graphql.mutation('Logout', () => {
    return HttpResponse.json({
      data: {
        logout: true,
      },
    });
  }),

  graphql.mutation('UpdateUserPreferences', () => {
    return HttpResponse.json({
      data: {
        updateUserPreferences: {
          __typename: 'UserPreferences',
          id: '1',
          userId: 1,
          selectedSports: [SportType.Run, SportType.Ride],
          onboardingCompleted: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      },
    });
  }),

  graphql.mutation('SyncActivities', () => {
    return HttpResponse.json({
      data: {
        syncActivities: {
          __typename: 'SyncHistory',
          id: '1',
          userId: 1,
          status: SyncStatus.Pending,
          stage: null,
          totalActivities: 0,
          processedActivities: 0,
          errorMessage: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          startedAt: new Date().toISOString(),
          completedAt: null,
        },
      },
    });
  }),

  graphql.query('SyncStatus', () => {
    return HttpResponse.json({
      data: { syncStatus: null },
    });
  }),

  graphql.query('Activities', ({ variables }) => {
    const filter = variables.filter as
      | {
          offset?: number;
          limit?: number;
          type?: SportType;
          startDate?: string;
          endDate?: string;
          orderBy?: string;
          orderDirection?: string;
        }
      | undefined;

    let activities = [...MOCK_ACTIVITIES_ARRAY];

    if (filter?.type) {
      const filterType = filter.type as string;
      activities = activities.filter(a => a.type === filterType);
    }

    if (filter?.startDate) {
      const start = new Date(filter.startDate);
      activities = activities.filter(a => new Date(a.startDate) >= start);
    }
    if (filter?.endDate) {
      const end = new Date(filter.endDate);
      activities = activities.filter(a => new Date(a.startDate) <= end);
    }

    const orderBy = filter?.orderBy || 'DATE';
    const orderDirection = filter?.orderDirection || 'DESC';

    activities.sort((a, b) => {
      let comparison = 0;
      switch (orderBy) {
        case 'DATE':
          comparison = new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
          break;
        case 'DISTANCE':
          comparison = (a.distance || 0) - (b.distance || 0);
          break;
        case 'DURATION':
          comparison = (a.movingTime || 0) - (b.movingTime || 0);
          break;
      }
      return orderDirection === 'DESC' ? -comparison : comparison;
    });

    const offset = filter?.offset || 0;
    const limit = filter?.limit || 20;
    const paginatedActivities = activities.slice(offset, offset + limit);

    return HttpResponse.json({
      data: {
        activities: paginatedActivities.map(serializeActivity),
      },
    });
  }),
];

export const authErrorHandlers = {
  unauthenticated: graphql.query('CurrentUser', () => {
    return HttpResponse.json(
      {
        errors: [
          {
            message: 'Unauthorized',
            extensions: {
              code: 'UNAUTHENTICATED',
            },
          },
        ],
        data: null,
      },
      { status: 401 },
    );
  }),

  refreshTokenUnauthenticated: graphql.mutation('RefreshToken', () => {
    return HttpResponse.json(
      {
        errors: [
          {
            message: 'Invalid refresh token',
            extensions: {
              code: 'UNAUTHENTICATED',
            },
          },
        ],
        data: null,
      },
      { status: 401 },
    );
  }),

  networkError: graphql.query('CurrentUser', () => {
    return HttpResponse.error();
  }),

  internalServerError: graphql.query('CurrentUser', () => {
    return HttpResponse.json(
      {
        errors: [
          {
            message: 'Internal server error',
            extensions: {
              code: 'INTERNAL_SERVER_ERROR',
            },
          },
        ],
        data: null,
      },
      { status: 500 },
    );
  }),

  nullUser: graphql.query('CurrentUser', () => {
    return HttpResponse.json({
      data: {
        currentUser: null,
      },
    });
  }),

  refreshTokenExpired: graphql.mutation('RefreshToken', () => {
    return HttpResponse.json({
      errors: [
        {
          message: 'Refresh token expired',
          extensions: {
            code: 'TOKEN_EXPIRED',
          },
        },
      ],
      data: null,
    });
  }),

  refreshTokenReplayDetected: graphql.mutation('RefreshToken', () => {
    return HttpResponse.json({
      errors: [
        {
          message: 'Token replay detected - all sessions revoked',
          extensions: {
            code: 'TOKEN_REPLAY_DETECTED',
          },
        },
      ],
      data: null,
    });
  }),

  logoutFailed: graphql.mutation('Logout', () => {
    return HttpResponse.json({
      errors: [
        {
          message: 'Logout failed',
          extensions: {
            code: 'INTERNAL_SERVER_ERROR',
          },
        },
      ],
      data: null,
    });
  }),

  logoutNetworkError: graphql.mutation('Logout', () => {
    return HttpResponse.error();
  }),
};

export const onboardingErrorHandlers = {
  updatePreferencesNetworkError: graphql.mutation('UpdateUserPreferences', () => HttpResponse.error()),

  updatePreferencesTokenExpired: graphql.mutation('UpdateUserPreferences', () => {
    return HttpResponse.json(
      {
        errors: [
          {
            message: 'Strava refresh token expired',
            extensions: { code: 'STRAVA_REFRESH_TOKEN_EXPIRED' },
          },
        ],
        data: null,
      },
      { status: 401 },
    );
  }),

  updatePreferencesRateLimit: graphql.mutation('UpdateUserPreferences', () => {
    return HttpResponse.json(
      {
        errors: [
          {
            message: 'Too many requests',
            extensions: { code: 'RATE_LIMIT_EXCEEDED' },
          },
        ],
        data: null,
      },
      { status: 429 },
    );
  }),

  syncActivitiesFailed: graphql.mutation('SyncActivities', () => {
    return HttpResponse.json({
      errors: [
        {
          message: 'Failed to start sync',
          extensions: { code: 'SYNC_FAILED' },
        },
      ],
      data: null,
    });
  }),

  syncStatusNetworkError: graphql.query('SyncStatus', () => HttpResponse.error()),
};

export { MOCK_USERS };
