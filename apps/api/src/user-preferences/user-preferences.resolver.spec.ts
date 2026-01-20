import { Test, TestingModule } from '@nestjs/testing';
import { UserPreferencesResolver } from './user-preferences.resolver';
import { UserPreferencesService } from './user-preferences.service';
import { UserPreferences } from './models/user-preferences.model';
import { SportType } from './enums/sport-type.enum';
import { TokenPayload } from '../auth/types';

describe('UserPreferencesResolver', () => {
  let resolver: UserPreferencesResolver;
  let userPreferencesService: UserPreferencesService;

  const mockUserPreferencesService = {
    findByUserId: jest.fn(),
    update: jest.fn(),
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

  describe('updateUserPreferences', () => {
    it('should update user preferences and return updated data', async () => {
      const input = {
        selectedSports: [SportType.RUN, SportType.SWIM],
      };

      const updatedPreferences: UserPreferences = {
        ...mockUserPreferences,
        selectedSports: [SportType.RUN, SportType.SWIM],
      };

      mockUserPreferencesService.update.mockResolvedValue(updatedPreferences);

      const result = await resolver.updateUserPreferences(input, mockTokenPayload);

      expect(result).toEqual(updatedPreferences);
      expect(userPreferencesService.update).toHaveBeenCalledWith(mockTokenPayload.sub, input);
      expect(userPreferencesService.update).toHaveBeenCalledTimes(1);
    });

    it('should use userId from token payload (@CurrentUser decorator)', async () => {
      const input = { selectedSports: [SportType.RUN] };
      const tokenPayloadWithDifferentUser: TokenPayload = {
        sub: 42,
        stravaId: 99999,
      };

      mockUserPreferencesService.update.mockResolvedValue(mockUserPreferences);

      await resolver.updateUserPreferences(input, tokenPayloadWithDifferentUser);

      expect(userPreferencesService.update).toHaveBeenCalledWith(42, input);
    });

    it('should handle partial updates (only selectedSports)', async () => {
      const input = {
        selectedSports: [SportType.RIDE],
      };

      const updatedPreferences: UserPreferences = {
        ...mockUserPreferences,
        selectedSports: [SportType.RIDE],
      };

      mockUserPreferencesService.update.mockResolvedValue(updatedPreferences);

      const result = await resolver.updateUserPreferences(input, mockTokenPayload);

      expect(result.selectedSports).toEqual([SportType.RIDE]);
      expect(userPreferencesService.update).toHaveBeenCalledWith(1, input);
    });
  });
});
