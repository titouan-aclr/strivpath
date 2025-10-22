import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AppModule } from '../../src/app.module';
import { AuthService } from '../../src/auth/auth.service';
import { PrismaService } from '../../src/database/prisma.service';
import { getTestPrismaClient, seedTestUser, generateTestAccessToken } from '../test-db';
import { User } from '@repo/graphql-types';

describe('GraphQL Auth Integration', () => {
  let app: INestApplication;
  let authService: AuthService;
  let jwtService: JwtService;
  let configService: ConfigService;
  let prisma: ReturnType<typeof getTestPrismaClient>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    app.use(cookieParser());

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    app.enableCors({
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      credentials: true,
    });

    await app.init();

    authService = moduleFixture.get<AuthService>(AuthService);
    jwtService = moduleFixture.get<JwtService>(JwtService);
    configService = moduleFixture.get<ConfigService>(ConfigService);
    prisma = getTestPrismaClient();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('currentUser query', () => {
    it('should return user when authenticated with valid access token', async () => {
      const { user } = await seedTestUser();
      const accessToken = generateTestAccessToken(user.id, user.stravaId);

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .set('Cookie', `Authentication=${accessToken}`)
        .send({
          query: `
            query {
              currentUser {
                id
                stravaId
                username
                firstname
                lastname
              }
            }
          `,
        });

      expect(response.status).toBe(200);
      expect(response.body.errors).toBeUndefined();
      expect(response.body.data.currentUser).toBeDefined();
      expect(Number(response.body.data.currentUser.id)).toBe(user.id);
      expect(response.body.data.currentUser.stravaId).toBe(user.stravaId);
      expect(response.body.data.currentUser.username).toBe(user.username);
    });

    it('should return 401 when access token missing', async () => {
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `
            query {
              currentUser {
                id
                stravaId
                username
              }
            }
          `,
        });

      expect(response.status).toBe(200);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toContain('Unauthorized');
      expect(response.body.errors[0].extensions?.code).toBe('UNAUTHENTICATED');
    });

    it('should return 401 when access token expired', async () => {
      const { user } = await seedTestUser();

      const expiredToken = jwtService.sign(
        { sub: user.id, stravaId: user.stravaId },
        {
          secret: configService.getOrThrow('JWT_ACCESS_TOKEN_SECRET'),
          expiresIn: '0s',
        },
      );

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .set('Cookie', `Authentication=${expiredToken}`)
        .send({
          query: `
            query {
              currentUser {
                id
              }
            }
          `,
        });

      expect(response.status).toBe(200);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toContain('Unauthorized');
    });

    it('should return 401 when access token has invalid signature', async () => {
      const { user } = await seedTestUser();

      const invalidToken = jwtService.sign(
        { sub: user.id, stravaId: user.stravaId },
        {
          secret: 'wrong-secret',
          expiresIn: '15m',
        },
      );

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .set('Cookie', `Authentication=${invalidToken}`)
        .send({
          query: `
            query {
              currentUser {
                id
              }
            }
          `,
        });

      expect(response.status).toBe(200);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toContain('Unauthorized');
    });

    it('should return null when user deleted after token issued', async () => {
      const { user } = await seedTestUser();
      const accessToken = generateTestAccessToken(user.id, user.stravaId);

      await prisma.user.delete({ where: { id: user.id } });

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .set('Cookie', `Authentication=${accessToken}`)
        .send({
          query: `
            query {
              currentUser {
                id
              }
            }
          `,
        });

      expect(response.status).toBe(200);
      expect(response.body.errors).toBeUndefined();
      expect(response.body.data.currentUser).toBeNull();
    });
  });

  describe('refreshToken mutation', () => {
    it('should refresh token and set new cookies', async () => {
      const { user } = await seedTestUser();

      const graphqlUser: User = {
        id: user.id,
        stravaId: user.stravaId,
        username: user.username || 'test',
        firstname: user.firstname || undefined,
        lastname: user.lastname || undefined,
        sex: user.sex || undefined,
        city: user.city || undefined,
        country: user.country || undefined,
        profile: user.profile || undefined,
        profileMedium: user.profileMedium || undefined,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };

      const { refreshToken: oldRefreshToken } = await authService.generateTokens(graphqlUser);

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .set('Cookie', `RefreshToken=${oldRefreshToken}`)
        .send({
          query: `
            mutation {
              refreshToken {
                user {
                  id
                  username
                }
              }
            }
          `,
        });

      expect(response.status).toBe(200);
      expect(response.body.errors).toBeUndefined();
      expect(Number(response.body.data.refreshToken.user.id)).toBe(user.id);

      const cookies = response.headers['set-cookie'] as unknown as string[];
      expect(cookies).toBeDefined();

      const authCookie = cookies.find((cookie: string) => cookie.startsWith('Authentication='));
      const refreshCookie = cookies.find((cookie: string) => cookie.startsWith('RefreshToken='));

      expect(authCookie).toBeDefined();
      expect(refreshCookie).toBeDefined();

      const oldTokenInDb = await prisma.refreshToken.findFirst({
        where: {
          userId: user.id,
          revoked: true,
        },
      });

      expect(oldTokenInDb).toBeDefined();

      const newTokenInDb = await prisma.refreshToken.findFirst({
        where: {
          userId: user.id,
          revoked: false,
        },
      });

      expect(newTokenInDb).toBeDefined();
    });

    it('should reject when refresh token cookie missing', async () => {
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `
            mutation {
              refreshToken {
                user {
                  id
                }
              }
            }
          `,
        });

      expect(response.status).toBe(200);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toContain('No refresh token provided');
    });

    it('should reject when refresh token expired', async () => {
      const { user } = await seedTestUser();

      const expiredRefreshToken = jwtService.sign(
        { sub: user.id, stravaId: user.stravaId, jti: 'expired-jti' },
        {
          secret: configService.getOrThrow('JWT_REFRESH_TOKEN_SECRET'),
          expiresIn: '0s',
        },
      );

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .set('Cookie', `RefreshToken=${expiredRefreshToken}`)
        .send({
          query: `
            mutation {
              refreshToken {
                user {
                  id
                }
              }
            }
          `,
        });

      expect(response.status).toBe(200);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toContain('Invalid refresh token');
    });

    it('should revoke all sessions on token replay', async () => {
      const { user } = await seedTestUser();

      const graphqlUser: User = {
        id: user.id,
        stravaId: user.stravaId,
        username: user.username || 'test',
        firstname: user.firstname || undefined,
        lastname: user.lastname || undefined,
        sex: user.sex || undefined,
        city: user.city || undefined,
        country: user.country || undefined,
        profile: user.profile || undefined,
        profileMedium: user.profileMedium || undefined,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };

      const { refreshToken: token1 } = await authService.generateTokens(graphqlUser);
      const { refreshToken: token2 } = await authService.generateTokens(graphqlUser);

      await authService.revokeRefreshToken(token1);

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .set('Cookie', `RefreshToken=${token1}`)
        .send({
          query: `
            mutation {
              refreshToken {
                user {
                  id
                }
              }
            }
          `,
        });

      expect(response.status).toBe(200);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toContain('Token replay detected - all sessions revoked');

      const allTokens = await prisma.refreshToken.findMany({
        where: { userId: user.id },
      });

      allTokens.forEach(token => {
        expect(token.revoked).toBe(true);
      });
    });
  });

  describe('logout mutation', () => {
    it('should revoke token and clear both cookies', async () => {
      const { user } = await seedTestUser();

      const graphqlUser: User = {
        id: user.id,
        stravaId: user.stravaId,
        username: user.username || 'test',
        firstname: user.firstname || undefined,
        lastname: user.lastname || undefined,
        sex: user.sex || undefined,
        city: user.city || undefined,
        country: user.country || undefined,
        profile: user.profile || undefined,
        profileMedium: user.profileMedium || undefined,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };

      const { refreshToken } = await authService.generateTokens(graphqlUser);

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .set('Cookie', `RefreshToken=${refreshToken}`)
        .send({
          query: `
            mutation {
              logout
            }
          `,
        });

      expect(response.status).toBe(200);
      expect(response.body.errors).toBeUndefined();
      expect(response.body.data.logout).toBe(true);

      const cookies = response.headers['set-cookie'] as unknown as string[];
      expect(cookies).toBeDefined();

      const hasClearedAuth = cookies.some((cookie: string) => cookie.includes('Authentication=;'));
      const hasClearedRefresh = cookies.some((cookie: string) => cookie.includes('RefreshToken=;'));

      expect(hasClearedAuth).toBe(true);
      expect(hasClearedRefresh).toBe(true);

      const tokenInDb = await prisma.refreshToken.findFirst({
        where: { userId: user.id },
      });

      expect(tokenInDb?.revoked).toBe(true);
    });

    it('should clear cookies even without refresh token', async () => {
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `
            mutation {
              logout
            }
          `,
        });

      expect(response.status).toBe(200);
      expect(response.body.errors).toBeUndefined();
      expect(response.body.data.logout).toBe(true);

      const cookies = response.headers['set-cookie'];

      if (cookies) {
        const cookiesArray = cookies as unknown as string[];
        const hasClearedAuth = cookiesArray.some((cookie: string) => cookie.includes('Authentication=;'));
        const hasClearedRefresh = cookiesArray.some((cookie: string) => cookie.includes('RefreshToken=;'));

        expect(hasClearedAuth).toBe(true);
        expect(hasClearedRefresh).toBe(true);
      }
    });
  });

  describe('stravaAuthUrl query', () => {
    it('should return correctly formatted Strava OAuth URL', async () => {
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `
            query {
              stravaAuthUrl
            }
          `,
        });

      expect(response.status).toBe(200);
      expect(response.body.errors).toBeUndefined();
      expect(response.body.data.stravaAuthUrl).toBeDefined();
      expect(response.body.data.stravaAuthUrl).toContain('https://www.strava.com/oauth/authorize');
      expect(response.body.data.stravaAuthUrl).toContain('client_id=');
      expect(response.body.data.stravaAuthUrl).toContain('response_type=code');
      expect(response.body.data.stravaAuthUrl).toContain('redirect_uri=');
      expect(response.body.data.stravaAuthUrl).toContain('scope=read_all,activity:read_all,profile:read_all');
    });
  });
});
