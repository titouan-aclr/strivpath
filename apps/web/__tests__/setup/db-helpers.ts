import { PrismaClient } from './prisma-client';

const E2E_DATABASE_URL =
  process.env.E2E_DATABASE_URL ||
  process.env.DATABASE_URL ||
  'postgresql://postgres:password@127.0.0.1:5432/strivpath_test_e2e';

let prisma: PrismaClient;

export function getE2EPrismaClient(): PrismaClient {
  if (!prisma) {
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: E2E_DATABASE_URL,
        },
      },
    });
  }
  return prisma;
}

export async function resetDatabase(): Promise<void> {
  const client = getE2EPrismaClient();

  const tableNames = await client.$queryRaw<Array<{ tablename: string }>>`
    SELECT tablename FROM pg_tables WHERE schemaname='public'
  `;

  const tables = tableNames
    .map(({ tablename }: { tablename: string }) => tablename)
    .filter((name: string) => name !== '_prisma_migrations')
    .map((name: string) => `"public"."${name}"`)
    .join(', ');

  if (tables) {
    await client.$executeRawUnsafe(`TRUNCATE TABLE ${tables} RESTART IDENTITY CASCADE;`);
  }
}

export interface TestUser {
  id: number;
  stravaId: number;
  username: string;
  firstname: string;
  lastname: string;
  sex?: string;
  city?: string;
  country?: string;
  profile?: string;
  profileMedium?: string;
}

export interface TestUserPreferences {
  id: number;
  userId: number;
  selectedSports: string[];
  onboardingCompleted: boolean;
  locale: string;
  theme: string;
}

export interface AuthenticatedTestUser {
  user: TestUser;
  preferences: TestUserPreferences;
  accessToken: string;
  refreshToken: string;
  refreshTokenJti: string;
}

export async function createTestUser(overrides?: {
  stravaId?: number;
  username?: string;
  firstname?: string;
  lastname?: string;
}): Promise<{ user: TestUser; preferences: TestUserPreferences }> {
  const client = getE2EPrismaClient();

  const stravaId = overrides?.stravaId ?? Math.floor(Math.random() * 1000000) + 100000;
  const username = overrides?.username ?? `e2euser${stravaId}`;

  const user = await client.user.create({
    data: {
      stravaId,
      username,
      firstname: overrides?.firstname ?? 'E2E',
      lastname: overrides?.lastname ?? 'Test',
      sex: 'M',
      city: 'Test City',
      country: 'Test Country',
      profile: 'https://example.com/profile.jpg',
      profileMedium: 'https://example.com/profile_medium.jpg',
    },
  });

  const preferences = await client.userPreferences.create({
    data: {
      userId: user.id,
      selectedSports: ['Run'],
      onboardingCompleted: false,
      locale: 'en',
      theme: 'system',
    },
  });

  return {
    user: {
      id: user.id,
      stravaId: user.stravaId,
      username: user.username || username,
      firstname: user.firstname || 'E2E',
      lastname: user.lastname || 'Test',
      sex: user.sex || undefined,
      city: user.city || undefined,
      country: user.country || undefined,
      profile: user.profile || undefined,
      profileMedium: user.profileMedium || undefined,
    },
    preferences: {
      id: preferences.id,
      userId: preferences.userId,
      selectedSports: Array.isArray(preferences.selectedSports) ? (preferences.selectedSports as string[]) : [],
      onboardingCompleted: preferences.onboardingCompleted,
      locale: preferences.locale,
      theme: preferences.theme,
    },
  };
}

export async function seedAuthenticatedUser(overrides?: {
  stravaId?: number;
  username?: string;
  onboardingCompleted?: boolean;
}): Promise<AuthenticatedTestUser> {
  const { user, preferences } = await createTestUser(overrides);

  if (overrides?.onboardingCompleted !== undefined) {
    const client = getE2EPrismaClient();
    await client.userPreferences.update({
      where: { id: preferences.id },
      data: { onboardingCompleted: overrides.onboardingCompleted },
    });
    preferences.onboardingCompleted = overrides.onboardingCompleted;
  }

  const JwtService = require('@nestjs/jwt').JwtService;
  const jwtService = new JwtService();

  const accessTokenSecret = process.env.JWT_ACCESS_TOKEN_SECRET || 'test-access-secret';
  const refreshTokenSecret = process.env.JWT_REFRESH_TOKEN_SECRET || 'test-refresh-secret';

  const accessToken = jwtService.sign(
    { sub: user.id, stravaId: user.stravaId },
    {
      secret: accessTokenSecret,
      expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRATION || '15m',
    },
  );

  const refreshTokenJti = require('crypto').randomUUID();

  const refreshToken = jwtService.sign(
    { sub: user.id, stravaId: user.stravaId, jti: refreshTokenJti },
    {
      secret: refreshTokenSecret,
      expiresIn: process.env.JWT_REFRESH_TOKEN_EXPIRATION || '7d',
    },
  );

  const client = getE2EPrismaClient();
  await client.refreshToken.create({
    data: {
      userId: user.id,
      jti: refreshTokenJti,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      revoked: false,
    },
  });

  return {
    user,
    preferences,
    accessToken,
    refreshToken,
    refreshTokenJti,
  };
}

export async function closeE2EDatabase(): Promise<void> {
  if (prisma) {
    await prisma.$disconnect();
  }
}
