import { describe, it, expect } from 'vitest';
import { CombinedGraphQLErrors } from '@apollo/client/errors';
import { GraphQLError } from 'graphql';
import {
  isUnauthenticatedError,
  isRefreshTokenOperation,
  isValidRefreshResponse,
  type RefreshTokenResponse,
} from './token-refresh-shared';

describe('token-refresh-shared', () => {
  describe('isUnauthenticatedError', () => {
    it('should return true for UNAUTHENTICATED error code', () => {
      const graphQLError = new GraphQLError('Unauthorized', {
        extensions: { code: 'UNAUTHENTICATED' },
      });
      const combinedError = new CombinedGraphQLErrors({
        errors: [graphQLError],
      });

      expect(isUnauthenticatedError(combinedError)).toBe(true);
    });

    it('should return true for error message containing UNAUTHENTICATED', () => {
      const graphQLError = new GraphQLError('UNAUTHENTICATED: Invalid token');
      const combinedError = new CombinedGraphQLErrors({
        errors: [graphQLError],
      });

      expect(isUnauthenticatedError(combinedError)).toBe(true);
    });

    it('should return false for non-UNAUTHENTICATED errors', () => {
      const graphQLError = new GraphQLError('Internal server error', {
        extensions: { code: 'INTERNAL_SERVER_ERROR' },
      });
      const combinedError = new CombinedGraphQLErrors({
        errors: [graphQLError],
      });

      expect(isUnauthenticatedError(combinedError)).toBe(false);
    });

    it('should return false for non-GraphQL errors', () => {
      const regularError = new Error('Network error');

      expect(isUnauthenticatedError(regularError)).toBe(false);
    });

    it('should return false for null or undefined', () => {
      expect(isUnauthenticatedError(null)).toBe(false);
      expect(isUnauthenticatedError(undefined)).toBe(false);
    });
  });

  describe('isRefreshTokenOperation', () => {
    it('should return true for RefreshToken operation', () => {
      expect(isRefreshTokenOperation('RefreshToken')).toBe(true);
    });

    it('should return false for other operations', () => {
      expect(isRefreshTokenOperation('CurrentUser')).toBe(false);
      expect(isRefreshTokenOperation('Logout')).toBe(false);
      expect(isRefreshTokenOperation('Login')).toBe(false);
    });

    it('should return false for undefined operation name', () => {
      expect(isRefreshTokenOperation(undefined)).toBe(false);
      expect(isRefreshTokenOperation('')).toBe(false);
    });
  });

  describe('isValidRefreshResponse', () => {
    it('should return true for valid refresh response', () => {
      const validResponse: RefreshTokenResponse = {
        data: {
          refreshToken: {
            user: {
              id: '123',
            },
          },
        },
      };

      expect(isValidRefreshResponse(validResponse)).toBe(true);
    });

    it('should return false for response with errors', () => {
      const responseWithErrors = {
        data: {
          refreshToken: {
            user: {
              id: '123',
            },
          },
        },
        errors: [{ message: 'Something went wrong' }],
      };

      expect(isValidRefreshResponse(responseWithErrors)).toBe(false);
    });

    it('should return false for response without data', () => {
      const responseWithoutData = {
        errors: [],
      };

      expect(isValidRefreshResponse(responseWithoutData)).toBe(false);
    });

    it('should return false for response with null data', () => {
      const responseWithNullData = {
        data: null,
      };

      expect(isValidRefreshResponse(responseWithNullData)).toBe(false);
    });

    it('should return false for response without refreshToken field', () => {
      const responseWithoutRefreshToken = {
        data: {
          someOtherField: 'value',
        },
      };

      expect(isValidRefreshResponse(responseWithoutRefreshToken)).toBe(false);
    });

    it('should return false for response with null refreshToken', () => {
      const responseWithNullRefreshToken = {
        data: {
          refreshToken: null,
        },
      };

      expect(isValidRefreshResponse(responseWithNullRefreshToken)).toBe(false);
    });

    it('should return false for non-object values', () => {
      expect(isValidRefreshResponse(null)).toBe(false);
      expect(isValidRefreshResponse(undefined)).toBe(false);
      expect(isValidRefreshResponse('string')).toBe(false);
      expect(isValidRefreshResponse(123)).toBe(false);
      expect(isValidRefreshResponse(true)).toBe(false);
    });

    it('should return false for empty object', () => {
      expect(isValidRefreshResponse({})).toBe(false);
    });
  });
});
