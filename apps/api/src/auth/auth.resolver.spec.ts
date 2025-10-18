import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { AuthResolver } from './auth.resolver';
import { AuthService } from './auth.service';
import { AuthCookieService } from './auth-cookie.service';
import { UserService } from '../user/user.service';
import { User } from '@repo/graphql-types';
import { Response, Request } from 'express';
import { GraphQLContext } from '../common/types';

describe('AuthResolver', () => {
  let resolver: AuthResolver;
  let authService: AuthService;
  let authCookieService: AuthCookieService;
  let userService: UserService;
  let configService: ConfigService;

  const mockAuthService = {
    refreshAccessToken: jest.fn(),
    revokeRefreshToken: jest.fn(),
  };

  const mockAuthCookieService = {
    setAccessTokenCookie: jest.fn(),
    setRefreshTokenCookie: jest.fn(),
    clearAccessTokenCookie: jest.fn(),
    clearRefreshTokenCookie: jest.fn(),
    clearAllAuthCookies: jest.fn(),
  };

  const mockUserService = {
    findById: jest.fn(),
  };

  const mockConfigService = {
    getOrThrow: jest.fn(),
    get: jest.fn(),
  };

  const mockUser: User = {
    id: 1,
    stravaId: 12345,
    username: 'testuser',
    firstname: 'Test',
    lastname: 'User',
    sex: 'M',
    city: 'Paris',
    country: 'France',
    profile: 'https://example.com/profile.jpg',
    profileMedium: 'https://example.com/profile-medium.jpg',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockResponse = {
    cookie: jest.fn(),
    clearCookie: jest.fn(),
  } as unknown as Response;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthResolver,
        { provide: AuthService, useValue: mockAuthService },
        { provide: AuthCookieService, useValue: mockAuthCookieService },
        { provide: UserService, useValue: mockUserService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    resolver = module.get<AuthResolver>(AuthResolver);
    authService = module.get<AuthService>(AuthService);
    authCookieService = module.get<AuthCookieService>(AuthCookieService);
    userService = module.get<UserService>(UserService);
    configService = module.get<ConfigService>(ConfigService);

    jest.clearAllMocks();
  });

  describe('stravaAuthUrl', () => {
    it('should return Strava OAuth URL', () => {
      mockConfigService.getOrThrow.mockReturnValueOnce('test-client-id');
      mockConfigService.getOrThrow.mockReturnValueOnce('http://localhost:3000/auth/callback');

      const result = resolver.stravaAuthUrl();

      expect(result).toContain('https://www.strava.com/oauth/authorize');
      expect(result).toContain('client_id=test-client-id');
      expect(result).toContain('redirect_uri=http://localhost:3000/auth/callback');
      expect(result).toContain('scope=read_all,activity:read_all,profile:read_all');
    });
  });

  describe('currentUser', () => {
    it('should return current user when authenticated', async () => {
      const tokenPayload = { sub: 1, stravaId: 12345 };
      mockUserService.findById.mockResolvedValue(mockUser);

      const result = await resolver.currentUser(tokenPayload);

      expect(result).toEqual(mockUser);
      expect(userService.findById).toHaveBeenCalledWith(1);
    });

    it('should return null when user not found', async () => {
      const tokenPayload = { sub: 999, stravaId: 99999 };
      mockUserService.findById.mockResolvedValue(null);

      const result = await resolver.currentUser(tokenPayload);

      expect(result).toBeNull();
    });
  });

  describe('refreshToken', () => {
    it('should refresh token and update cookies', async () => {
      const mockRefreshToken = 'old-refresh-token';
      const mockNewAccessToken = 'new-access-token';
      const mockNewRefreshToken = 'new-refresh-token';

      const mockContext: GraphQLContext = {
        req: {
          cookies: { RefreshToken: mockRefreshToken },
        } as Request,
        res: mockResponse,
      };

      mockAuthService.refreshAccessToken.mockResolvedValue({
        accessToken: mockNewAccessToken,
        refreshToken: mockNewRefreshToken,
        user: mockUser,
      });

      const result = await resolver.refreshToken(mockContext);

      expect(result).toEqual({ user: mockUser });
      expect(authService.refreshAccessToken).toHaveBeenCalledWith(mockRefreshToken);
      expect(authCookieService.setAccessTokenCookie).toHaveBeenCalledWith(mockResponse, mockNewAccessToken);
      expect(authCookieService.setRefreshTokenCookie).toHaveBeenCalledWith(mockResponse, mockNewRefreshToken);
    });

    it('should throw UnauthorizedException when refresh token cookie missing', async () => {
      const mockContext: GraphQLContext = {
        req: {
          cookies: {},
        } as Request,
        res: mockResponse,
      };

      await expect(resolver.refreshToken(mockContext)).rejects.toThrow(UnauthorizedException);
      await expect(resolver.refreshToken(mockContext)).rejects.toThrow('No refresh token provided');
      expect(authService.refreshAccessToken).not.toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('should revoke token and clear cookies when refresh token present', async () => {
      const mockRefreshToken = 'test-refresh-token';

      const mockContext: GraphQLContext = {
        req: {
          cookies: { RefreshToken: mockRefreshToken },
        } as Request,
        res: mockResponse,
      };

      mockAuthService.revokeRefreshToken.mockResolvedValue(undefined);

      const result = await resolver.logout(mockContext);

      expect(result).toBe(true);
      expect(authService.revokeRefreshToken).toHaveBeenCalledWith(mockRefreshToken);
      expect(authCookieService.clearAllAuthCookies).toHaveBeenCalledWith(mockResponse);
    });

    it('should clear cookies even when refresh token missing', async () => {
      const mockContext: GraphQLContext = {
        req: {
          cookies: {},
        } as Request,
        res: mockResponse,
      };

      const result = await resolver.logout(mockContext);

      expect(result).toBe(true);
      expect(authService.revokeRefreshToken).not.toHaveBeenCalled();
      expect(authCookieService.clearAllAuthCookies).toHaveBeenCalledWith(mockResponse);
    });
  });
});
