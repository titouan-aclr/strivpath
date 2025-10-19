export interface BaseTokenPayload {
  sub: number;
  stravaId: number;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface AccessTokenPayload extends BaseTokenPayload {}

export interface RefreshTokenPayload extends BaseTokenPayload {
  jti: string;
}

export type TokenPayload = AccessTokenPayload | RefreshTokenPayload;
