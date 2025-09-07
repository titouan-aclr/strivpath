import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-oauth2';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class StravaStrategy extends PassportStrategy(Strategy, 'strava') {
  constructor(
    private readonly httpService: HttpService,
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

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: Function,
  ) {
    try {
      // récupérer l’athlète depuis l’API Strava
      const { data } = await firstValueFrom(
        this.httpService.get('https://www.strava.com/api/v3/athlete', {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
      );

      const user = {
        ...data,
        accessToken,
        refreshToken,
      };

      done(null, user);
    } catch (error) {
      done(error, false);
    }
  }
}
