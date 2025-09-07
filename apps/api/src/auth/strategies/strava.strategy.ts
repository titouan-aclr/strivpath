import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-oauth2';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ConfigService } from '@nestjs/config';
import { UserService } from '../../user/user.service.js';

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

  async validate(accessToken: string, refreshToken: string) {
    // fetch user profile profile via Strava
    const { data } = await firstValueFrom(
      this.httpService.get('https://www.strava.com/api/v3/athlete', {
        headers: { Authorization: `Bearer ${accessToken}` },
      }),
    );

    let user = await this.userService.findByStravaId(data.id);

    if (!user) {
      // create
      user = await this.userService.createWithTokens(
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
    } else {
      // update tokens
      await this.userService.updateTokens(user.id, {
        accessToken,
        refreshToken,
        expiresAt: data.expires_at ?? Math.floor(Date.now() / 1000) + 21600,
      });
    }

    return user;
  }
}
