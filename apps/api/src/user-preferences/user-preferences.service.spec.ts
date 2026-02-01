import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { UserPreferencesService } from './user-preferences.service';
import { PrismaService } from '../database/prisma.service';
import { createMockPrismaService, MockPrismaService } from '../../test/mocks/prisma.mock';
import { createMockPrismaUserPreferences } from '../../test/mocks/factories';
import { SportType } from './enums/sport-type.enum';

describe('UserPreferencesService', () => {
  let service: UserPreferencesService;
  let prisma: MockPrismaService;

  beforeEach(async () => {
    const mockPrisma = createMockPrismaService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [UserPreferencesService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    service = module.get<UserPreferencesService>(UserPreferencesService);
    prisma = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findByUserId', () => {
    it('should return user preferences when found', async () => {
      const mockPreferences = createMockPrismaUserPreferences({
        userId: 1,
        selectedSports: ['RUN', 'RIDE'],
        onboardingCompleted: true,
      });

      prisma.userPreferences.findUnique.mockResolvedValue(mockPreferences);

      const result = await service.findByUserId(1);

      expect(result).toBeDefined();
      expect(result?.userId).toBe(1);
      expect(result?.selectedSports).toEqual([SportType.RUN, SportType.RIDE]);
      expect(result?.onboardingCompleted).toBe(true);
      expect(prisma.userPreferences.findUnique).toHaveBeenCalledWith({
        where: { userId: 1 },
      });
    });

    it('should return null when user preferences not found', async () => {
      prisma.userPreferences.findUnique.mockResolvedValue(null);

      const result = await service.findByUserId(999);

      expect(result).toBeNull();
      expect(prisma.userPreferences.findUnique).toHaveBeenCalledWith({
        where: { userId: 999 },
      });
    });
  });

  describe('completeOnboarding', () => {
    it('should complete onboarding when sports are selected', async () => {
      const existingPreferences = createMockPrismaUserPreferences({
        userId: 1,
        selectedSports: ['RUN'],
        onboardingCompleted: false,
      });

      const updatedPreferences = createMockPrismaUserPreferences({
        userId: 1,
        selectedSports: ['RUN'],
        onboardingCompleted: true,
      });

      prisma.userPreferences.findUnique.mockResolvedValue(existingPreferences);
      prisma.userPreferences.update.mockResolvedValue(updatedPreferences);

      const result = await service.completeOnboarding(1);

      expect(result.onboardingCompleted).toBe(true);
      expect(prisma.userPreferences.update).toHaveBeenCalledWith({
        where: { userId: 1 },
        data: { onboardingCompleted: true },
      });
    });

    it('should return existing preferences if already completed', async () => {
      const completedPreferences = createMockPrismaUserPreferences({
        userId: 1,
        selectedSports: ['RUN'],
        onboardingCompleted: true,
      });

      prisma.userPreferences.findUnique.mockResolvedValue(completedPreferences);

      const result = await service.completeOnboarding(1);

      expect(result.onboardingCompleted).toBe(true);
      expect(prisma.userPreferences.update).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if no sports selected', async () => {
      const preferencesWithoutSports = createMockPrismaUserPreferences({
        userId: 1,
        selectedSports: [],
        onboardingCompleted: false,
      });

      prisma.userPreferences.findUnique.mockResolvedValue(preferencesWithoutSports);

      await expect(service.completeOnboarding(1)).rejects.toThrow(BadRequestException);
      await expect(service.completeOnboarding(1)).rejects.toThrow(
        'Cannot complete onboarding without selecting at least one sport',
      );
    });

    it('should throw NotFoundException if preferences not found', async () => {
      prisma.userPreferences.findUnique.mockResolvedValue(null);

      await expect(service.completeOnboarding(1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('addSport', () => {
    it('should add a new sport to preferences', async () => {
      const existingPreferences = createMockPrismaUserPreferences({
        userId: 1,
        selectedSports: ['RUN'],
        onboardingCompleted: true,
      });

      const updatedPreferences = createMockPrismaUserPreferences({
        userId: 1,
        selectedSports: ['RUN', 'RIDE'],
        onboardingCompleted: true,
      });

      prisma.userPreferences.findUnique.mockResolvedValue(existingPreferences);
      prisma.userPreferences.update.mockResolvedValue(updatedPreferences);

      const result = await service.addSport(1, SportType.RIDE);

      expect(result.selectedSports).toEqual([SportType.RUN, SportType.RIDE]);
      expect(prisma.userPreferences.update).toHaveBeenCalledWith({
        where: { userId: 1 },
        data: { selectedSports: ['RUN', 'RIDE'] },
      });
    });

    it('should throw BadRequestException if sport already exists', async () => {
      const existingPreferences = createMockPrismaUserPreferences({
        userId: 1,
        selectedSports: ['RUN', 'RIDE'],
        onboardingCompleted: true,
      });

      prisma.userPreferences.findUnique.mockResolvedValue(existingPreferences);

      await expect(service.addSport(1, SportType.RUN)).rejects.toThrow(BadRequestException);
      await expect(service.addSport(1, SportType.RUN)).rejects.toThrow('Sport RUN is already in user preferences');
    });

    it('should throw NotFoundException if preferences not found', async () => {
      prisma.userPreferences.findUnique.mockResolvedValue(null);

      await expect(service.addSport(1, SportType.RUN)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getSportDataCount', () => {
    it('should return activity and goal counts for a sport', async () => {
      prisma.activity.count.mockResolvedValue(10);
      prisma.goal.count.mockResolvedValue(3);

      const result = await service.getSportDataCount(1, SportType.RUN);

      expect(result.activitiesCount).toBe(10);
      expect(result.goalsCount).toBe(3);
      expect(prisma.activity.count).toHaveBeenCalledWith({
        where: { userId: 1, type: SportType.RUN },
      });
      expect(prisma.goal.count).toHaveBeenCalledWith({
        where: { userId: 1, sportType: SportType.RUN },
      });
    });

    it('should return zero counts when no data exists', async () => {
      prisma.activity.count.mockResolvedValue(0);
      prisma.goal.count.mockResolvedValue(0);

      const result = await service.getSportDataCount(1, SportType.SWIM);

      expect(result.activitiesCount).toBe(0);
      expect(result.goalsCount).toBe(0);
    });

    it('should use correct sport type for RIDE sport', async () => {
      prisma.activity.count.mockResolvedValue(5);
      prisma.goal.count.mockResolvedValue(2);

      await service.getSportDataCount(1, SportType.RIDE);

      expect(prisma.activity.count).toHaveBeenCalledWith({
        where: {
          userId: 1,
          type: SportType.RIDE,
        },
      });
    });
  });

  describe('removeSport', () => {
    it('should remove sport and delete data when deleteData is true', async () => {
      const mockPreferences = createMockPrismaUserPreferences({
        userId: 1,
        selectedSports: ['RUN', 'RIDE'],
        onboardingCompleted: true,
      });

      prisma.userPreferences.findUnique.mockResolvedValue(mockPreferences);

      const mockTransaction = jest.fn().mockImplementation(async callback => {
        const tx = {
          userPreferences: { update: jest.fn().mockResolvedValue({}) },
          activity: { deleteMany: jest.fn().mockResolvedValue({ count: 5 }) },
          goal: { deleteMany: jest.fn().mockResolvedValue({ count: 2 }), updateMany: jest.fn() },
        };
        return callback(tx);
      });
      prisma.$transaction.mockImplementation(mockTransaction);

      const result = await service.removeSport(1, SportType.RUN, true);

      expect(result).toBe(true);
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('should remove sport and archive goals when deleteData is false', async () => {
      const mockPreferences = createMockPrismaUserPreferences({
        userId: 1,
        selectedSports: ['RUN', 'RIDE'],
        onboardingCompleted: true,
      });

      prisma.userPreferences.findUnique.mockResolvedValue(mockPreferences);

      const mockTransaction = jest.fn().mockImplementation(async callback => {
        const tx = {
          userPreferences: { update: jest.fn().mockResolvedValue({}) },
          activity: { deleteMany: jest.fn() },
          goal: { deleteMany: jest.fn(), updateMany: jest.fn().mockResolvedValue({ count: 2 }) },
        };
        return callback(tx);
      });
      prisma.$transaction.mockImplementation(mockTransaction);

      const result = await service.removeSport(1, SportType.RUN, false);

      expect(result).toBe(true);
    });

    it('should throw NotFoundException when preferences not found', async () => {
      prisma.userPreferences.findUnique.mockResolvedValue(null);

      await expect(service.removeSport(1, SportType.RUN, true)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when trying to remove last sport', async () => {
      const mockPreferences = createMockPrismaUserPreferences({
        userId: 1,
        selectedSports: ['RUN'],
        onboardingCompleted: true,
      });

      prisma.userPreferences.findUnique.mockResolvedValue(mockPreferences);

      await expect(service.removeSport(1, SportType.RUN, true)).rejects.toThrow(BadRequestException);
      await expect(service.removeSport(1, SportType.RUN, true)).rejects.toThrow(
        'Cannot remove last sport - at least one sport must be selected',
      );
    });

    it('should throw BadRequestException when sport is not in preferences', async () => {
      const mockPreferences = createMockPrismaUserPreferences({
        userId: 1,
        selectedSports: ['RUN', 'RIDE'],
        onboardingCompleted: true,
      });

      prisma.userPreferences.findUnique.mockResolvedValue(mockPreferences);

      await expect(service.removeSport(1, SportType.SWIM, true)).rejects.toThrow(BadRequestException);
      await expect(service.removeSport(1, SportType.SWIM, true)).rejects.toThrow(
        'Sport SWIM is not in user preferences',
      );
    });
  });
});
