import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-oauth2';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ConfigService } from '@nestjs/config';
import { User } from '@repo/graphql-types';
import { UserService } from '../../user/user.service';
import { UserMapper } from '../../user/user.mapper';
import { StravaAthleteResponse } from '../types';

@Injectable()
export class StravaStrategy extends PassportStrategy(Strategy, 'strava') {
  constructor(
    private readonly httpService: HttpService,
    private readonly userService: UserService,
    configService: ConfigService,
  ) {
    super({
      authorizationURL: 'https://www.strava.com/oauth/authorize',
      tokenURL: 'https://www.strava.com/oauth/token',
      clientID: configService.getOrThrow<string>('STRAVA_CLIENT_ID'),
      clientSecret: configService.getOrThrow<string>('STRAVA_CLIENT_SECRET'),
      callbackURL: configService.getOrThrow<string>('STRAVA_REDIRECT_URI'),
      scope: 'read,activity:read,profile:read_all',
    });
  }

  async validate(accessToken: string, refreshToken: string): Promise<User> {
    const { data } = await firstValueFrom(
      this.httpService.get<StravaAthleteResponse>('https://www.strava.com/api/v3/athlete', {
        headers: { Authorization: `Bearer ${accessToken}` },
      }),
    );

    const prismaUser = await this.userService.findByStravaId(data.id);

    if (!prismaUser) {
      const newUser = await this.userService.createWithTokens(
        {
          stravaId: data.id,
          username: data.username,
          firstname: data.firstname,
          lastname: data.lastname,
          sex: data.sex,
          city: data.city,
          country: data.country,
          profile: data.profile,
          profileMedium: data.profile_medium,
        },
        {
          accessToken,
          refreshToken,
          expiresAt: data.expires_at ?? Math.floor(Date.now() / 1000) + 21600,
        },
      );
      return UserMapper.toGraphQL(newUser);
    }

    await this.userService.updateTokens(prismaUser.id, {
      accessToken,
      refreshToken,
      expiresAt: data.expires_at ?? Math.floor(Date.now() / 1000) + 21600,
    });

    return UserMapper.toGraphQL(prismaUser);
  }
}
