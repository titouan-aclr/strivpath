import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { AuthCookieService } from './auth-cookie.service';

describe('AuthCookieService', () => {
  let service: AuthCookieService;
  let configService: ConfigService;
  let mockResponse: Partial<Response>;

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    mockResponse = {
      cookie: jest.fn(),
      clearCookie: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthCookieService, { provide: ConfigService, useValue: mockConfigService }],
    }).compile();

    service = module.get<AuthCookieService>(AuthCookieService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('setAccessTokenCookie', () => {
    it('should set access token cookie with correct options in development', () => {
      mockConfigService.get.mockReturnValue('development');
      const token = 'test-access-token';

      service.setAccessTokenCookie(mockResponse as Response, token);

      expect(mockResponse.cookie).toHaveBeenCalledWith('Authentication', token, {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        maxAge: 15 * 60 * 1000,
        path: '/',
      });
    });

    it('should set access token cookie with correct options in production', () => {
      mockConfigService.get.mockReturnValue('production');
      const token = 'test-access-token';

      service.setAccessTokenCookie(mockResponse as Response, token);

      expect(mockResponse.cookie).toHaveBeenCalledWith('Authentication', token, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        maxAge: 15 * 60 * 1000,
        path: '/',
      });
    });

    it('should set maxAge to 15 minutes', () => {
      mockConfigService.get.mockReturnValue('development');
      const token = 'test-access-token';
      const expectedMaxAge = 15 * 60 * 1000;

      service.setAccessTokenCookie(mockResponse as Response, token);

      const cookieCall = (mockResponse.cookie as jest.Mock).mock.calls[0];
      expect(cookieCall[2].maxAge).toBe(expectedMaxAge);
    });
  });

  describe('setRefreshTokenCookie', () => {
    it('should set refresh token cookie with correct options in development', () => {
      mockConfigService.get.mockReturnValue('development');
      const token = 'test-refresh-token';

      service.setRefreshTokenCookie(mockResponse as Response, token);

      expect(mockResponse.cookie).toHaveBeenCalledWith('RefreshToken', token, {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/',
      });
    });

    it('should set refresh token cookie with correct options in production', () => {
      mockConfigService.get.mockReturnValue('production');
      const token = 'test-refresh-token';

      service.setRefreshTokenCookie(mockResponse as Response, token);

      expect(mockResponse.cookie).toHaveBeenCalledWith('RefreshToken', token, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/',
      });
    });

    it('should set maxAge to 7 days', () => {
      mockConfigService.get.mockReturnValue('development');
      const token = 'test-refresh-token';
      const expectedMaxAge = 7 * 24 * 60 * 60 * 1000;

      service.setRefreshTokenCookie(mockResponse as Response, token);

      const cookieCall = (mockResponse.cookie as jest.Mock).mock.calls[0];
      expect(cookieCall[2].maxAge).toBe(expectedMaxAge);
    });
  });

  describe('clearAccessTokenCookie', () => {
    it('should clear Authentication cookie with correct options in development', () => {
      mockConfigService.get.mockReturnValue('development');

      service.clearAccessTokenCookie(mockResponse as Response);

      expect(mockResponse.clearCookie).toHaveBeenCalledWith('Authentication', {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        path: '/',
      });
    });

    it('should clear Authentication cookie with correct options in production', () => {
      mockConfigService.get.mockReturnValue('production');

      service.clearAccessTokenCookie(mockResponse as Response);

      expect(mockResponse.clearCookie).toHaveBeenCalledWith('Authentication', {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        path: '/',
      });
    });
  });

  describe('clearRefreshTokenCookie', () => {
    it('should clear RefreshToken cookie with correct options in development', () => {
      mockConfigService.get.mockReturnValue('development');

      service.clearRefreshTokenCookie(mockResponse as Response);

      expect(mockResponse.clearCookie).toHaveBeenCalledWith('RefreshToken', {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        path: '/',
      });
    });

    it('should clear RefreshToken cookie with correct options in production', () => {
      mockConfigService.get.mockReturnValue('production');

      service.clearRefreshTokenCookie(mockResponse as Response);

      expect(mockResponse.clearCookie).toHaveBeenCalledWith('RefreshToken', {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        path: '/',
      });
    });
  });

  describe('clearAllAuthCookies', () => {
    it('should clear both authentication cookies in development', () => {
      mockConfigService.get.mockReturnValue('development');

      service.clearAllAuthCookies(mockResponse as Response);

      expect(mockResponse.clearCookie).toHaveBeenCalledWith('Authentication', {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        path: '/',
      });
      expect(mockResponse.clearCookie).toHaveBeenCalledWith('RefreshToken', {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        path: '/',
      });
      expect(mockResponse.clearCookie).toHaveBeenCalledTimes(2);
    });

    it('should clear both authentication cookies in production', () => {
      mockConfigService.get.mockReturnValue('production');

      service.clearAllAuthCookies(mockResponse as Response);

      expect(mockResponse.clearCookie).toHaveBeenCalledWith('Authentication', {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        path: '/',
      });
      expect(mockResponse.clearCookie).toHaveBeenCalledWith('RefreshToken', {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        path: '/',
      });
      expect(mockResponse.clearCookie).toHaveBeenCalledTimes(2);
    });
  });
});
