import request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import cookieParser from 'cookie-parser';

describe('Auth GraphQL (e2e)', () => {
  let app: INestApplication;

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
  });

  afterAll(async () => {
    await app.close();
  });

  describe('stravaAuthUrl', () => {
    it('should return Strava OAuth URL', () => {
      return request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: '{ stravaAuthUrl }',
        })
        .expect(200)
        .expect(res => {
          expect(res.body.data.stravaAuthUrl).toBeDefined();
          expect(res.body.data.stravaAuthUrl).toContain('strava.com/oauth/authorize');
          expect(res.body.data.stravaAuthUrl).toContain('client_id=');
          expect(res.body.data.stravaAuthUrl).toContain('response_type=code');
          expect(res.body.data.stravaAuthUrl).toContain('scope=read,activity:read_all,profile:read_all');
        });
    });
  });

  describe('currentUser', () => {
    it('should return error when not authenticated', async () => {
      const response = await request(app.getHttpServer()).post('/graphql').send({
        query: '{ currentUser { id stravaId username } }',
      });

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toContain('Unauthorized');
    });
  });

  describe('logout', () => {
    it('should return true when logging out and clear only Authentication cookie', async () => {
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `
            mutation {
              logout(refreshToken: "test-token")
            }
          `,
        });

      expect(response.status).toBe(200);
      expect(response.body.data.logout).toBe(true);

      const cookies = response.headers['set-cookie'];
      if (cookies && Array.isArray(cookies)) {
        const hasClearedAuth = cookies.some((cookie: string) => cookie.includes('Authentication=;'));
        expect(hasClearedAuth).toBe(true);

        const hasClearedRefresh = cookies.some((cookie: string) => cookie.includes('Refresh=;'));
        expect(hasClearedRefresh).toBe(false);
      }
    });
  });
});
