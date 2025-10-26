import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import { StravaService } from './strava.service';
import { StravaTokenService } from './strava-token.service';
import { StravaTokenResponse, StravaAthleteResponse } from './types';

describe('StravaService', () => {
  let service: StravaService;
  let httpService: HttpService;
  let configService: ConfigService;
  let stravaTokenService: StravaTokenService;

  const mockHttpService = {
    post: jest.fn(),
    get: jest.fn(),
  };

  const mockConfigService = {
    getOrThrow: jest.fn(),
  };

  const mockStravaTokenService = {
    getValidAccessToken: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StravaService,
        { provide: HttpService, useValue: mockHttpService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: StravaTokenService, useValue: mockStravaTokenService },
      ],
    }).compile();

    service = module.get<StravaService>(StravaService);
    httpService = module.get<HttpService>(HttpService);
    configService = module.get<ConfigService>(ConfigService);
    stravaTokenService = module.get<StravaTokenService>(StravaTokenService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('exchangeCodeForToken', () => {
    it('should exchange OAuth code for Strava tokens', async () => {
      const mockCode = 'test-oauth-code';
      const mockTokenResponse: StravaTokenResponse = {
        token_type: 'Bearer',
        expires_at: 1234567890,
        expires_in: 21600,
        refresh_token: 'mock-refresh-token',
        access_token: 'mock-access-token',
        athlete: {
          id: 12345,
          username: 'testuser',
          firstname: 'Test',
          lastname: 'User',
        } as StravaAthleteResponse,
      };

      mockConfigService.getOrThrow.mockReturnValueOnce('test-client-id');
      mockConfigService.getOrThrow.mockReturnValueOnce('test-client-secret');

      mockHttpService.post.mockReturnValue(
        of({
          data: mockTokenResponse,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {} as any,
        }),
      );

      const result = await service.exchangeCodeForToken(mockCode);

      expect(result).toEqual(mockTokenResponse);
      expect(httpService.post).toHaveBeenCalledWith('https://www.strava.com/oauth/token', {
        client_id: 'test-client-id',
        client_secret: 'test-client-secret',
        code: mockCode,
        grant_type: 'authorization_code',
      });
    });

    it('should throw UnauthorizedException on 401 error', async () => {
      mockConfigService.getOrThrow.mockReturnValue('test-value');

      mockHttpService.post.mockReturnValue(
        throwError(() => ({
          response: {
            status: 401,
            data: { message: 'Unauthorized' },
          },
        })),
      );

      await expect(service.exchangeCodeForToken('invalid-code')).rejects.toThrow(UnauthorizedException);
      await expect(service.exchangeCodeForToken('invalid-code')).rejects.toThrow(
        'Strava authentication failed: token exchange',
      );
    });

    it('should throw BadRequestException on 400 error', async () => {
      mockConfigService.getOrThrow.mockReturnValue('test-value');

      mockHttpService.post.mockReturnValue(
        throwError(() => ({
          response: {
            status: 400,
            data: { message: 'Bad Request' },
          },
        })),
      );

      await expect(service.exchangeCodeForToken('invalid-code')).rejects.toThrow(BadRequestException);
      await expect(service.exchangeCodeForToken('invalid-code')).rejects.toThrow(
        'Invalid Strava request: token exchange',
      );
    });
  });

  describe('getAthlete', () => {
    it('should fetch athlete data with access token', async () => {
      const mockAccessToken = 'test-access-token';
      const mockAthleteResponse: StravaAthleteResponse = {
        id: 12345,
        username: 'testathlete',
        resource_state: 3,
        firstname: 'Test',
        lastname: 'Athlete',
        bio: 'Test bio',
        city: 'Test City',
        state: 'Test State',
        country: 'Test Country',
        sex: 'M',
        premium: false,
        summit: false,
        created_at: '2020-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
        badge_type_id: 1,
        weight: 70,
        profile_medium: 'https://example.com/profile-medium.jpg',
        profile: 'https://example.com/profile.jpg',
        friend: null,
        follower: null,
        blocked: false,
        can_follow: true,
        follower_count: 10,
        friend_count: 5,
        mutual_friend_count: 2,
        athlete_type: 1,
        date_preference: 'dd/MM/yyyy',
        measurement_preference: 'meters',
        clubs: [],
        ftp: null,
        bikes: [],
        shoes: [],
      };

      mockHttpService.get.mockReturnValue(
        of({
          data: mockAthleteResponse,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {} as any,
        }),
      );

      const result = await service.getAthlete(mockAccessToken);

      expect(result).toEqual(mockAthleteResponse);
      expect(httpService.get).toHaveBeenCalledWith('https://www.strava.com/api/v3/athlete', {
        headers: { Authorization: `Bearer ${mockAccessToken}` },
      });
    });

    it('should throw UnauthorizedException on invalid token', async () => {
      mockHttpService.get.mockReturnValue(
        throwError(() => ({
          response: {
            status: 401,
            data: { message: 'Unauthorized' },
          },
        })),
      );

      await expect(service.getAthlete('invalid-token')).rejects.toThrow(UnauthorizedException);
      await expect(service.getAthlete('invalid-token')).rejects.toThrow('Strava authentication failed: athlete fetch');
    });
  });

  describe('getActivities', () => {
    it('should fetch activities for user with valid token', async () => {
      const userId = 1;
      const mockAccessToken = 'valid-access-token';
      const mockActivities = [
        {
          id: 123,
          name: 'Morning Run',
          type: 'Run',
          distance: 5000,
          moving_time: 1800,
          elapsed_time: 1900,
          total_elevation_gain: 50,
          start_date: '2025-01-01T08:00:00Z',
          start_date_local: '2025-01-01T09:00:00Z',
          timezone: 'Europe/Paris',
        },
      ];

      mockStravaTokenService.getValidAccessToken.mockResolvedValue(mockAccessToken);
      mockHttpService.get.mockReturnValue(
        of({
          data: mockActivities,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {} as any,
        }),
      );

      const result = await service.getActivities(userId, { page: 1, per_page: 30 });

      expect(result).toEqual(mockActivities);
      expect(stravaTokenService.getValidAccessToken).toHaveBeenCalledWith(userId);
      expect(httpService.get).toHaveBeenCalledWith('https://www.strava.com/api/v3/athlete/activities', {
        headers: { Authorization: `Bearer ${mockAccessToken}` },
        params: {
          page: 1,
          per_page: 30,
          before: undefined,
          after: undefined,
        },
      });
    });

    it('should use default pagination params', async () => {
      const userId = 1;
      mockStravaTokenService.getValidAccessToken.mockResolvedValue('token');
      mockHttpService.get.mockReturnValue(
        of({ data: [], status: 200, statusText: 'OK', headers: {}, config: {} as any }),
      );

      await service.getActivities(userId);

      expect(httpService.get).toHaveBeenCalledWith('https://www.strava.com/api/v3/athlete/activities', {
        headers: { Authorization: 'Bearer token' },
        params: {
          page: 1,
          per_page: 30,
          before: undefined,
          after: undefined,
        },
      });
    });

    it('should propagate StravaTokenService exceptions', async () => {
      const userId = 1;
      const tokenError = new Error('Token expired');

      mockStravaTokenService.getValidAccessToken.mockRejectedValue(tokenError);

      await expect(service.getActivities(userId)).rejects.toThrow(tokenError);
    });
  });
});
