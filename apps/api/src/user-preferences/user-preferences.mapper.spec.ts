import { UserPreferencesMapper } from './user-preferences.mapper';
import { createMockPrismaUserPreferences } from '../../test/mocks/factories';
import { SportType } from './enums/sport-type.enum';

describe('UserPreferencesMapper', () => {
  describe('toGraphQL', () => {
    it('should map all fields correctly', () => {
      const prismaPreferences = createMockPrismaUserPreferences({
        id: 1,
        userId: 10,
        selectedSports: ['Run', 'Ride'],
        onboardingCompleted: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
      });

      const result = UserPreferencesMapper.toGraphQL(prismaPreferences);

      expect(result).toEqual({
        id: 1,
        userId: 10,
        selectedSports: ['Run', 'Ride'] as unknown as SportType[],
        onboardingCompleted: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
      });
    });

    it('should transform selectedSports JSON to SportType array', () => {
      const prismaPreferences = createMockPrismaUserPreferences({
        selectedSports: ['Run', 'Ride', 'Swim'],
      });

      const result = UserPreferencesMapper.toGraphQL(prismaPreferences);

      expect(Array.isArray(result.selectedSports)).toBe(true);
      expect(result.selectedSports).toHaveLength(3);
      expect(result.selectedSports).toEqual(['Run', 'Ride', 'Swim']);
    });

    it('should handle empty selectedSports array', () => {
      const prismaPreferences = createMockPrismaUserPreferences({
        selectedSports: [],
      });

      const result = UserPreferencesMapper.toGraphQL(prismaPreferences);

      expect(result.selectedSports).toEqual([]);
      expect(Array.isArray(result.selectedSports)).toBe(true);
      expect(result.selectedSports).toHaveLength(0);
    });

    it('should map onboardingCompleted boolean correctly', () => {
      const completedPreferences = createMockPrismaUserPreferences({
        onboardingCompleted: true,
      });

      const resultCompleted = UserPreferencesMapper.toGraphQL(completedPreferences);

      expect(resultCompleted.onboardingCompleted).toBe(true);

      const notCompletedPreferences = createMockPrismaUserPreferences({
        onboardingCompleted: false,
      });

      const resultNotCompleted = UserPreferencesMapper.toGraphQL(notCompletedPreferences);

      expect(resultNotCompleted.onboardingCompleted).toBe(false);
    });

    it('should handle default preferences for new user', () => {
      const prismaPreferences = createMockPrismaUserPreferences({
        selectedSports: [],
        onboardingCompleted: false,
      });

      const result = UserPreferencesMapper.toGraphQL(prismaPreferences);

      expect(result.selectedSports).toEqual([]);
      expect(result.onboardingCompleted).toBe(false);
    });

    it('should handle single sport selection', () => {
      const prismaPreferences = createMockPrismaUserPreferences({
        selectedSports: ['Run'],
      });

      const result = UserPreferencesMapper.toGraphQL(prismaPreferences);

      expect(result.selectedSports).toHaveLength(1);
      expect(result.selectedSports[0]).toBe('Run');
    });

    it('should handle multiple sport types', () => {
      const prismaPreferences = createMockPrismaUserPreferences({
        selectedSports: ['Run', 'Ride', 'Swim', 'Hike', 'Walk'],
      });

      const result = UserPreferencesMapper.toGraphQL(prismaPreferences);

      expect(result.selectedSports).toHaveLength(5);
      expect(result.selectedSports).toContain('Run');
      expect(result.selectedSports).toContain('Ride');
      expect(result.selectedSports).toContain('Swim');
      expect(result.selectedSports).toContain('Hike');
      expect(result.selectedSports).toContain('Walk');
    });

    it('should preserve date objects without modification', () => {
      const createdAt = new Date('2023-05-20T10:00:00Z');
      const updatedAt = new Date('2024-01-15T14:30:00Z');

      const prismaPreferences = createMockPrismaUserPreferences({
        createdAt,
        updatedAt,
      });

      const result = UserPreferencesMapper.toGraphQL(prismaPreferences);

      expect(result.createdAt).toBe(createdAt);
      expect(result.updatedAt).toBe(updatedAt);
    });

    it('should maintain userId reference correctly', () => {
      const prismaPreferences = createMockPrismaUserPreferences({
        userId: 999,
      });

      const result = UserPreferencesMapper.toGraphQL(prismaPreferences);

      expect(result.userId).toBe(999);
    });
  });
});
