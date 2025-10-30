import { UserPreferencesMapper } from './user-preferences.mapper';
import { createMockPrismaUserPreferences } from '../../test/mocks/factories';
import { SportType } from './enums/sport-type.enum';
import { ThemeType } from './enums/theme-type.enum';

describe('UserPreferencesMapper', () => {
  describe('toGraphQL', () => {
    it('should map all fields correctly', () => {
      const prismaPreferences = createMockPrismaUserPreferences({
        id: 1,
        userId: 10,
        selectedSports: ['Run', 'Ride'],
        onboardingCompleted: true,
        locale: 'fr',
        theme: 'dark',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
      });

      const result = UserPreferencesMapper.toGraphQL(prismaPreferences);

      expect(result).toEqual({
        id: 1,
        userId: 10,
        selectedSports: ['Run', 'Ride'] as unknown as SportType[],
        onboardingCompleted: true,
        locale: 'fr',
        theme: 'dark' as ThemeType,
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

    it('should preserve locale and theme values', () => {
      const prismaPreferences = createMockPrismaUserPreferences({
        locale: 'de',
        theme: 'light',
      });

      const result = UserPreferencesMapper.toGraphQL(prismaPreferences);

      expect(result.locale).toBe('de');
      expect(result.theme).toBe('light');
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
        locale: 'en',
        theme: 'system',
      });

      const result = UserPreferencesMapper.toGraphQL(prismaPreferences);

      expect(result.selectedSports).toEqual([]);
      expect(result.onboardingCompleted).toBe(false);
      expect(result.locale).toBe('en');
      expect(result.theme).toBe('system');
    });

    it('should handle theme variations correctly', () => {
      const systemTheme = createMockPrismaUserPreferences({ theme: 'system' });
      const lightTheme = createMockPrismaUserPreferences({ theme: 'light' });
      const darkTheme = createMockPrismaUserPreferences({ theme: 'dark' });

      expect(UserPreferencesMapper.toGraphQL(systemTheme).theme).toBe('system');
      expect(UserPreferencesMapper.toGraphQL(lightTheme).theme).toBe('light');
      expect(UserPreferencesMapper.toGraphQL(darkTheme).theme).toBe('dark');
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

    it('should handle various locale codes', () => {
      const locales = ['en', 'fr', 'de', 'es', 'it', 'pt', 'nl', 'ru', 'ja', 'zh'];

      locales.forEach(locale => {
        const prismaPreferences = createMockPrismaUserPreferences({ locale });
        const result = UserPreferencesMapper.toGraphQL(prismaPreferences);
        expect(result.locale).toBe(locale);
      });
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
