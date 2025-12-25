import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import { JwtService } from '@nestjs/jwt';
import { AccessTokenPayload } from '../src/auth/types';
import { SportType } from '../src/user-preferences/enums/sport-type.enum';
import { ThemeType } from '../src/user-preferences/enums/theme-type.enum';
import { LocaleType } from '../src/user-preferences/enums/locale-type.enum';

let prisma: PrismaClient;
let databaseUrl: string;

export const setupTestDatabase = async (): Promise<PrismaClient> => {
  databaseUrl = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/stravanalytics_test';

  process.env.DATABASE_URL = databaseUrl;

  prisma = new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
  });

  await prisma.$connect();

  try {
    execSync('pnpm prisma migrate deploy', {
      cwd: process.cwd(),
      stdio: 'pipe',
      env: { ...process.env, DATABASE_URL: databaseUrl },
    });
  } catch (error) {
    throw new Error(`Failed to apply migrations: ${error}`);
  }

  return prisma;
};

export const resetTestDatabase = async (): Promise<void> => {
  if (!prisma) {
    throw new Error('Test database not initialized. Call setupTestDatabase first.');
  }

  const tableNames = await prisma.$queryRaw<Array<{ tablename: string }>>`
    SELECT tablename FROM pg_tables WHERE schemaname='public'
  `;

  const tables = tableNames
    .map(({ tablename }) => tablename)
    .filter(name => name !== '_prisma_migrations')
    .map(name => `"public"."${name}"`)
    .join(', ');

  if (tables) {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tables} CASCADE;`);
  }

  const sequences = await prisma.$queryRaw<Array<{ sequence_name: string }>>`
    SELECT sequence_name FROM information_schema.sequences WHERE sequence_schema='public'
  `;

  for (const { sequence_name } of sequences) {
    await prisma.$executeRawUnsafe(`ALTER SEQUENCE "${sequence_name}" RESTART WITH 1;`);
  }
};

export const closeTestDatabase = async (): Promise<void> => {
  if (prisma) {
    await prisma.$disconnect();
  }
};

export const getTestPrismaClient = (): PrismaClient => {
  if (!prisma) {
    throw new Error('Test database not initialized. Call setupTestDatabase first.');
  }
  return prisma;
};

export const seedTestUser = async (overrides?: {
  stravaId?: number;
  username?: string;
  firstname?: string;
  lastname?: string;
}) => {
  const stravaId = overrides?.stravaId ?? Math.floor(Math.random() * 1000000) + 100000;
  const username = overrides?.username ?? `testuser${stravaId}`;

  const user = await prisma.user.create({
    data: {
      stravaId,
      username,
      firstname: overrides?.firstname ?? 'Test',
      lastname: overrides?.lastname ?? 'User',
      sex: 'M',
      city: 'Test City',
      country: 'Test Country',
      profile: 'https://example.com/profile.jpg',
      profileMedium: 'https://example.com/profile_medium.jpg',
    },
  });

  const preferences = await prisma.userPreferences.create({
    data: {
      userId: user.id,
      selectedSports: [SportType.RUN],
      onboardingCompleted: false,
      locale: LocaleType.EN,
      theme: ThemeType.SYSTEM,
    },
  });

  return { user, preferences };
};

export const seedTestStravaToken = async (
  userId: number,
  overrides?: {
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: number;
  },
) => {
  const now = Date.now();
  const expiresAt = overrides?.expiresAt ?? Math.floor(now / 1000) + 3600;

  return await prisma.stravaToken.create({
    data: {
      userId,
      accessToken: overrides?.accessToken ?? `test_access_token_${userId}`,
      refreshToken: overrides?.refreshToken ?? `test_refresh_token_${userId}`,
      expiresAt,
    },
  });
};

export const seedTestActivity = async (
  userId: number,
  overrides?: {
    stravaId?: bigint;
    name?: string;
    type?: string;
    distance?: number;
    movingTime?: number;
    startDate?: Date;
  },
) => {
  const stravaId = overrides?.stravaId ?? BigInt(Math.floor(Math.random() * 1000000000) + 1000000000);

  return await prisma.activity.create({
    data: {
      userId,
      stravaId,
      name: overrides?.name ?? 'Test Activity',
      type: overrides?.type ?? 'Run',
      distance: overrides?.distance ?? 5000,
      movingTime: overrides?.movingTime ?? 1800,
      elapsedTime: overrides?.movingTime ?? 1800,
      totalElevationGain: 50,
      startDate: overrides?.startDate ?? new Date(),
      startDateLocal: overrides?.startDate ?? new Date(),
      timezone: '(GMT+00:00) UTC',
      averageSpeed: 2.78,
      maxSpeed: 3.5,
      averageHeartrate: 145,
      maxHeartrate: 165,
      kilojoules: 500,
      deviceWatts: false,
      hasKudoed: false,
      kudosCount: 0,
      averageCadence: 85,
      raw: {
        id: Number(stravaId),
        name: overrides?.name ?? 'Test Activity',
        type: overrides?.type ?? 'Run',
      },
    },
  });
};

export const seedTestRefreshToken = async (
  userId: number,
  jti: string,
  overrides?: {
    expiresAt?: Date;
    revoked?: boolean;
  },
) => {
  const expiresAt = overrides?.expiresAt ?? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  return await prisma.refreshToken.create({
    data: {
      userId,
      jti,
      expiresAt,
      revoked: overrides?.revoked ?? false,
    },
  });
};

export const generateTestAccessToken = (userId: number, stravaId: number): string => {
  const jwtService = new JwtService();
  const payload: AccessTokenPayload = {
    sub: userId,
    stravaId,
  };

  return jwtService.sign(payload as any, {
    secret: process.env.JWT_ACCESS_TOKEN_SECRET || 'test-access-secret',
    expiresIn: (process.env.JWT_ACCESS_TOKEN_EXPIRATION || '15m') as any,
  });
};
