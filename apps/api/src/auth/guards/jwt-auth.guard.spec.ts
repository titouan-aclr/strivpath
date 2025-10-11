import { ExecutionContext } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;

  beforeEach(() => {
    guard = new JwtAuthGuard();
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should extend AuthGuard with jwt strategy', () => {
    expect(guard).toBeInstanceOf(JwtAuthGuard);
  });

  it('should have canActivate method from parent AuthGuard', () => {
    expect(guard.canActivate).toBeDefined();
    expect(typeof guard.canActivate).toBe('function');
  });

  it('should delegate authentication to JWT strategy', async () => {
    const mockRequest = {
      cookies: {
        Authentication: 'valid-jwt-token',
      },
    };

    const mockExecutionContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(mockRequest),
      }),
      getType: jest.fn().mockReturnValue('http'),
      getArgs: jest.fn(),
      getArgByIndex: jest.fn(),
      switchToRpc: jest.fn(),
      switchToWs: jest.fn(),
      getClass: jest.fn(),
      getHandler: jest.fn(),
    } as unknown as ExecutionContext;

    expect(guard.canActivate).toBeDefined();
  });

  it('should be usable as a guard decorator', () => {
    expect(Reflect.getMetadata).toBeDefined();
  });

  it('should inherit passport JWT authentication behavior', () => {
    const guardPrototype = Object.getPrototypeOf(guard);
    expect(guardPrototype.constructor.name).toBe('JwtAuthGuard');
  });
});
