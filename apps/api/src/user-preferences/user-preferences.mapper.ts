import { UserPreferences as PrismaUserPreferences } from '@prisma/client';
import { UserPreferences as GraphQLUserPreferences, SportType, ThemeType } from '@repo/graphql-types';

export class UserPreferencesMapper {
  static toGraphQL(prismaPreferences: PrismaUserPreferences): GraphQLUserPreferences {
    const selectedSportsJson = prismaPreferences.selectedSports as string[];

    return {
      id: prismaPreferences.id,
      userId: prismaPreferences.userId,
      selectedSports: selectedSportsJson as unknown as SportType[],
      onboardingCompleted: prismaPreferences.onboardingCompleted,
      locale: prismaPreferences.locale,
      theme: prismaPreferences.theme as ThemeType,
      createdAt: prismaPreferences.createdAt,
      updatedAt: prismaPreferences.updatedAt,
    };
  }
}
