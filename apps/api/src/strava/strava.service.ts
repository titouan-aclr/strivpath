import {
  Injectable,
  Inject,
  forwardRef,
  OnModuleInit,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom, catchError, throwError } from 'rxjs';
import { AxiosError, AxiosResponse } from 'axios';
import { StravaTokenResponse, StravaAthleteResponse, StravaActivitySummary } from './types';
import { StravaActivityDetail } from './types/strava-activity-detail.interface';
import { HttpError } from '../common/types';
import { StravaTokenService } from './strava-token.service';
import { StravaRateLimitService } from './strava-rate-limit.service';
import { StravaRateLimitExceededException } from './strava-rate-limit.exceptions';

@Injectable()
export class StravaService implements OnModuleInit {
  private readonly STRAVA_API_BASE = 'https://www.strava.com';

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    @Inject(forwardRef(() => StravaTokenService))
    private readonly stravaTokenService: StravaTokenService,
    private readonly stravaRateLimitService: StravaRateLimitService,
  ) {}

  onModuleInit(): void {
    this.httpService.axiosRef.interceptors.response.use(
      response => {
        this.stravaRateLimitService.updateFromHeaders(response.headers as Record<string, string>);
        return response;
      },
      (error: AxiosError) => {
        if (error.response?.headers) {
          this.stravaRateLimitService.updateFromHeaders(
            error.response.headers as Record<string, string | string[] | undefined>,
          );
        }
        return Promise.reject(error);
      },
    );
  }

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
    userId: number,
    params?: {
      page?: number;
      per_page?: number;
      before?: number;
      after?: number;
    },
  ): Promise<StravaActivitySummary[]> {
    this.checkRateLimitOrThrow('activities fetch');
    const accessToken = await this.stravaTokenService.getValidAccessToken(userId);

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

  async getActivityDetail(userId: number, activityId: number): Promise<StravaActivityDetail> {
    this.checkRateLimitOrThrow('activity detail fetch');
    const accessToken = await this.stravaTokenService.getValidAccessToken(userId);

    const response = (await firstValueFrom(
      this.httpService
        .get<StravaActivityDetail>(`${this.STRAVA_API_BASE}/api/v3/activities/${activityId}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
        .pipe(this.handleStravaError('activity detail fetch')),
    )) as AxiosResponse<StravaActivityDetail>;

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

  private checkRateLimitOrThrow(context: string): void {
    if (!this.stravaRateLimitService.isApproachingLimit()) return;
    const limitType = this.stravaRateLimitService.isApproachingDailyLimit() ? 'daily' : '15min';
    throw new StravaRateLimitExceededException(context, limitType);
  }

  private handleStravaError(operation: string) {
    return catchError((error: HttpError) => {
      if (error.response?.status === 429) {
        return throwError(() => new StravaRateLimitExceededException(operation));
      }
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
