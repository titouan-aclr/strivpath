import { ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { UnifiedThrottlerGuard } from './throttler.guard';
import { Reflector } from '@nestjs/core';
import { ThrottlerStorageService } from '@nestjs/throttler';

describe('UnifiedThrottlerGuard', () => {
  let guard: UnifiedThrottlerGuard;
  let reflector: Reflector;
  let storageService: ThrottlerStorageService;

  beforeEach(() => {
    reflector = new Reflector();
    storageService = new ThrottlerStorageService();
    guard = new UnifiedThrottlerGuard([{ ttl: 60000, limit: 10, ignoreUserAgents: [] }], storageService, reflector);
  });

  describe('getRequestResponse', () => {
    it('should extract req/res from HTTP context', () => {
      const mockReq = { url: '/test', ip: '127.0.0.1' };
      const mockRes = { status: jest.fn() };

      const context = {
        getType: jest.fn().mockReturnValue('http'),
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: () => mockReq,
          getResponse: () => mockRes,
        }),
      } as unknown as ExecutionContext;

      const result = guard.getRequestResponse(context);

      expect(result.req).toBe(mockReq);
      expect(result.res).toBe(mockRes);
      expect(context.getType).toHaveBeenCalled();
    });

    it('should extract req/res from GraphQL context', () => {
      const mockReq = { body: { query: 'query { test }' }, ip: '127.0.0.1' };
      const mockRes = { json: jest.fn() };

      const gqlContext = { req: mockReq, res: mockRes };

      jest.spyOn(GqlExecutionContext, 'create').mockReturnValue({
        getContext: () => gqlContext,
      } as any);

      const context = {
        getType: jest.fn().mockReturnValue('graphql'),
      } as unknown as ExecutionContext;

      const result = guard.getRequestResponse(context);

      expect(result.req).toBe(mockReq);
      expect(result.res).toBe(mockRes);
      expect(context.getType).toHaveBeenCalled();
    });

    it('should handle GraphQL context correctly with GqlExecutionContext.create', () => {
      const mockReq = { headers: {}, ip: '192.168.1.1' };
      const mockRes = { setHeader: jest.fn() };

      const createSpy = jest.spyOn(GqlExecutionContext, 'create').mockReturnValue({
        getContext: () => ({ req: mockReq, res: mockRes }),
      } as any);

      const context = {
        getType: jest.fn().mockReturnValue('graphql'),
      } as unknown as ExecutionContext;

      const result = guard.getRequestResponse(context);

      expect(createSpy).toHaveBeenCalledWith(context);
      expect(result.req).toBe(mockReq);
      expect(result.res).toBe(mockRes);
    });
  });
});
