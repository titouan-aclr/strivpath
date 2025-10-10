import { Resolver, Query, Mutation, Args, Context } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { User, AuthResponse, AuthenticateWithStravaInput, RefreshTokenInput } from '@repo/graphql-types';
import { AuthService } from './auth.service';
import { StravaService } from '../strava/strava.service';
import { UserService } from '../user/user.service';
import { GqlAuthGuard } from './guards/gql-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { TokenPayload } from './types';

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
    const clientId = this.configService.getOrThrow('STRAVA_CLIENT_ID');
    const redirectUri = this.configService.getOrThrow('STRAVA_REDIRECT_URI');
    const scope = 'read,activity:read_all,profile:read_all';

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
    @Context() context: { res: Response },
  ): Promise<AuthResponse> {
    const stravaTokens = await this.stravaService.exchangeCodeForToken(input.code);

    const athlete = stravaTokens.athlete;

    const user = await this.userService.upsertFromStrava(athlete, stravaTokens);

    const { accessToken, refreshToken } = await this.authService.generateTokens(user);

    this.setAccessTokenCookie(context.res, accessToken);

    return { accessToken, refreshToken, user };
  }

  @Mutation(() => AuthResponse, { description: 'Refresh access token using refresh token' })
  async refreshToken(
    @Args('input') input: RefreshTokenInput,
    @Context() context: { res: Response },
  ): Promise<AuthResponse> {
    const { accessToken, refreshToken, user } = await this.authService.refreshAccessToken(input.refreshToken);

    this.setAccessTokenCookie(context.res, accessToken);

    return { accessToken, refreshToken, user };
  }

  @Mutation(() => Boolean, { description: 'Logout and revoke refresh token' })
  async logout(@Args('refreshToken') refreshToken: string, @Context() context: { res: Response }): Promise<boolean> {
    await this.authService.revokeRefreshToken(refreshToken);

    this.clearAccessTokenCookie(context.res);

    return true;
  }

  private setAccessTokenCookie(res: Response, accessToken: string): void {
    const isProduction = this.configService.get('NODE_ENV') === 'production';

    res.cookie('Authentication', accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000,
    });
  }

  private clearAccessTokenCookie(res: Response): void {
    res.clearCookie('Authentication');
  }
}
