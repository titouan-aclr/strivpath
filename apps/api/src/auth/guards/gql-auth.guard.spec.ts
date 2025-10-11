import { ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { GqlAuthGuard } from './gql-auth.guard';

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
    expect(result.user).toBeUndefined();
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
    expect(result.user).toEqual(mockUser);
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
    expect(result.url).toBe('/graphql');
    expect(result.method).toBe('POST');
    expect(result.headers.authorization).toBe('Bearer token');
  });
});
