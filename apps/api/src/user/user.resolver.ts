import { Resolver, Query, Args, Int } from '@nestjs/graphql';
import { User } from './models/user.model';
import { UserService } from './user.service';
import { UserMapper } from './user.mapper';

@Resolver(() => User)
export class UserResolver {
  constructor(private readonly userService: UserService) {}

  @Query(() => [User])
  async users(): Promise<User[]> {
    const prismaUsers = await this.userService.findAll();
    return prismaUsers.map(user => UserMapper.toGraphQL(user));
  }

  @Query(() => User, { nullable: true })
  async userByStravaId(@Args('stravaId', { type: () => Int }) stravaId: number): Promise<User | null> {
    const prismaUser = await this.userService.findByStravaId(stravaId);
    return prismaUser ? UserMapper.toGraphQL(prismaUser) : null;
  }
}
