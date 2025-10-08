import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return await this.prisma.user.findMany();
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
}
