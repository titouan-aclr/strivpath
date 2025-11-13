import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, RequestMethod } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Auth Throttling (E2E)', () => {
  describe('REST - /auth/strava/callback', () => {
    let app: INestApplication;

    beforeAll(async () => {
      const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [AppModule],
      }).compile();

      app = moduleFixture.createNestApplication();
      app.setGlobalPrefix('v1', {
        exclude: [{ path: 'graphql', method: RequestMethod.ALL }],
      });
      await app.init();
    });

    afterAll(async () => {
      await app.close();
    });

    it('should allow 5 requests within limit', async () => {
      for (let i = 0; i < 5; i++) {
        await request(app.getHttpServer()).get('/v1/auth/strava/callback?error=test').expect(302);
      }
    });

    it('should return 429 on 6th request', async () => {
      const response = await request(app.getHttpServer()).get('/v1/auth/strava/callback?error=test').expect(429);

      expect(response.body.message).toBeDefined();
    });
  });

  describe('GraphQL - refreshToken mutation', () => {
    let app: INestApplication;

    beforeAll(async () => {
      const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [AppModule],
      }).compile();

      app = moduleFixture.createNestApplication();
      app.setGlobalPrefix('v1', {
        exclude: [{ path: 'graphql', method: RequestMethod.ALL }],
      });
      await app.init();
    });

    afterAll(async () => {
      await app.close();
    });

    const REFRESH_TOKEN_MUTATION = `
      mutation {
        refreshToken {
          user {
            id
          }
        }
      }
    `;

    it('should allow 10 requests within limit', async () => {
      for (let i = 0; i < 10; i++) {
        await request(app.getHttpServer()).post('/graphql').send({ query: REFRESH_TOKEN_MUTATION }).expect(200);
      }
    });

    it('should return GraphQL error on 11th request', async () => {
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: REFRESH_TOKEN_MUTATION })
        .expect(200);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toBeDefined();
      expect(response.body.errors[0].extensions).toBeDefined();
    });
  });

  describe('GraphQL - logout mutation', () => {
    let app: INestApplication;

    beforeAll(async () => {
      const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [AppModule],
      }).compile();

      app = moduleFixture.createNestApplication();
      app.setGlobalPrefix('v1', {
        exclude: [{ path: 'graphql', method: RequestMethod.ALL }],
      });
      await app.init();
    });

    afterAll(async () => {
      await app.close();
    });

    const LOGOUT_MUTATION = `
      mutation {
        logout
      }
    `;

    it('should allow 5 requests within limit', async () => {
      for (let i = 0; i < 5; i++) {
        await request(app.getHttpServer()).post('/graphql').send({ query: LOGOUT_MUTATION }).expect(200);
      }
    });

    it('should return GraphQL error on 6th request', async () => {
      const response = await request(app.getHttpServer()).post('/graphql').send({ query: LOGOUT_MUTATION }).expect(200);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toBeDefined();
    });
  });
});
