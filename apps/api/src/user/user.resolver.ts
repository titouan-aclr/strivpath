import { Resolver, Mutation, Context } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { User } from './models/user.model';
import { UserService } from './user.service';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { TokenPayload } from '../auth/types';
import { AuthService } from '../auth/auth.service';
import { AuthCookieService } from '../auth/auth-cookie.service';
import { GraphQLContext } from '../common/types';

@Resolver(() => User)
export class UserResolver {
  constructor(
    private readonly userService: UserService,
    private readonly authService: AuthService,
    private readonly authCookieService: AuthCookieService,
  ) {}

  @Mutation(() => Boolean, { description: 'Delete all user data but keep account' })
  @UseGuards(GqlAuthGuard)
  async deleteUserData(@CurrentUser() tokenPayload: TokenPayload): Promise<boolean> {
    return this.userService.deleteUserData(tokenPayload.sub);
  }

  @Mutation(() => Boolean, { description: 'Permanently delete user account and all data' })
  @UseGuards(GqlAuthGuard)
  async deleteAccount(@CurrentUser() tokenPayload: TokenPayload, @Context() context: GraphQLContext): Promise<boolean> {
    await this.authService.revokeAllUserRefreshTokens(tokenPayload.sub);
    this.authCookieService.clearAllAuthCookies(context.res);
    return this.userService.deleteAccount(tokenPayload.sub);
  }
}
