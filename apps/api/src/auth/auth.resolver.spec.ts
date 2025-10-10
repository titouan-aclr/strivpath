import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { AuthResolver } from './auth.resolver';
import { AuthService } from './auth.service';
import { StravaService } from '../strava/strava.service';
import { UserService } from '../user/user.service';
import { User } from '@repo/graphql-types';
import { StravaTokenResponse, StravaAthleteResponse } from '../strava/types';
import { Response } from 'express';

describe('AuthResolver', () => {
  let resolver: AuthResolver;
  let authService: AuthService;
  let stravaService: StravaService;
  let userService: UserService;
  let configService: ConfigService;

  const mockAuthService = {
    generateTokens: jest.fn(),
    refreshAccessToken: jest.fn(),
    revokeRefreshToken: jest.fn(),
  };

  const mockStravaService = {
    exchangeCodeForToken: jest.fn(),
  };

  const mockUserService = {
    upsertFromStrava: jest.fn(),
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
        { provide: StravaService, useValue: mockStravaService },
        { provide: UserService, useValue: mockUserService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    resolver = module.get<AuthResolver>(AuthResolver);
    authService = module.get<AuthService>(AuthService);
    stravaService = module.get<StravaService>(StravaService);
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
      expect(result).toContain('scope=read,activity:read_all,profile:read_all');
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

  describe('authenticateWithStrava', () => {
    it('should authenticate and set cookies', async () => {
      const mockCode = 'test-oauth-code';
      const mockAthleteResponse: StravaAthleteResponse = {
        id: 12345,
        username: 'testathlete',
        firstname: 'Test',
        lastname: 'Athlete',
      } as StravaAthleteResponse;

      const mockStravaTokens: StravaTokenResponse = {
        token_type: 'Bearer',
        expires_at: 1234567890,
        expires_in: 21600,
        refresh_token: 'strava-refresh',
        access_token: 'strava-access',
        athlete: mockAthleteResponse,
      };

      const mockJwtTokens = {
        accessToken: 'jwt-access-token',
        refreshToken: 'jwt-refresh-token',
      };

      mockStravaService.exchangeCodeForToken.mockResolvedValue(mockStravaTokens);
      mockUserService.upsertFromStrava.mockResolvedValue(mockUser);
      mockAuthService.generateTokens.mockResolvedValue(mockJwtTokens);
      mockConfigService.get.mockReturnValue('development');

      const result = await resolver.authenticateWithStrava({ code: mockCode }, { res: mockResponse });

      expect(result).toEqual({
        accessToken: mockJwtTokens.accessToken,
        refreshToken: mockJwtTokens.refreshToken,
        user: mockUser,
      });
      expect(stravaService.exchangeCodeForToken).toHaveBeenCalledWith(mockCode);
      expect(userService.upsertFromStrava).toHaveBeenCalledWith(mockAthleteResponse, mockStravaTokens);
      expect(authService.generateTokens).toHaveBeenCalledWith(mockUser);
      expect(mockResponse.cookie).toHaveBeenCalledTimes(1);
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'Authentication',
        mockJwtTokens.accessToken,
        expect.objectContaining({
          httpOnly: true,
          sameSite: 'strict',
        }),
      );
    });
  });

  describe('refreshToken', () => {
    it('should refresh token and update cookies', async () => {
      const mockRefreshToken = 'old-refresh-token';
      const mockNewTokens = {
        accessToken: 'new-access-token',
        refreshToken: 'old-refresh-token',
        user: mockUser,
      };

      mockAuthService.refreshAccessToken.mockResolvedValue(mockNewTokens);
      mockConfigService.get.mockReturnValue('development');

      const result = await resolver.refreshToken({ refreshToken: mockRefreshToken }, { res: mockResponse });

      expect(result).toEqual({
        accessToken: mockNewTokens.accessToken,
        refreshToken: mockNewTokens.refreshToken,
        user: mockUser,
      });
      expect(authService.refreshAccessToken).toHaveBeenCalledWith(mockRefreshToken);
      expect(mockResponse.cookie).toHaveBeenCalledTimes(1);
    });
  });

  describe('logout', () => {
    it('should revoke token and clear cookies', async () => {
      const mockRefreshToken = 'test-refresh-token';
      mockAuthService.revokeRefreshToken.mockResolvedValue(undefined);

      const result = await resolver.logout(mockRefreshToken, { res: mockResponse });

      expect(result).toBe(true);
      expect(authService.revokeRefreshToken).toHaveBeenCalledWith(mockRefreshToken);
      expect(mockResponse.clearCookie).toHaveBeenCalledTimes(1);
      expect(mockResponse.clearCookie).toHaveBeenCalledWith('Authentication');
    });
  });
});
