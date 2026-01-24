import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { User } from './models/user.model';
import { PrismaService } from '../database/prisma.service';
import { UserMapper } from './user.mapper';
import { StravaAthleteResponse, StravaTokenResponse } from '../strava/types';
import { SportType } from '../user-preferences/enums/sport-type.enum';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return await this.prisma.user.findMany();
  }

  async findById(id: number): Promise<User | null> {
    const prismaUser = await this.prisma.user.findUnique({
      where: { id },
    });

    return prismaUser ? UserMapper.toGraphQL(prismaUser) : null;
  }

  async findByStravaId(stravaId: number) {
    return await this.prisma.user.findUnique({
      where: { stravaId },
      include: { tokens: { orderBy: { createdAt: 'desc' }, take: 1 } },
    });
  }

  async createWithTokens(userData: Prisma.UserCreateInput, tokenData: Prisma.StravaTokenCreateWithoutUserInput) {
    return await this.prisma.user.create({
      data: {
        ...userData,
        tokens: {
          create: tokenData,
        },
      },
      include: { tokens: true },
    });
  }

  async updateTokens(userId: number, tokenData: Prisma.StravaTokenCreateWithoutUserInput) {
    return await this.prisma.stravaToken.create({
      data: { ...tokenData, userId },
    });
  }

  async upsertFromStrava(athlete: StravaAthleteResponse, stravaTokens: StravaTokenResponse): Promise<User> {
    const existingUser = await this.prisma.user.findUnique({
      where: { stravaId: athlete.id },
    });

    if (existingUser) {
      const updatedUser = await this.prisma.user.update({
        where: { id: existingUser.id },
        data: {
          username: athlete.username,
          firstname: athlete.firstname,
          lastname: athlete.lastname,
          sex: athlete.sex,
          city: athlete.city,
          country: athlete.country,
          profile: athlete.profile,
          profileMedium: athlete.profile_medium,
          tokens: {
            create: {
              accessToken: stravaTokens.access_token,
              refreshToken: stravaTokens.refresh_token,
              expiresAt: stravaTokens.expires_at,
            },
          },
        },
      });

      return UserMapper.toGraphQL(updatedUser);
    }

    const newUser = await this.prisma.user.create({
      data: {
        stravaId: athlete.id,
        username: athlete.username,
        firstname: athlete.firstname,
        lastname: athlete.lastname,
        sex: athlete.sex,
        city: athlete.city,
        country: athlete.country,
        profile: athlete.profile,
        profileMedium: athlete.profile_medium,
        tokens: {
          create: {
            accessToken: stravaTokens.access_token,
            refreshToken: stravaTokens.refresh_token,
            expiresAt: stravaTokens.expires_at,
          },
        },
        preferences: {
          create: {
            selectedSports: [SportType.RUN],
            onboardingCompleted: false,
          },
        },
      },
    });

    return UserMapper.toGraphQL(newUser);
  }

  async deleteUserData(userId: number): Promise<boolean> {
    await this.prisma.$transaction([
      this.prisma.goal.deleteMany({ where: { userId } }),
      this.prisma.activity.deleteMany({ where: { userId } }),
      this.prisma.syncHistory.deleteMany({ where: { userId } }),
      this.prisma.userPreferences.update({
        where: { userId },
        data: { selectedSports: [SportType.RUN], onboardingCompleted: false },
      }),
    ]);
    return true;
  }

  async deleteAccount(userId: number): Promise<boolean> {
    await this.prisma.user.delete({ where: { id: userId } });
    return true;
  }
}
