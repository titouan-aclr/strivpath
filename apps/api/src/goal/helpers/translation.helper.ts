import { GoalTemplateTranslation as PrismaGoalTemplateTranslation } from '@prisma/client';

export interface TranslationResult {
  title: string;
  description?: string;
}

export class TranslationHelper {
  static selectTranslation(
    translations: Pick<PrismaGoalTemplateTranslation, 'locale' | 'title' | 'description'>[],
    locale: string,
    fallbackLocale = 'en',
  ): TranslationResult {
    if (translations.length === 0) {
      throw new Error('No translations available');
    }

    const normalizedLocale = locale.toLowerCase();
    const normalizedFallback = fallbackLocale.toLowerCase();

    const exactMatch = translations.find(t => t.locale.toLowerCase() === normalizedLocale);
    if (exactMatch) {
      return {
        title: exactMatch.title,
        description: exactMatch.description ?? undefined,
      };
    }

    const languageCode = normalizedLocale.split('-')[0];
    const languageMatch = translations.find(t => t.locale.toLowerCase().startsWith(languageCode));
    if (languageMatch) {
      return {
        title: languageMatch.title,
        description: languageMatch.description ?? undefined,
      };
    }

    const fallbackMatch = translations.find(t => t.locale.toLowerCase() === normalizedFallback);
    if (fallbackMatch) {
      return {
        title: fallbackMatch.title,
        description: fallbackMatch.description ?? undefined,
      };
    }

    const firstTranslation = translations[0];
    return {
      title: firstTranslation.title,
      description: firstTranslation.description ?? undefined,
    };
  }
}
