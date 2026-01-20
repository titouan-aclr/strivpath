import { Test, TestingModule } from '@nestjs/testing';
import { UserPreferencesResolver } from './user-preferences.resolver';
import { UserPreferencesService } from './user-preferences.service';
import { UserPreferences } from './models/user-preferences.model';
import { SportDataCount } from './models/sport-data-count.model';
import { SportType } from './enums/sport-type.enum';
import { TokenPayload } from '../auth/types';

describe('UserPreferencesResolver', () => {
  let resolver: UserPreferencesResolver;
  let userPreferencesService: UserPreferencesService;

  const mockUserPreferencesService = {
    findByUserId: jest.fn(),
    completeOnboarding: jest.fn(),
    addSport: jest.fn(),
    getSportDataCount: jest.fn(),
    removeSport: jest.fn(),
  };

  const mockUserPreferences: UserPreferences = {
    id: 1,
    userId: 1,
    selectedSports: [SportType.RUN, SportType.RIDE],
    onboardingCompleted: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date(),
  };

  const mockTokenPayload: TokenPayload = {
    sub: 1,
    stravaId: 12345,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserPreferencesResolver, { provide: UserPreferencesService, useValue: mockUserPreferencesService }],
    }).compile();

    resolver = module.get<UserPreferencesResolver>(UserPreferencesResolver);
    userPreferencesService = module.get<UserPreferencesService>(UserPreferencesService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('userPreferences', () => {
    it('should return user preferences', async () => {
      mockUserPreferencesService.findByUserId.mockResolvedValue(mockUserPreferences);

      const result = await resolver.userPreferences(mockTokenPayload);

      expect(result).toEqual(mockUserPreferences);
      expect(userPreferencesService.findByUserId).toHaveBeenCalledWith(mockTokenPayload.sub);
    });

    it('should return null when preferences not found', async () => {
      mockUserPreferencesService.findByUserId.mockResolvedValue(null);

      const result = await resolver.userPreferences(mockTokenPayload);

      expect(result).toBeNull();
    });
  });

  describe('sportDataCount', () => {
    it('should return sport data count', async () => {
      const mockSportDataCount: SportDataCount = {
        activitiesCount: 10,
        goalsCount: 3,
      };

      mockUserPreferencesService.getSportDataCount.mockResolvedValue(mockSportDataCount);

      const result = await resolver.sportDataCount(mockTokenPayload, SportType.RUN);

      expect(result).toEqual(mockSportDataCount);
      expect(userPreferencesService.getSportDataCount).toHaveBeenCalledWith(mockTokenPayload.sub, SportType.RUN);
    });
  });

  describe('completeOnboarding', () => {
    it('should complete onboarding and return updated preferences', async () => {
      const completedPreferences: UserPreferences = {
        ...mockUserPreferences,
        onboardingCompleted: true,
      };

      mockUserPreferencesService.completeOnboarding.mockResolvedValue(completedPreferences);

      const result = await resolver.completeOnboarding(mockTokenPayload);

      expect(result).toEqual(completedPreferences);
      expect(userPreferencesService.completeOnboarding).toHaveBeenCalledWith(mockTokenPayload.sub);
    });

    it('should use userId from token payload', async () => {
      const differentTokenPayload: TokenPayload = {
        sub: 42,
        stravaId: 99999,
      };

      mockUserPreferencesService.completeOnboarding.mockResolvedValue(mockUserPreferences);

      await resolver.completeOnboarding(differentTokenPayload);

      expect(userPreferencesService.completeOnboarding).toHaveBeenCalledWith(42);
    });
  });

  describe('addSportToPreferences', () => {
    it('should add sport and return updated preferences', async () => {
      const updatedPreferences: UserPreferences = {
        ...mockUserPreferences,
        selectedSports: [SportType.RUN, SportType.RIDE, SportType.SWIM],
      };

      mockUserPreferencesService.addSport.mockResolvedValue(updatedPreferences);

      const result = await resolver.addSportToPreferences(mockTokenPayload, SportType.SWIM);

      expect(result).toEqual(updatedPreferences);
      expect(userPreferencesService.addSport).toHaveBeenCalledWith(mockTokenPayload.sub, SportType.SWIM);
    });

    it('should use userId from token payload', async () => {
      const differentTokenPayload: TokenPayload = {
        sub: 42,
        stravaId: 99999,
      };

      mockUserPreferencesService.addSport.mockResolvedValue(mockUserPreferences);

      await resolver.addSportToPreferences(differentTokenPayload, SportType.RUN);

      expect(userPreferencesService.addSport).toHaveBeenCalledWith(42, SportType.RUN);
    });
  });

  describe('removeSportFromPreferences', () => {
    it('should remove sport from preferences with deleteData true', async () => {
      mockUserPreferencesService.removeSport.mockResolvedValue(true);

      const result = await resolver.removeSportFromPreferences(mockTokenPayload, SportType.RUN, true);

      expect(result).toBe(true);
      expect(userPreferencesService.removeSport).toHaveBeenCalledWith(mockTokenPayload.sub, SportType.RUN, true);
    });

    it('should remove sport from preferences with deleteData false', async () => {
      mockUserPreferencesService.removeSport.mockResolvedValue(true);

      const result = await resolver.removeSportFromPreferences(mockTokenPayload, SportType.RIDE, false);

      expect(result).toBe(true);
      expect(userPreferencesService.removeSport).toHaveBeenCalledWith(mockTokenPayload.sub, SportType.RIDE, false);
    });
  });
});
