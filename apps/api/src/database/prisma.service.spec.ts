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
    it('should implement OnModuleInit interface', () => {
      expect(service.onModuleInit).toBeDefined();
      expect(typeof service.onModuleInit).toBe('function');
    });

    it('should implement OnModuleDestroy interface', () => {
      expect(service.onModuleDestroy).toBeDefined();
      expect(typeof service.onModuleDestroy).toBe('function');
    });

    it('should have $connect method from PrismaClient', () => {
      expect(service.$connect).toBeDefined();
      expect(typeof service.$connect).toBe('function');
    });

    it('should have $disconnect method from PrismaClient', () => {
      expect(service.$disconnect).toBeDefined();
      expect(typeof service.$disconnect).toBe('function');
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
