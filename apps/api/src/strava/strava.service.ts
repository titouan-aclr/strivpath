import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom, catchError, throwError } from 'rxjs';
import { AxiosResponse } from 'axios';
import { StravaTokenResponse, StravaAthleteResponse } from './types';
import { HttpError } from '../common/types';

@Injectable()
export class StravaService {
  private readonly STRAVA_API_BASE = 'https://www.strava.com';

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async exchangeCodeForToken(code: string): Promise<StravaTokenResponse> {
    const response = (await firstValueFrom(
      this.httpService
        .post<StravaTokenResponse>(`${this.STRAVA_API_BASE}/oauth/token`, {
          client_id: this.configService.getOrThrow<string>('STRAVA_CLIENT_ID'),
          client_secret: this.configService.getOrThrow<string>('STRAVA_CLIENT_SECRET'),
          code,
          grant_type: 'authorization_code',
        })
        .pipe(this.handleStravaError('token exchange')),
    )) as AxiosResponse<StravaTokenResponse>;

    return response.data;
  }

  async getAthlete(accessToken: string): Promise<StravaAthleteResponse> {
    const response = (await firstValueFrom(
      this.httpService
        .get<StravaAthleteResponse>(`${this.STRAVA_API_BASE}/api/v3/athlete`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
        .pipe(this.handleStravaError('athlete fetch')),
    )) as AxiosResponse<StravaAthleteResponse>;

    return response.data;
  }

  private handleStravaError(operation: string) {
    return catchError((error: HttpError) => {
      if (error.response?.status === 401) {
        return throwError(() => new UnauthorizedException(`Strava authentication failed: ${operation}`));
      }
      if (error.response?.status === 400) {
        return throwError(() => new BadRequestException(`Invalid Strava request: ${operation}`));
      }
      return throwError(() => error);
    });
  }
}
