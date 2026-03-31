import { TranslationHelper } from './translation.helper';

describe('TranslationHelper', () => {
  const mockTranslations = [
    {
      locale: 'en',
      title: 'Run 50km',
      description: 'Complete 50km of running',
    },
    {
      locale: 'fr',
      title: 'Courir 50km',
      description: 'Compléter 50km de course',
    },
    {
      locale: 'de',
      title: 'Laufe 50km',
      description: null,
    },
  ];

  describe('selectTranslation', () => {
    it('should return exact locale match', () => {
      const result = TranslationHelper.selectTranslation(mockTranslations, 'fr');
      expect(result.title).toBe('Courir 50km');
      expect(result.description).toBe('Compléter 50km de course');
    });

    it('should return language fallback (fr-FR → fr)', () => {
      const result = TranslationHelper.selectTranslation(mockTranslations, 'fr-FR');
      expect(result.title).toBe('Courir 50km');
    });

    it('should return fallback locale when requested locale not found', () => {
      const result = TranslationHelper.selectTranslation(mockTranslations, 'es');
      expect(result.title).toBe('Run 50km');
      expect(result.description).toBe('Complete 50km of running');
    });

    it('should handle null description', () => {
      const result = TranslationHelper.selectTranslation(mockTranslations, 'de');
      expect(result.title).toBe('Laufe 50km');
      expect(result.description).toBeUndefined();
    });

    it('should return first translation when fallback not found', () => {
      const noEnglish = mockTranslations.slice(1);
      const result = TranslationHelper.selectTranslation(noEnglish, 'es');
      expect(result.title).toBe('Courir 50km');
    });

    it('should throw error when no translations available', () => {
      expect(() => TranslationHelper.selectTranslation([], 'en')).toThrow('No translations available');
    });

    it('should handle partial language match (fr-CA → fr)', () => {
      const result = TranslationHelper.selectTranslation(mockTranslations, 'fr-CA');
      expect(result.title).toBe('Courir 50km');
      expect(result.description).toBe('Compléter 50km de course');
    });

    it('should handle custom fallback locale', () => {
      const customTranslations = [
        { locale: 'es', title: 'Correr 50km', description: 'Completar 50km corriendo' },
        { locale: 'fr', title: 'Courir 50km', description: 'Compléter 50km de course' },
      ];

      const result = TranslationHelper.selectTranslation(customTranslations, 'de', 'es');
      expect(result.title).toBe('Correr 50km');
      expect(result.description).toBe('Completar 50km corriendo');
    });

    it('should handle title-only translation (no description)', () => {
      const titleOnlyTranslations = [
        { locale: 'en', title: 'Run 50km', description: null },
        { locale: 'fr', title: 'Courir 50km', description: null },
      ];

      const result = TranslationHelper.selectTranslation(titleOnlyTranslations, 'en');
      expect(result.title).toBe('Run 50km');
      expect(result.description).toBeUndefined();
    });

    it('should handle description-only translation', () => {
      const descriptionOnlyTranslations = [
        { locale: 'en', title: '', description: 'Complete 50km of running' },
        { locale: 'fr', title: '', description: 'Compléter 50km de course' },
      ];

      const result = TranslationHelper.selectTranslation(descriptionOnlyTranslations, 'en');
      expect(result.title).toBe('');
      expect(result.description).toBe('Complete 50km of running');
    });

    it('should match locale case-insensitively', () => {
      const uppercaseTranslations = [
        { locale: 'EN', title: 'Run 50km', description: 'English description' },
        { locale: 'FR', title: 'Courir 50km', description: 'Description française' },
      ];

      const resultLowercase = TranslationHelper.selectTranslation(uppercaseTranslations, 'fr');
      expect(resultLowercase.title).toBe('Courir 50km');

      const resultUppercase = TranslationHelper.selectTranslation(uppercaseTranslations, 'EN');
      expect(resultUppercase.title).toBe('Run 50km');

      const resultMixed = TranslationHelper.selectTranslation(uppercaseTranslations, 'Fr');
      expect(resultMixed.title).toBe('Courir 50km');
    });

    it('should match language prefix case-insensitively', () => {
      const uppercaseTranslations = [
        { locale: 'EN', title: 'Run 50km', description: 'English description' },
        { locale: 'FR', title: 'Courir 50km', description: 'Description française' },
      ];

      const result = TranslationHelper.selectTranslation(uppercaseTranslations, 'fr-CA');
      expect(result.title).toBe('Courir 50km');
    });
  });
});
