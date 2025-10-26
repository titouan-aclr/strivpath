import { Injectable, NotFoundException } from '@nestjs/common';
import { UserPreferences, UpdateUserPreferencesInput } from '@repo/graphql-types';
import { PrismaService } from '../database/prisma.service';
import { UserPreferencesMapper } from './user-preferences.mapper';

@Injectable()
export class UserPreferencesService {
  constructor(private readonly prisma: PrismaService) {}

  async findByUserId(userId: number): Promise<UserPreferences | null> {
    const prismaPreferences = await this.prisma.userPreferences.findUnique({
      where: { userId },
    });

    return prismaPreferences ? UserPreferencesMapper.toGraphQL(prismaPreferences) : null;
  }

  async update(userId: number, input: UpdateUserPreferencesInput): Promise<UserPreferences> {
    const existingPreferences = await this.prisma.userPreferences.findUnique({
      where: { userId },
    });

    if (!existingPreferences) {
      throw new NotFoundException(`User preferences not found for user ${userId}`);
    }

    const shouldCompleteOnboarding =
      input.selectedSports && input.selectedSports.length > 0 && !existingPreferences.onboardingCompleted;

    const updateData: {
      selectedSports?: string[];
      locale?: string;
      theme?: string;
      onboardingCompleted?: boolean;
    } = {};

    if (input.selectedSports !== undefined) {
      updateData.selectedSports = input.selectedSports as unknown as string[];
    }

    if (input.locale !== undefined) {
      updateData.locale = input.locale;
    }

    if (input.theme !== undefined) {
      updateData.theme = input.theme;
    }

    if (shouldCompleteOnboarding) {
      updateData.onboardingCompleted = true;
    }

    const updatedPreferences = await this.prisma.userPreferences.update({
      where: { userId },
      data: updateData,
    });

    return UserPreferencesMapper.toGraphQL(updatedPreferences);
  }
}
