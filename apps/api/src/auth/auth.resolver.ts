import { Resolver, Query, Mutation, Args, Context } from '@nestjs/graphql';
import { UseGuards, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { User, AuthResponse, AuthenticateWithStravaInput } from '@repo/graphql-types';
import { AuthService } from './auth.service';
import { StravaService } from '../strava/strava.service';
import { UserService } from '../user/user.service';
import { GqlAuthGuard } from './guards/gql-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { TokenPayload } from './types';
import { GraphQLContext } from '../common/types';

@Resolver()
export class AuthResolver {
  constructor(
    private readonly authService: AuthService,
    private readonly stravaService: StravaService,
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

  @Mutation(() => AuthResponse, { description: 'Authenticate with Strava OAuth code' })
  async authenticateWithStrava(
    @Args('input') input: AuthenticateWithStravaInput,
    @Context() context: GraphQLContext,
  ): Promise<AuthResponse> {
    const stravaTokens = await this.stravaService.exchangeCodeForToken(input.code);

    const athlete = stravaTokens.athlete;

    const user = await this.userService.upsertFromStrava(athlete, stravaTokens);

    const { accessToken, refreshToken } = await this.authService.generateTokens(user);

    this.setAccessTokenCookie(context.res, accessToken);
    this.setRefreshTokenCookie(context.res, refreshToken);

    return { user };
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

    this.setAccessTokenCookie(context.res, accessToken);
    this.setRefreshTokenCookie(context.res, newRefreshToken);

    return { user };
  }

  @Mutation(() => Boolean, { description: 'Logout and revoke refresh token' })
  async logout(@Context() context: GraphQLContext): Promise<boolean> {
    const refreshToken = context.req.cookies?.RefreshToken as string | undefined;

    if (refreshToken) {
      await this.authService.revokeRefreshToken(refreshToken);
    }

    this.clearAccessTokenCookie(context.res);
    this.clearRefreshTokenCookie(context.res);

    return true;
  }

  private setAccessTokenCookie(res: GraphQLContext['res'], accessToken: string): void {
    const isProduction = this.configService.get('NODE_ENV') === 'production';

    // TODO: verify config before prod, sameSite: strict
    res.cookie('Authentication', accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: 15 * 60 * 1000,
      path: '/',
    });
  }

  private clearAccessTokenCookie(res: GraphQLContext['res']): void {
    res.clearCookie('Authentication');
  }

  private setRefreshTokenCookie(res: GraphQLContext['res'], refreshToken: string): void {
    const isProduction = this.configService.get('NODE_ENV') === 'production';

    // TODO: verify config before prod, sameSite: strict
    res.cookie('RefreshToken', refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });
  }

  private clearRefreshTokenCookie(res: GraphQLContext['res']): void {
    res.clearCookie('RefreshToken');
  }
}
