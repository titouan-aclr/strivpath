import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { UserPreferences } from './models/user-preferences.model';
import { SportDataCount } from './models/sport-data-count.model';
import { PrismaService } from '../database/prisma.service';
import { UserPreferencesMapper } from './user-preferences.mapper';
import { SportType } from './enums/sport-type.enum';

@Injectable()
export class UserPreferencesService {
  constructor(private readonly prisma: PrismaService) {}

  async findByUserId(userId: number): Promise<UserPreferences | null> {
    const prismaPreferences = await this.prisma.userPreferences.findUnique({
      where: { userId },
    });

    return prismaPreferences ? UserPreferencesMapper.toGraphQL(prismaPreferences) : null;
  }

  async completeOnboarding(userId: number): Promise<UserPreferences> {
    const preferences = await this.prisma.userPreferences.findUnique({
      where: { userId },
    });

    if (!preferences) {
      throw new NotFoundException('User preferences not found');
    }

    if (preferences.onboardingCompleted) {
      return UserPreferencesMapper.toGraphQL(preferences);
    }

    const selectedSports = preferences.selectedSports as string[];
    if (selectedSports.length === 0) {
      throw new BadRequestException('Cannot complete onboarding without selecting at least one sport');
    }

    const updatedPreferences = await this.prisma.userPreferences.update({
      where: { userId },
      data: { onboardingCompleted: true },
    });

    return UserPreferencesMapper.toGraphQL(updatedPreferences);
  }

  async addSport(userId: number, sport: SportType): Promise<UserPreferences> {
    const preferences = await this.prisma.userPreferences.findUnique({
      where: { userId },
    });

    if (!preferences) {
      throw new NotFoundException('User preferences not found');
    }

    const currentSports = preferences.selectedSports as string[];

    if (currentSports.includes(sport)) {
      throw new BadRequestException(`Sport ${sport} is already in user preferences`);
    }

    const updatedSports = [...currentSports, sport];

    const updatedPreferences = await this.prisma.userPreferences.update({
      where: { userId },
      data: { selectedSports: updatedSports },
    });

    return UserPreferencesMapper.toGraphQL(updatedPreferences);
  }

  async getSportDataCount(userId: number, sport: SportType): Promise<SportDataCount> {
    const [activitiesCount, goalsCount] = await Promise.all([
      this.prisma.activity.count({ where: { userId, type: sport } }),
      this.prisma.goal.count({ where: { userId, sportType: sport } }),
    ]);

    return { activitiesCount, goalsCount };
  }

  async removeSport(userId: number, sport: SportType, deleteData: boolean): Promise<boolean> {
    const preferences = await this.prisma.userPreferences.findUnique({ where: { userId } });

    if (!preferences) {
      throw new NotFoundException('User preferences not found');
    }

    const currentSports = preferences.selectedSports as string[];

    if (!currentSports.includes(sport)) {
      throw new BadRequestException(`Sport ${sport} is not in user preferences`);
    }

    const updatedSports = currentSports.filter(s => s !== (sport as string));

    if (updatedSports.length === 0) {
      throw new BadRequestException('Cannot remove last sport - at least one sport must be selected');
    }

    await this.prisma.$transaction(async tx => {
      await tx.userPreferences.update({
        where: { userId },
        data: { selectedSports: updatedSports },
      });

      if (deleteData) {
        await tx.activity.deleteMany({ where: { userId, type: sport } });
        await tx.goal.deleteMany({ where: { userId, sportType: sport } });
      } else {
        await tx.goal.updateMany({
          where: { userId, sportType: sport, status: { not: 'ARCHIVED' } },
          data: { status: 'ARCHIVED' },
        });
      }
    });

    return true;
  }
}
