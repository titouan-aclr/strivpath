import { graphql, HttpResponse } from 'msw';
import { createMockUser, MOCK_USERS } from './fixtures/user.fixture';

export const handlers = [
  graphql.query('CurrentUser', () => {
    return HttpResponse.json({
      data: {
        currentUser: createMockUser(),
      },
    });
  }),

  graphql.mutation('RefreshToken', () => {
    return HttpResponse.json({
      data: {
        refreshToken: {
          user: createMockUser(),
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
];

export const authErrorHandlers = {
  unauthenticated: graphql.query('CurrentUser', () => {
    return HttpResponse.json({
      errors: [
        {
          message: 'Unauthorized',
          extensions: {
            code: 'UNAUTHENTICATED',
          },
        },
      ],
      data: null,
    });
  }),

  refreshTokenUnauthenticated: graphql.mutation('RefreshToken', () => {
    return HttpResponse.json({
      errors: [
        {
          message: 'Invalid refresh token',
          extensions: {
            code: 'UNAUTHENTICATED',
          },
        },
      ],
      data: null,
    });
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
};

export { MOCK_USERS };
