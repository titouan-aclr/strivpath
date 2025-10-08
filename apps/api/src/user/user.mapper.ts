import { User as PrismaUser } from '@prisma/client';
import { User as GraphQLUser } from '@repo/graphql-types';

export class UserMapper {
  static toGraphQL(prismaUser: PrismaUser): GraphQLUser {
    return {
      id: prismaUser.id,
      stravaId: prismaUser.stravaId,
      username: prismaUser.username ?? undefined,
      firstname: prismaUser.firstname ?? undefined,
      lastname: prismaUser.lastname ?? undefined,
      sex: prismaUser.sex ?? undefined,
      city: prismaUser.city ?? undefined,
      country: prismaUser.country ?? undefined,
      profile: prismaUser.profile ?? undefined,
      profileMedium: prismaUser.profileMedium ?? undefined,
      createdAt: prismaUser.createdAt,
      updatedAt: prismaUser.updatedAt,
    };
  }
}
