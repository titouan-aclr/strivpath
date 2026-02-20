import { Test, TestingModule } from '@nestjs/testing';
import { StravaWebhookController } from './strava-webhook.controller';
import { StravaWebhookService } from './strava-webhook.service';
import { StravaWebhookEvent } from './types/strava-webhook-event.interface';

describe('StravaWebhookController', () => {
  let controller: StravaWebhookController;
  let service: jest.Mocked<Pick<StravaWebhookService, 'validateVerifyToken' | 'handleEvent'>>;

  const mockService = {
    validateVerifyToken: jest.fn(),
    handleEvent: jest.fn(),
  };

  const mockResponse = () => {
    const res: any = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StravaWebhookController],
      providers: [{ provide: StravaWebhookService, useValue: mockService }],
    }).compile();

    controller = module.get<StravaWebhookController>(StravaWebhookController);
    service = mockService;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handleVerification (GET)', () => {
    it('should return hub.challenge for valid verification request', () => {
      service.validateVerifyToken.mockReturnValue(true);
      const res = mockResponse();
      const req = {
        query: {
          'hub.mode': 'subscribe',
          'hub.challenge': 'test-challenge-123',
          'hub.verify_token': 'valid-token',
        },
      } as any;

      controller.handleVerification(req, res);

      expect(service.validateVerifyToken).toHaveBeenCalledWith('valid-token');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ 'hub.challenge': 'test-challenge-123' });
    });

    it('should return 403 for invalid verify token', () => {
      service.validateVerifyToken.mockReturnValue(false);
      const res = mockResponse();
      const req = {
        query: {
          'hub.mode': 'subscribe',
          'hub.challenge': 'test-challenge',
          'hub.verify_token': 'invalid-token',
        },
      } as any;

      controller.handleVerification(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('should return 403 for invalid hub.mode', () => {
      const res = mockResponse();
      const req = {
        query: {
          'hub.mode': 'invalid',
          'hub.challenge': 'test-challenge',
          'hub.verify_token': 'valid-token',
        },
      } as any;

      controller.handleVerification(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('should return 403 when verify_token is missing', () => {
      const res = mockResponse();
      const req = {
        query: {
          'hub.mode': 'subscribe',
          'hub.challenge': 'test-challenge',
        },
      } as any;

      controller.handleVerification(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe('handleEvent (POST)', () => {
    const deauthEvent: StravaWebhookEvent = {
      aspect_type: 'update',
      event_time: 1234567890,
      object_id: 12345,
      object_type: 'athlete',
      owner_id: 67890,
      subscription_id: 1,
      updates: { authorized: 'false' },
    };

    it('should return 200 and call handleEvent', async () => {
      service.handleEvent.mockResolvedValue(undefined);
      const res = mockResponse();

      await controller.handleEvent(deauthEvent, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ received: true });
      expect(service.handleEvent).toHaveBeenCalledWith(deauthEvent);
    });

    it('should return 200 even when handleEvent throws', async () => {
      service.handleEvent.mockRejectedValue(new Error('Internal error'));
      const res = mockResponse();

      await controller.handleEvent(deauthEvent, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ received: true });
    });
  });
});
