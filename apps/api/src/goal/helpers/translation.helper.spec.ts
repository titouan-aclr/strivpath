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
  });
});
