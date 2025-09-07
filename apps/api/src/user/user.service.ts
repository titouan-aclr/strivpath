import { Inject, Injectable } from '@nestjs/common';
import { PrismaClient, Prisma } from '@repo/database';

@Injectable()
export class UserService {
  constructor(@Inject('PRISMA') private readonly prisma: PrismaClient) {}

  async findByStravaId(stravaId: number) {
    return this.prisma.user.findUnique({
      where: { stravaId },
      include: { tokens: { orderBy: { createdAt: 'desc' }, take: 1 } },
    });
  }

  async createWithTokens(
    userData: Prisma.UserCreateInput,
    tokenData: Prisma.StravaTokenCreateWithoutUserInput,
  ) {
    return this.prisma.user.create({
      data: {
        ...userData,
        tokens: {
          create: tokenData,
        },
      },
      include: { tokens: true },
    });
  }

  async updateTokens(
    userId: number,
    tokenData: Prisma.StravaTokenCreateWithoutUserInput,
  ) {
    return this.prisma.stravaToken.create({
      data: { ...tokenData, userId },
    });
  }
}
