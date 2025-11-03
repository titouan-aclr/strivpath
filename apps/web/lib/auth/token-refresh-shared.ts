import { CombinedGraphQLErrors } from '@apollo/client/errors';

export interface RefreshTokenResponse {
  data?: {
    refreshToken?: {
      user: {
        id: string;
      };
    };
  };
  errors?: unknown[];
}

export const isUnauthenticatedError = (error: unknown): boolean => {
  if (!CombinedGraphQLErrors.is(error)) {
    return false;
  }

  return error.errors.some(
    err => err.extensions?.code === 'UNAUTHENTICATED' || err.message?.includes('UNAUTHENTICATED'),
  );
};

export const isRefreshTokenOperation = (operationName?: string): boolean => {
  return operationName === 'RefreshToken';
};

export const isValidRefreshResponse = (value: unknown): value is RefreshTokenResponse => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const response = value as Record<string, unknown>;

  if ('errors' in response) {
    return false;
  }

  if (!('data' in response) || typeof response.data !== 'object' || !response.data) {
    return false;
  }

  const data = response.data as Record<string, unknown>;
  return 'refreshToken' in data && typeof data.refreshToken === 'object' && data.refreshToken !== null;
};
