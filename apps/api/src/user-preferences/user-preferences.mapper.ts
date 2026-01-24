import { UserPreferences as PrismaUserPreferences } from '@prisma/client';
import { UserPreferences as GraphQLUserPreferences } from './models/user-preferences.model';
import { SportType } from './enums/sport-type.enum';

export class UserPreferencesMapper {
  static toGraphQL(prismaPreferences: PrismaUserPreferences): GraphQLUserPreferences {
    const selectedSportsJson = prismaPreferences.selectedSports as string[];

    return {
      id: prismaPreferences.id,
      userId: prismaPreferences.userId,
      selectedSports: selectedSportsJson as unknown as SportType[],
      onboardingCompleted: prismaPreferences.onboardingCompleted,
      createdAt: prismaPreferences.createdAt,
      updatedAt: prismaPreferences.updatedAt,
    };
  }
}
