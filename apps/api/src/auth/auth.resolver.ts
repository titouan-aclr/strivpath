import { Resolver, Query, Mutation, Context } from '@nestjs/graphql';
import { UseGuards, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { User } from '../user/models/user.model';
import { AuthResponse } from './models/auth-response.model';
import { AuthService } from './auth.service';
import { AuthCookieService } from './auth-cookie.service';
import { UserService } from '../user/user.service';
import { GqlAuthGuard } from './guards/gql-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { TokenPayload } from './types';
import { GraphQLContext } from '../common/types';

@Resolver()
export class AuthResolver {
  constructor(
    private readonly authService: AuthService,
    private readonly authCookieService: AuthCookieService,
    private readonly userService: UserService,
    private readonly configService: ConfigService,
  ) {}

  @Query(() => String, { description: 'Generate Strava OAuth authorization URL' })
  stravaAuthUrl(): string {
    const clientId = this.configService.getOrThrow<string>('STRAVA_CLIENT_ID');
    const redirectUri = this.configService.getOrThrow<string>('STRAVA_REDIRECT_URI');
    const scope = 'read_all,activity:read_all,profile:read_all';

    return `https://www.strava.com/oauth/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&scope=${scope}`;
  }

  @Query(() => User, { nullable: true, description: 'Get current authenticated user' })
  @UseGuards(GqlAuthGuard)
  async currentUser(@CurrentUser() tokenPayload: TokenPayload): Promise<User | null> {
    return this.userService.findById(tokenPayload.sub);
  }

  @Mutation(() => AuthResponse, { description: 'Refresh access token using refresh token cookie' })
  async refreshToken(@Context() context: GraphQLContext): Promise<AuthResponse> {
    const refreshToken = context.req.cookies?.RefreshToken as string | undefined;

    if (!refreshToken) {
      throw new UnauthorizedException('No refresh token provided');
    }

    const {
      accessToken,
      refreshToken: newRefreshToken,
      user,
    } = await this.authService.refreshAccessToken(refreshToken);

    this.authCookieService.setAccessTokenCookie(context.res, accessToken);
    this.authCookieService.setRefreshTokenCookie(context.res, newRefreshToken);

    return { user };
  }

  @Mutation(() => Boolean, { description: 'Logout and revoke refresh token' })
  async logout(@Context() context: GraphQLContext): Promise<boolean> {
    const refreshToken = context.req.cookies?.RefreshToken as string | undefined;

    if (refreshToken) {
      await this.authService.revokeRefreshToken(refreshToken);
    }

    this.authCookieService.clearAllAuthCookies(context.res);

    return true;
  }
}
