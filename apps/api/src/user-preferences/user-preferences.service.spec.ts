import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { UserPreferencesService } from './user-preferences.service';
import { PrismaService } from '../database/prisma.service';
import { createMockPrismaService, MockPrismaService } from '../../test/mocks/prisma.mock';
import { createMockPrismaUserPreferences } from '../../test/mocks/factories';
import { SportType, ThemeType } from '@repo/graphql-types';

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
        selectedSports: ['Run', 'Ride'],
        onboardingCompleted: true,
        locale: 'fr',
        theme: 'dark',
      });

      prisma.userPreferences.findUnique.mockResolvedValue(mockPreferences);

      const result = await service.findByUserId(1);

      expect(result).toBeDefined();
      expect(result?.userId).toBe(1);
      expect(result?.selectedSports).toEqual(['Run', 'Ride']);
      expect(result?.onboardingCompleted).toBe(true);
      expect(result?.locale).toBe('fr');
      expect(result?.theme).toBe(ThemeType.DARK);
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

  describe('update', () => {
    const existingPreferences = createMockPrismaUserPreferences({
      userId: 1,
      selectedSports: [],
      onboardingCompleted: false,
      locale: 'en',
      theme: 'system',
    });

    it('should update selectedSports and mark onboarding as completed', async () => {
      prisma.userPreferences.findUnique.mockResolvedValue(existingPreferences);

      const updatedPreferences = createMockPrismaUserPreferences({
        userId: 1,
        selectedSports: ['Run', 'Ride'],
        onboardingCompleted: true,
        locale: 'en',
        theme: 'system',
      });

      prisma.userPreferences.update.mockResolvedValue(updatedPreferences);

      const result = await service.update(1, {
        selectedSports: [SportType.RUN, SportType.RIDE],
      });

      expect(result.selectedSports).toEqual([SportType.RUN, SportType.RIDE]);
      expect(result.onboardingCompleted).toBe(true);
      expect(prisma.userPreferences.update).toHaveBeenCalledWith({
        where: { userId: 1 },
        data: {
          selectedSports: ['Run', 'Ride'],
          onboardingCompleted: true,
        },
      });
    });

    it('should update locale without changing onboarding status', async () => {
      const completedPreferences = createMockPrismaUserPreferences({
        userId: 1,
        selectedSports: ['Run'],
        onboardingCompleted: true,
        locale: 'en',
        theme: 'system',
      });

      prisma.userPreferences.findUnique.mockResolvedValue(completedPreferences);

      const updatedPreferences = createMockPrismaUserPreferences({
        ...completedPreferences,
        locale: 'fr',
      });

      prisma.userPreferences.update.mockResolvedValue(updatedPreferences);

      const result = await service.update(1, { locale: 'fr' });

      expect(result.locale).toBe('fr');
      expect(result.onboardingCompleted).toBe(true);
      expect(prisma.userPreferences.update).toHaveBeenCalledWith({
        where: { userId: 1 },
        data: {
          locale: 'fr',
        },
      });
    });

    it('should update theme without touching other fields', async () => {
      prisma.userPreferences.findUnique.mockResolvedValue(existingPreferences);

      const updatedPreferences = createMockPrismaUserPreferences({
        ...existingPreferences,
        theme: 'dark',
      });

      prisma.userPreferences.update.mockResolvedValue(updatedPreferences);

      const result = await service.update(1, { theme: ThemeType.DARK });

      expect(result.theme).toBe(ThemeType.DARK);
      expect(result.selectedSports).toEqual([]);
      expect(result.onboardingCompleted).toBe(false);
      expect(prisma.userPreferences.update).toHaveBeenCalledWith({
        where: { userId: 1 },
        data: {
          theme: 'dark',
        },
      });
    });

    it('should update multiple fields at once', async () => {
      prisma.userPreferences.findUnique.mockResolvedValue(existingPreferences);

      const updatedPreferences = createMockPrismaUserPreferences({
        userId: 1,
        selectedSports: ['Swim'],
        onboardingCompleted: true,
        locale: 'fr',
        theme: 'light',
      });

      prisma.userPreferences.update.mockResolvedValue(updatedPreferences);

      const result = await service.update(1, {
        selectedSports: [SportType.SWIM],
        locale: 'fr',
        theme: ThemeType.LIGHT,
      });

      expect(result.selectedSports).toEqual([SportType.SWIM]);
      expect(result.locale).toBe('fr');
      expect(result.theme).toBe(ThemeType.LIGHT);
      expect(result.onboardingCompleted).toBe(true);
      expect(prisma.userPreferences.update).toHaveBeenCalledWith({
        where: { userId: 1 },
        data: {
          selectedSports: ['Swim'],
          locale: 'fr',
          theme: 'light',
          onboardingCompleted: true,
        },
      });
    });

    it('should not mark onboarding as completed if already completed', async () => {
      const completedPreferences = createMockPrismaUserPreferences({
        userId: 1,
        selectedSports: ['Run'],
        onboardingCompleted: true,
      });

      prisma.userPreferences.findUnique.mockResolvedValue(completedPreferences);

      const updatedPreferences = createMockPrismaUserPreferences({
        ...completedPreferences,
        selectedSports: ['Run', 'Ride'],
      });

      prisma.userPreferences.update.mockResolvedValue(updatedPreferences);

      await service.update(1, {
        selectedSports: [SportType.RUN, SportType.RIDE],
      });

      expect(prisma.userPreferences.update).toHaveBeenCalledWith({
        where: { userId: 1 },
        data: {
          selectedSports: ['Run', 'Ride'],
        },
      });
    });

    it('should throw NotFoundException if user preferences not found', async () => {
      prisma.userPreferences.findUnique.mockResolvedValue(null);

      await expect(
        service.update(999, {
          selectedSports: [SportType.RUN],
        }),
      ).rejects.toThrow(NotFoundException);

      await expect(
        service.update(999, {
          selectedSports: [SportType.RUN],
        }),
      ).rejects.toThrow('User preferences not found for user 999');

      expect(prisma.userPreferences.update).not.toHaveBeenCalled();
    });
  });
});
