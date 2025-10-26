import { ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { TokenPayload } from '../types';

const mockDecorator = (data: unknown, context: ExecutionContext): TokenPayload => {
  const ctx = GqlExecutionContext.create(context);
  return ctx.getContext<{ req: { user: TokenPayload } }>().req.user;
};

describe('CurrentUser Decorator', () => {
  it('should extract user payload from GraphQL request context', () => {
    const mockUser: TokenPayload = {
      sub: 1,
      stravaId: 12345,
    };

    const mockRequest = {
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

    const result = mockDecorator(undefined, mockExecutionContext);

    expect(result).toEqual(mockUser);
    expect(result.sub).toBe(1);
    expect(result.stravaId).toBe(12345);
  });

  it('should return undefined when no user in request', () => {
    const mockRequest = {};

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

    const result = mockDecorator(undefined, mockExecutionContext);

    expect(result).toBeUndefined();
  });

  it('should extract user with different stravaId values', () => {
    const testCases = [
      { sub: 1, stravaId: 123 },
      { sub: 2, stravaId: 999999 },
      { sub: 10, stravaId: 456789 },
      { sub: 100, stravaId: 111111 },
    ];

    testCases.forEach(mockUser => {
      const mockRequest = { user: mockUser };
      const mockGqlContext = { req: mockRequest };
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

      const result = mockDecorator(undefined, mockExecutionContext);

      expect(result).toEqual(mockUser);
    });
  });

  it('should work with GraphQL context', () => {
    const mockUser: TokenPayload = {
      sub: 42,
      stravaId: 67890,
    };

    const mockGqlContext = {
      req: {
        user: mockUser,
        headers: {
          authorization: 'Bearer token123',
        },
      },
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

    const createSpy = jest.spyOn(GqlExecutionContext, 'create').mockReturnValue({
      getContext: jest.fn().mockReturnValue(mockGqlContext),
      getArgs: jest.fn(),
      getInfo: jest.fn(),
      getType: jest.fn(),
      getClass: jest.fn(),
      getHandler: jest.fn(),
    } as any);

    const result = mockDecorator(undefined, mockExecutionContext);

    expect(result).toEqual(mockUser);
    expect(createSpy).toHaveBeenCalledWith(mockExecutionContext);
  });

  it('should handle request with only user property', () => {
    const mockUser: TokenPayload = {
      sub: 5,
      stravaId: 54321,
    };

    const mockRequest = {
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

    const result = mockDecorator(undefined, mockExecutionContext);

    expect(result).toBeDefined();
    expect(result.sub).toBe(5);
    expect(result.stravaId).toBe(54321);
  });

  it('should correctly transform execution context to GraphQL context', () => {
    const mockUser: TokenPayload = {
      sub: 99,
      stravaId: 88888,
    };

    const mockGqlContext = {
      req: { user: mockUser },
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

    const mockGqlContextInstance = {
      getContext: jest.fn().mockReturnValue(mockGqlContext),
      getArgs: jest.fn(),
      getInfo: jest.fn(),
      getType: jest.fn(),
      getClass: jest.fn(),
      getHandler: jest.fn(),
    };

    const createSpy = jest.spyOn(GqlExecutionContext, 'create').mockReturnValue(mockGqlContextInstance as any);

    mockDecorator(undefined, mockExecutionContext);

    expect(createSpy).toHaveBeenCalledWith(mockExecutionContext);
    expect(mockGqlContextInstance.getContext).toHaveBeenCalled();
  });
});
