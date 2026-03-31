import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthCookieService } from './auth-cookie.service';
import { UnifiedThrottlerGuard } from '../common/guards/throttler.guard';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;
  let authCookieService: AuthCookieService;
  let configService: ConfigService;
  let mockResponse: Partial<Response>;

  const mockAuthService = {
    handleOAuthCallback: jest.fn(),
  };

  const mockAuthCookieService = {
    setAccessTokenCookie: jest.fn(),
    setRefreshTokenCookie: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    mockResponse = {
      redirect: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: AuthCookieService, useValue: mockAuthCookieService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    })
      .overrideGuard(UnifiedThrottlerGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
    authCookieService = module.get<AuthCookieService>(AuthCookieService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('callback', () => {
    it('should handle successful OAuth callback and redirect to dashboard', async () => {
      const code = 'test-oauth-code';
      const mockResult = {
        user: { id: 1, stravaId: 12345 },
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        redirectPath: '/dashboard',
      };

      mockConfigService.get.mockReturnValue('http://localhost:3000');
      mockAuthService.handleOAuthCallback.mockResolvedValue(mockResult);

      await controller.callback(code, null as any, null as any, null as any, mockResponse as Response);

      expect(authService.handleOAuthCallback).toHaveBeenCalledWith(code, undefined);
      expect(authCookieService.setAccessTokenCookie).toHaveBeenCalledWith(mockResponse, 'access-token');
      expect(authCookieService.setRefreshTokenCookie).toHaveBeenCalledWith(mockResponse, 'refresh-token');
      expect(mockResponse.redirect).toHaveBeenCalledWith('http://localhost:3000/dashboard');
    });

    it('should redirect to onboarding if user has not completed onboarding', async () => {
      const mockResult = {
        user: { id: 1, stravaId: 12345 },
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        redirectPath: '/onboarding',
      };

      mockConfigService.get.mockReturnValue('http://localhost:3000');
      mockAuthService.handleOAuthCallback.mockResolvedValue(mockResult);

      await controller.callback('code', null as any, null as any, null as any, mockResponse as Response);

      expect(mockResponse.redirect).toHaveBeenCalledWith('http://localhost:3000/onboarding');
    });

    it('should redirect to error page when error parameter present', async () => {
      mockConfigService.get.mockReturnValue('http://localhost:3000');

      await controller.callback(null as any, 'access_denied', null as any, null as any, mockResponse as Response);

      expect(authService.handleOAuthCallback).not.toHaveBeenCalled();
      expect(mockResponse.redirect).toHaveBeenCalledWith('http://localhost:3000/auth/error?error=access_denied');
    });

    it('should redirect to error page when code missing', async () => {
      mockConfigService.get.mockReturnValue('http://localhost:3000');

      await controller.callback(null as any, null as any, null as any, null as any, mockResponse as Response);

      expect(authService.handleOAuthCallback).not.toHaveBeenCalled();
      expect(mockResponse.redirect).toHaveBeenCalledWith('http://localhost:3000/auth/error?error=missing_code');
    });

    it('should redirect to error page on OAuth processing failure', async () => {
      mockConfigService.get.mockReturnValue('http://localhost:3000');
      mockAuthService.handleOAuthCallback.mockRejectedValue(new Error('OAuth failed'));

      await controller.callback('code', null as any, null as any, null as any, mockResponse as Response);

      expect(mockResponse.redirect).toHaveBeenCalledWith('http://localhost:3000/auth/error?error=auth_failed');
    });

    it('should use default frontend URL if not configured', async () => {
      mockConfigService.get.mockImplementation((key: string, defaultValue?: string) => defaultValue);

      await controller.callback(null as any, 'error', null as any, null as any, mockResponse as Response);

      expect(mockResponse.redirect).toHaveBeenCalledWith('http://localhost:3000/auth/error?error=error');
    });

    it('should use custom frontend URL from configuration', async () => {
      mockConfigService.get.mockReturnValue('https://app.example.com');

      await controller.callback(null as any, 'error', null as any, null as any, mockResponse as Response);

      expect(mockResponse.redirect).toHaveBeenCalledWith('https://app.example.com/auth/error?error=error');
    });

    it('should decode state parameter and pass intendedRedirect to handleOAuthCallback', async () => {
      const code = 'test-oauth-code';
      const intendedRedirect = '/activities';
      const state = Buffer.from(JSON.stringify({ redirect: intendedRedirect })).toString('base64url');
      const mockResult = {
        user: { id: 1, stravaId: 12345 },
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        redirectPath: intendedRedirect,
      };

      mockConfigService.get.mockReturnValue('http://localhost:3000');
      mockAuthService.handleOAuthCallback.mockResolvedValue(mockResult);

      await controller.callback(code, null as any, null as any, state, mockResponse as Response);

      expect(authService.handleOAuthCallback).toHaveBeenCalledWith(code, intendedRedirect);
      expect(mockResponse.redirect).toHaveBeenCalledWith('http://localhost:3000/activities');
    });

    it('should use default redirect when state parameter is invalid JSON', async () => {
      const code = 'test-oauth-code';
      const invalidState = 'invalid-base64';
      const mockResult = {
        user: { id: 1, stravaId: 12345 },
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        redirectPath: '/dashboard',
      };

      mockConfigService.get.mockReturnValue('http://localhost:3000');
      mockAuthService.handleOAuthCallback.mockResolvedValue(mockResult);

      await controller.callback(code, null as any, null as any, invalidState, mockResponse as Response);

      expect(authService.handleOAuthCallback).toHaveBeenCalledWith(code, undefined);
      expect(mockResponse.redirect).toHaveBeenCalledWith('http://localhost:3000/dashboard');
    });

    it('should validate redirect from state parameter before passing to handleOAuthCallback', async () => {
      const code = 'test-oauth-code';
      const maliciousRedirect = 'https://evil.com';
      const state = Buffer.from(JSON.stringify({ redirect: maliciousRedirect })).toString('base64url');
      const mockResult = {
        user: { id: 1, stravaId: 12345 },
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        redirectPath: '/dashboard',
      };

      mockConfigService.get.mockReturnValue('http://localhost:3000');
      mockAuthService.handleOAuthCallback.mockResolvedValue(mockResult);

      await controller.callback(code, null as any, null as any, state, mockResponse as Response);

      expect(authService.handleOAuthCallback).toHaveBeenCalledWith(code, '/dashboard');
    });

    it('should not set cookies when error parameter present', async () => {
      mockConfigService.get.mockReturnValue('http://localhost:3000');

      await controller.callback(null as any, 'access_denied', null as any, null as any, mockResponse as Response);

      expect(authCookieService.setAccessTokenCookie).not.toHaveBeenCalled();
      expect(authCookieService.setRefreshTokenCookie).not.toHaveBeenCalled();
    });

    it('should not set cookies when code is missing', async () => {
      mockConfigService.get.mockReturnValue('http://localhost:3000');

      await controller.callback(null as any, null as any, null as any, null as any, mockResponse as Response);

      expect(authCookieService.setAccessTokenCookie).not.toHaveBeenCalled();
      expect(authCookieService.setRefreshTokenCookie).not.toHaveBeenCalled();
    });
  });
});
