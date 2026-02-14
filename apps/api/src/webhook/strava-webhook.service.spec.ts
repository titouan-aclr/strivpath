import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { StravaWebhookService } from './strava-webhook.service';
import { UserService } from '../user/user.service';
import { StravaWebhookEvent } from './types/strava-webhook-event.interface';

describe('StravaWebhookService', () => {
  let service: StravaWebhookService;
  let userService: jest.Mocked<Pick<UserService, 'findByStravaId' | 'deleteAccount'>>;

  const VERIFY_TOKEN = 'test-verify-token';

  const mockUserService = {
    findByStravaId: jest.fn(),
    deleteAccount: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue?: string) => {
      if (key === 'STRAVA_WEBHOOK_VERIFY_TOKEN') return VERIFY_TOKEN;
      return defaultValue;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StravaWebhookService,
        { provide: UserService, useValue: mockUserService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<StravaWebhookService>(StravaWebhookService);
    userService = mockUserService;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validateVerifyToken', () => {
    it('should return true for a valid token', () => {
      expect(service.validateVerifyToken(VERIFY_TOKEN)).toBe(true);
    });

    it('should return false for an invalid token', () => {
      expect(service.validateVerifyToken('wrong-token')).toBe(false);
    });

    it('should return false for an empty token', () => {
      expect(service.validateVerifyToken('')).toBe(false);
    });

    it('should return false when env var is not set', () => {
      mockConfigService.get.mockReturnValueOnce('');

      expect(service.validateVerifyToken('some-token')).toBe(false);
    });
  });

  describe('handleEvent', () => {
    const deauthorizationEvent: StravaWebhookEvent = {
      aspect_type: 'update',
      event_time: 1234567890,
      object_id: 12345,
      object_type: 'athlete',
      owner_id: 67890,
      subscription_id: 1,
      updates: { authorized: 'false' },
    };

    it('should delete the user account on deauthorization', async () => {
      userService.findByStravaId.mockResolvedValue({ id: 42 } as any);
      userService.deleteAccount.mockResolvedValue(true);

      await service.handleEvent(deauthorizationEvent);

      expect(userService.findByStravaId).toHaveBeenCalledWith(67890);
      expect(userService.deleteAccount).toHaveBeenCalledWith(42);
    });

    it('should not throw when user is not found during deauthorization', async () => {
      userService.findByStravaId.mockResolvedValue(null);

      await expect(service.handleEvent(deauthorizationEvent)).resolves.toBeUndefined();
      expect(userService.deleteAccount).not.toHaveBeenCalled();
    });

    it('should not delete user for activity events', async () => {
      const activityEvent: StravaWebhookEvent = {
        aspect_type: 'create',
        event_time: 1234567890,
        object_id: 99999,
        object_type: 'activity',
        owner_id: 67890,
        subscription_id: 1,
        updates: {},
      };

      await service.handleEvent(activityEvent);

      expect(userService.findByStravaId).not.toHaveBeenCalled();
      expect(userService.deleteAccount).not.toHaveBeenCalled();
    });

    it('should not delete user for athlete events without authorized=false', async () => {
      const athleteUpdateEvent: StravaWebhookEvent = {
        aspect_type: 'update',
        event_time: 1234567890,
        object_id: 12345,
        object_type: 'athlete',
        owner_id: 67890,
        subscription_id: 1,
        updates: { some_field: 'some_value' },
      };

      await service.handleEvent(athleteUpdateEvent);

      expect(userService.findByStravaId).not.toHaveBeenCalled();
      expect(userService.deleteAccount).not.toHaveBeenCalled();
    });
  });
});
