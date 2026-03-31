import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { GqlAuthGuard } from './gql-auth.guard';
import '../../common/types/express-request.interface';

describe('GqlAuthGuard', () => {
  let guard: GqlAuthGuard;

  beforeEach(() => {
    guard = new GqlAuthGuard();
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should extract request from GraphQL context', () => {
    const mockRequest = {
      headers: {
        authorization: 'Bearer token123',
      },
      user: {
        sub: 1,
        stravaId: 12345,
      },
    };

    const mockGqlContext = {
      req: mockRequest,
    };

    const mockExecutionContext = {
      getType: jest.fn().mockReturnValue('graphql'),
      getArgs: jest.fn(),
      getArgByIndex: jest.fn(),
      switchToHttp: jest.fn(),
      switchToRpc: jest.fn(),
      switchToWs: jest.fn(),
      getClass: jest.fn(),
      getHandler: jest.fn(),
    } as unknown as ExecutionContext;

    jest.spyOn(GqlExecutionContext, 'create').mockReturnValue({
      getContext: jest.fn().mockReturnValue(mockGqlContext),
      getArgs: jest.fn(),
      getInfo: jest.fn(),
      getType: jest.fn(),
      getClass: jest.fn(),
      getHandler: jest.fn(),
    } as any);

    const result = guard.getRequest(mockExecutionContext);

    expect(result).toBe(mockRequest);
    expect(GqlExecutionContext.create).toHaveBeenCalledWith(mockExecutionContext);
  });

  it('should extract request without user when not authenticated', () => {
    const mockRequest = {
      headers: {},
    };

    const mockGqlContext = {
      req: mockRequest,
    };

    const mockExecutionContext = {
      getType: jest.fn().mockReturnValue('graphql'),
      getArgs: jest.fn(),
      getArgByIndex: jest.fn(),
      switchToHttp: jest.fn(),
      switchToRpc: jest.fn(),
      switchToWs: jest.fn(),
      getClass: jest.fn(),
      getHandler: jest.fn(),
    } as unknown as ExecutionContext;

    jest.spyOn(GqlExecutionContext, 'create').mockReturnValue({
      getContext: jest.fn().mockReturnValue(mockGqlContext),
      getArgs: jest.fn(),
      getInfo: jest.fn(),
      getType: jest.fn(),
      getClass: jest.fn(),
      getHandler: jest.fn(),
    } as any);

    const result = guard.getRequest(mockExecutionContext);

    expect(result).toBe(mockRequest);
    expect((result as any).user).toBeUndefined();
  });

  it('should handle request with authenticated user', () => {
    const mockUser = {
      sub: 42,
      stravaId: 99999,
    };

    const mockRequest = {
      headers: {
        authorization: 'Bearer valid-token',
      },
      user: mockUser,
    };

    const mockGqlContext = {
      req: mockRequest,
    };

    const mockExecutionContext = {
      getType: jest.fn().mockReturnValue('graphql'),
      getArgs: jest.fn(),
      getArgByIndex: jest.fn(),
      switchToHttp: jest.fn(),
      switchToRpc: jest.fn(),
      switchToWs: jest.fn(),
      getClass: jest.fn(),
      getHandler: jest.fn(),
    } as unknown as ExecutionContext;

    jest.spyOn(GqlExecutionContext, 'create').mockReturnValue({
      getContext: jest.fn().mockReturnValue(mockGqlContext),
      getArgs: jest.fn(),
      getInfo: jest.fn(),
      getType: jest.fn(),
      getClass: jest.fn(),
      getHandler: jest.fn(),
    } as any);

    const result = guard.getRequest(mockExecutionContext);

    expect(result).toBe(mockRequest);
    expect((result as any).user).toEqual(mockUser);
  });

  it('should correctly transform execution context to GraphQL context', () => {
    const mockExecutionContext = {
      getType: jest.fn().mockReturnValue('graphql'),
      getArgs: jest.fn(),
      getArgByIndex: jest.fn(),
      switchToHttp: jest.fn(),
      switchToRpc: jest.fn(),
      switchToWs: jest.fn(),
      getClass: jest.fn(),
      getHandler: jest.fn(),
    } as unknown as ExecutionContext;

    const mockGqlContextInstance = {
      getContext: jest.fn().mockReturnValue({ req: {} }),
      getArgs: jest.fn(),
      getInfo: jest.fn(),
      getType: jest.fn(),
      getClass: jest.fn(),
      getHandler: jest.fn(),
    };

    const createSpy = jest.spyOn(GqlExecutionContext, 'create').mockReturnValue(mockGqlContextInstance as any);

    guard.getRequest(mockExecutionContext);

    expect(createSpy).toHaveBeenCalledWith(mockExecutionContext);
    expect(mockGqlContextInstance.getContext).toHaveBeenCalled();
  });

  describe('handleRequest', () => {
    it('should return the user when authentication succeeds', () => {
      const mockUser = { sub: 1, stravaId: 12345 };

      const result = guard.handleRequest(null, mockUser, null);

      expect(result).toBe(mockUser);
    });

    it('should throw UnauthorizedException when no user is provided', () => {
      expect(() => guard.handleRequest(null, false, null)).toThrow(UnauthorizedException);
    });

    it('should throw the original error when err is provided', () => {
      const originalError = new Error('Token expired');

      expect(() => guard.handleRequest(originalError, false, null)).toThrow('Token expired');
    });

    it('should throw the original error even when user exists', () => {
      const originalError = new Error('Invalid token');
      const mockUser = { sub: 1, stravaId: 12345 };

      expect(() => guard.handleRequest(originalError, mockUser, null)).toThrow('Invalid token');
    });
  });

  it('should extract request from nested GraphQL context structure', () => {
    const expectedRequest = {
      url: '/graphql',
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: 'Bearer token',
      },
      body: {
        query: 'query { user { id } }',
      },
    };

    const mockGqlContext = {
      req: expectedRequest,
    };

    const mockExecutionContext = {
      getType: jest.fn().mockReturnValue('graphql'),
      getArgs: jest.fn(),
      getArgByIndex: jest.fn(),
      switchToHttp: jest.fn(),
      switchToRpc: jest.fn(),
      switchToWs: jest.fn(),
      getClass: jest.fn(),
      getHandler: jest.fn(),
    } as unknown as ExecutionContext;

    jest.spyOn(GqlExecutionContext, 'create').mockReturnValue({
      getContext: jest.fn().mockReturnValue(mockGqlContext),
      getArgs: jest.fn(),
      getInfo: jest.fn(),
      getType: jest.fn(),
      getClass: jest.fn(),
      getHandler: jest.fn(),
    } as any);

    const result = guard.getRequest(mockExecutionContext);

    expect(result).toBe(expectedRequest);
    expect((result as any).url).toBe('/graphql');
    expect((result as any).method).toBe('POST');
    expect((result as any).headers.authorization).toBe('Bearer token');
  });
});
