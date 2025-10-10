import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom, catchError, throwError } from 'rxjs';
import { AxiosResponse } from 'axios';
import { StravaTokenResponse, StravaAthleteResponse, StravaActivitySummary } from './types';
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

  async getActivities(
    accessToken: string,
    params?: {
      page?: number;
      per_page?: number;
      before?: number;
      after?: number;
    },
  ): Promise<StravaActivitySummary[]> {
    const response = (await firstValueFrom(
      this.httpService
        .get<StravaActivitySummary[]>(`${this.STRAVA_API_BASE}/api/v3/athlete/activities`, {
          headers: { Authorization: `Bearer ${accessToken}` },
          params: {
            page: params?.page ?? 1,
            per_page: params?.per_page ?? 30,
            before: params?.before,
            after: params?.after,
          },
        })
        .pipe(this.handleStravaError('activities fetch')),
    )) as AxiosResponse<StravaActivitySummary[]>;

    return response.data;
  }

  async refreshStravaToken(refreshToken: string): Promise<StravaTokenResponse> {
    const response = (await firstValueFrom(
      this.httpService
        .post<StravaTokenResponse>(`${this.STRAVA_API_BASE}/oauth/token`, {
          client_id: this.configService.getOrThrow<string>('STRAVA_CLIENT_ID'),
          client_secret: this.configService.getOrThrow<string>('STRAVA_CLIENT_SECRET'),
          refresh_token: refreshToken,
          grant_type: 'refresh_token',
        })
        .pipe(this.handleStravaError('token refresh')),
    )) as AxiosResponse<StravaTokenResponse>;

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
