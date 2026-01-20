import { setupTestDatabase, closeTestDatabase, resetTestDatabase } from './test-db';

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL || 'postgresql://postgres:password@localhost:5432/stravanalytics_test';
process.env.JWT_ACCESS_TOKEN_SECRET = 'test-access-secret-key';
process.env.JWT_REFRESH_TOKEN_SECRET = 'test-refresh-secret-key';
process.env.JWT_ACCESS_TOKEN_EXPIRATION = '15m';
process.env.JWT_REFRESH_TOKEN_EXPIRATION = '7d';
process.env.STRAVA_CLIENT_ID = 'test-client-id';
process.env.STRAVA_CLIENT_SECRET = 'test-client-secret';
process.env.STRAVA_REDIRECT_URI = 'http://localhost:3000/callback';

let isSetup = false;

beforeAll(async () => {
  if (!isSetup) {
    await setupTestDatabase();
    isSetup = true;
  }
}, 30000);

afterAll(async () => {
  await closeTestDatabase();
}, 30000);

afterEach(async () => {
  await resetTestDatabase();
}, 10000);

jest.setTimeout(10000);
