import { UserPreferences as PrismaUserPreferences } from '@prisma/client';
import { UserPreferences as GraphQLUserPreferences } from './models/user-preferences.model';
import { SportType } from './enums/sport-type.enum';
import { LocaleType } from './enums/locale-type.enum';
import { ThemeType } from './enums/theme-type.enum';

export class UserPreferencesMapper {
  static toGraphQL(prismaPreferences: PrismaUserPreferences): GraphQLUserPreferences {
    const selectedSportsJson = prismaPreferences.selectedSports as string[];

    return {
      id: prismaPreferences.id,
      userId: prismaPreferences.userId,
      selectedSports: selectedSportsJson as unknown as SportType[],
      onboardingCompleted: prismaPreferences.onboardingCompleted,
      locale: prismaPreferences.locale as LocaleType,
      theme: prismaPreferences.theme as ThemeType,
      createdAt: prismaPreferences.createdAt,
      updatedAt: prismaPreferences.updatedAt,
    };
  }
}
