import { Test, TestingModule } from '@nestjs/testing';
import { UserResolver } from './user.resolver';
import { UserService } from './user.service';
import { AuthService } from '../auth/auth.service';
import { AuthCookieService } from '../auth/auth-cookie.service';
import { TokenPayload } from '../auth/types';
import { GraphQLContext } from '../common/types';
import { Response } from 'express';

describe('UserResolver', () => {
  let resolver: UserResolver;
  let userService: UserService;
  let authService: AuthService;
  let authCookieService: AuthCookieService;

  const mockUserService = {
    deleteUserData: jest.fn(),
    deleteAccount: jest.fn(),
  };

  const mockAuthService = {
    revokeAllUserRefreshTokens: jest.fn(),
  };

  const mockAuthCookieService = {
    clearAllAuthCookies: jest.fn(),
  };

  const mockTokenPayload: TokenPayload = {
    sub: 1,
    stravaId: 12345,
  };

  const mockResponse = {
    cookie: jest.fn(),
    clearCookie: jest.fn(),
  } as unknown as Response;

  const mockContext: GraphQLContext = {
    req: {} as any,
    res: mockResponse,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserResolver,
        { provide: UserService, useValue: mockUserService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: AuthCookieService, useValue: mockAuthCookieService },
      ],
    }).compile();

    resolver = module.get<UserResolver>(UserResolver);
    userService = module.get<UserService>(UserService);
    authService = module.get<AuthService>(AuthService);
    authCookieService = module.get<AuthCookieService>(AuthCookieService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('deleteUserData', () => {
    it('should delete user data and return true', async () => {
      mockUserService.deleteUserData.mockResolvedValue(true);

      const result = await resolver.deleteUserData(mockTokenPayload);

      expect(result).toBe(true);
      expect(userService.deleteUserData).toHaveBeenCalledWith(mockTokenPayload.sub);
    });

    it('should use userId from token payload', async () => {
      const differentTokenPayload: TokenPayload = {
        sub: 42,
        stravaId: 99999,
      };

      mockUserService.deleteUserData.mockResolvedValue(true);

      await resolver.deleteUserData(differentTokenPayload);

      expect(userService.deleteUserData).toHaveBeenCalledWith(42);
    });
  });

  describe('deleteAccount', () => {
    it('should revoke tokens, clear cookies, and delete account', async () => {
      mockAuthService.revokeAllUserRefreshTokens.mockResolvedValue(undefined);
      mockUserService.deleteAccount.mockResolvedValue(true);

      const result = await resolver.deleteAccount(mockTokenPayload, mockContext);

      expect(result).toBe(true);
      expect(authService.revokeAllUserRefreshTokens).toHaveBeenCalledWith(mockTokenPayload.sub);
      expect(authCookieService.clearAllAuthCookies).toHaveBeenCalledWith(mockContext.res);
      expect(userService.deleteAccount).toHaveBeenCalledWith(mockTokenPayload.sub);
    });

    it('should execute operations in correct order', async () => {
      const callOrder: string[] = [];

      mockAuthService.revokeAllUserRefreshTokens.mockImplementation(async () => {
        callOrder.push('revokeTokens');
      });
      mockAuthCookieService.clearAllAuthCookies.mockImplementation(() => {
        callOrder.push('clearCookies');
      });
      mockUserService.deleteAccount.mockImplementation(async () => {
        callOrder.push('deleteAccount');
        return true;
      });

      await resolver.deleteAccount(mockTokenPayload, mockContext);

      expect(callOrder).toEqual(['revokeTokens', 'clearCookies', 'deleteAccount']);
    });

    it('should use userId from token payload', async () => {
      const differentTokenPayload: TokenPayload = {
        sub: 42,
        stravaId: 99999,
      };

      mockAuthService.revokeAllUserRefreshTokens.mockResolvedValue(undefined);
      mockUserService.deleteAccount.mockResolvedValue(true);

      await resolver.deleteAccount(differentTokenPayload, mockContext);

      expect(authService.revokeAllUserRefreshTokens).toHaveBeenCalledWith(42);
      expect(userService.deleteAccount).toHaveBeenCalledWith(42);
    });
  });
});
