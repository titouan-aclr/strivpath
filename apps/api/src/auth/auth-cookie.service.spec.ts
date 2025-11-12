import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { AuthCookieService } from './auth-cookie.service';

describe('AuthCookieService', () => {
  let service: AuthCookieService;
  let configService: ConfigService;
  let mockResponse: Partial<Response>;

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue?: any) => {
      const config: Record<string, any> = {
        COOKIES_SAME_SITE: 'lax',
        COOKIES_SECURE: false,
        JWT_ACCESS_TOKEN_EXPIRATION: '15m',
        JWT_REFRESH_TOKEN_EXPIRATION: '7d',
        NODE_ENV: 'development',
      };
      return config[key] ?? defaultValue;
    }),
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
    it('should set access token cookie with correct options', () => {
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

    it('should set maxAge based on JWT_ACCESS_TOKEN_EXPIRATION', () => {
      const token = 'test-access-token';
      const expectedMaxAge = 15 * 60 * 1000;

      service.setAccessTokenCookie(mockResponse as Response, token);

      const cookieCall = (mockResponse.cookie as jest.Mock).mock.calls[0];
      expect(cookieCall[2].maxAge).toBe(expectedMaxAge);
    });
  });

  describe('setRefreshTokenCookie', () => {
    it('should set refresh token cookie with correct options', () => {
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

    it('should set maxAge based on JWT_REFRESH_TOKEN_EXPIRATION', () => {
      const token = 'test-refresh-token';
      const expectedMaxAge = 7 * 24 * 60 * 60 * 1000;

      service.setRefreshTokenCookie(mockResponse as Response, token);

      const cookieCall = (mockResponse.cookie as jest.Mock).mock.calls[0];
      expect(cookieCall[2].maxAge).toBe(expectedMaxAge);
    });
  });

  describe('clearAccessTokenCookie', () => {
    it('should clear Authentication cookie with correct options', () => {
      service.clearAccessTokenCookie(mockResponse as Response);

      expect(mockResponse.clearCookie).toHaveBeenCalledWith('Authentication', {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        path: '/',
      });
    });

    it('should clear cookie without maxAge option', () => {
      service.clearAccessTokenCookie(mockResponse as Response);

      const clearCookieCall = (mockResponse.clearCookie as jest.Mock).mock.calls[0];
      expect(clearCookieCall[1]).not.toHaveProperty('maxAge');
    });
  });

  describe('clearRefreshTokenCookie', () => {
    it('should clear RefreshToken cookie with correct options', () => {
      service.clearRefreshTokenCookie(mockResponse as Response);

      expect(mockResponse.clearCookie).toHaveBeenCalledWith('RefreshToken', {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        path: '/',
      });
    });

    it('should clear cookie without maxAge option', () => {
      service.clearRefreshTokenCookie(mockResponse as Response);

      const clearCookieCall = (mockResponse.clearCookie as jest.Mock).mock.calls[0];
      expect(clearCookieCall[1]).not.toHaveProperty('maxAge');
    });
  });

  describe('clearAllAuthCookies', () => {
    it('should clear both authentication cookies', () => {
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
  });

  describe('configuration validation', () => {
    it('should validate successfully with sameSite=lax and secure=false', () => {
      expect(() => {
        new AuthCookieService(configService);
      }).not.toThrow();
    });

    it('should validate successfully with sameSite=none and secure=true', async () => {
      const productionMockConfigService = {
        get: jest.fn((key: string, defaultValue?: any) => {
          const config: Record<string, any> = {
            COOKIES_SAME_SITE: 'none',
            COOKIES_SECURE: true,
            JWT_ACCESS_TOKEN_EXPIRATION: '15m',
            JWT_REFRESH_TOKEN_EXPIRATION: '7d',
          };
          return config[key] ?? defaultValue;
        }),
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [AuthCookieService, { provide: ConfigService, useValue: productionMockConfigService }],
      }).compile();

      expect(() => {
        module.get<AuthCookieService>(AuthCookieService);
      }).not.toThrow();
    });

    it('should throw error when sameSite=none and secure=false', async () => {
      const invalidMockConfigService = {
        get: jest.fn((key: string, defaultValue?: any) => {
          const config: Record<string, any> = {
            COOKIES_SAME_SITE: 'none',
            COOKIES_SECURE: false,
            JWT_ACCESS_TOKEN_EXPIRATION: '15m',
            JWT_REFRESH_TOKEN_EXPIRATION: '7d',
          };
          return config[key] ?? defaultValue;
        }),
      };

      await expect(
        Test.createTestingModule({
          providers: [AuthCookieService, { provide: ConfigService, useValue: invalidMockConfigService }],
        }).compile(),
      ).rejects.toThrow('Invalid cookie configuration');
    });
  });

  describe('configuration validation - invalid values', () => {
    it('should throw error when COOKIES_SAME_SITE has invalid value', async () => {
      const invalidMockConfigService = {
        get: jest.fn((key: string, defaultValue?: any) => {
          const config: Record<string, any> = {
            COOKIES_SAME_SITE: 'invalid',
            COOKIES_SECURE: false,
            JWT_ACCESS_TOKEN_EXPIRATION: '15m',
            JWT_REFRESH_TOKEN_EXPIRATION: '7d',
          };
          return config[key] ?? defaultValue;
        }),
      };

      await expect(
        Test.createTestingModule({
          providers: [AuthCookieService, { provide: ConfigService, useValue: invalidMockConfigService }],
        }).compile(),
      ).rejects.toThrow('Invalid COOKIES_SAME_SITE value: "invalid". Expected one of: lax, none, strict.');
    });

    it('should throw error when COOKIES_SECURE is not boolean', async () => {
      const invalidMockConfigService = {
        get: jest.fn((key: string, defaultValue?: any) => {
          const config: Record<string, any> = {
            COOKIES_SAME_SITE: 'lax',
            COOKIES_SECURE: 'yes',
            JWT_ACCESS_TOKEN_EXPIRATION: '15m',
            JWT_REFRESH_TOKEN_EXPIRATION: '7d',
          };
          return config[key] ?? defaultValue;
        }),
      };

      await expect(
        Test.createTestingModule({
          providers: [AuthCookieService, { provide: ConfigService, useValue: invalidMockConfigService }],
        }).compile(),
      ).rejects.toThrow('Invalid COOKIES_SECURE value: "yes". Expected boolean (true or false).');
    });

    it('should reject uppercase/mixed case COOKIES_SAME_SITE values', async () => {
      const caseMockConfigService = {
        get: jest.fn((key: string, defaultValue?: any) => {
          const config: Record<string, any> = {
            COOKIES_SAME_SITE: 'Lax',
            COOKIES_SECURE: false,
            JWT_ACCESS_TOKEN_EXPIRATION: '15m',
            JWT_REFRESH_TOKEN_EXPIRATION: '7d',
          };
          return config[key] ?? defaultValue;
        }),
      };

      await expect(
        Test.createTestingModule({
          providers: [AuthCookieService, { provide: ConfigService, useValue: caseMockConfigService }],
        }).compile(),
      ).rejects.toThrow('Invalid COOKIES_SAME_SITE value: "Lax". Expected one of: lax, none, strict.');
    });
  });

  describe('expiration synchronization', () => {
    it('should use JWT_ACCESS_TOKEN_EXPIRATION for access token cookie maxAge', async () => {
      const customMockConfigService = {
        get: jest.fn((key: string, defaultValue?: any) => {
          const config: Record<string, any> = {
            COOKIES_SAME_SITE: 'lax',
            COOKIES_SECURE: false,
            JWT_ACCESS_TOKEN_EXPIRATION: '30m',
            JWT_REFRESH_TOKEN_EXPIRATION: '7d',
          };
          return config[key] ?? defaultValue;
        }),
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [AuthCookieService, { provide: ConfigService, useValue: customMockConfigService }],
      }).compile();

      const customService = module.get<AuthCookieService>(AuthCookieService);
      const customMockResponse: Partial<Response> = {
        cookie: jest.fn(),
      };

      customService.setAccessTokenCookie(customMockResponse as Response, 'token');

      expect(customMockResponse.cookie).toHaveBeenCalledWith(
        'Authentication',
        'token',
        expect.objectContaining({
          maxAge: 30 * 60 * 1000,
        }),
      );
    });

    it('should use JWT_REFRESH_TOKEN_EXPIRATION for refresh token cookie maxAge', async () => {
      const customMockConfigService = {
        get: jest.fn((key: string, defaultValue?: any) => {
          const config: Record<string, any> = {
            COOKIES_SAME_SITE: 'lax',
            COOKIES_SECURE: false,
            JWT_ACCESS_TOKEN_EXPIRATION: '15m',
            JWT_REFRESH_TOKEN_EXPIRATION: '14d',
          };
          return config[key] ?? defaultValue;
        }),
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [AuthCookieService, { provide: ConfigService, useValue: customMockConfigService }],
      }).compile();

      const customService = module.get<AuthCookieService>(AuthCookieService);
      const customMockResponse: Partial<Response> = {
        cookie: jest.fn(),
      };

      customService.setRefreshTokenCookie(customMockResponse as Response, 'token');

      expect(customMockResponse.cookie).toHaveBeenCalledWith(
        'RefreshToken',
        'token',
        expect.objectContaining({
          maxAge: 14 * 24 * 60 * 60 * 1000,
        }),
      );
    });
  });
});
