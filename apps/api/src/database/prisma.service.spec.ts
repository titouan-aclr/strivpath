import { PrismaService } from './prisma.service';

jest.unmock('../database/prisma.service');

describe('PrismaService', () => {
  let service: PrismaService;

  beforeEach(() => {
    service = new PrismaService();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('lifecycle hooks', () => {
    it('should call $connect on module init', async () => {
      const connectSpy = jest.spyOn(service, '$connect').mockResolvedValue();

      await service.onModuleInit();

      expect(connectSpy).toHaveBeenCalledTimes(1);
    });

    it('should call $disconnect on module destroy', async () => {
      const disconnectSpy = jest.spyOn(service, '$disconnect').mockResolvedValue();

      await service.onModuleDestroy();

      expect(disconnectSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('database models', () => {
    it('should have user model available', () => {
      expect(service.user).toBeDefined();
    });

    it('should have stravaToken model available', () => {
      expect(service.stravaToken).toBeDefined();
    });

    it('should have userPreferences model available', () => {
      expect(service.userPreferences).toBeDefined();
    });

    it('should have activity model available', () => {
      expect(service.activity).toBeDefined();
    });

    it('should have syncHistory model available', () => {
      expect(service.syncHistory).toBeDefined();
    });

    it('should have refreshToken model available', () => {
      expect(service.refreshToken).toBeDefined();
    });
  });
});
