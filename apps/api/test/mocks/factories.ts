import {
  User as PrismaUser,
  StravaToken as PrismaStravaToken,
  UserPreferences as PrismaUserPreferences,
  Activity as PrismaActivity,
  SyncHistory as PrismaSyncHistory,
} from '@prisma/client';

let mockIdCounter = 1;

const randomInt = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const randomString = (length: number): string => {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export const createMockPrismaUser = (overrides?: Partial<PrismaUser>): PrismaUser => {
  const id = mockIdCounter++;
  const firstName = `FirstName${id}`;
  const lastName = `LastName${id}`;

  return {
    id,
    stravaId: randomInt(1000000, 9999999),
    username: `user${id}`,
    firstname: firstName,
    lastname: lastName,
    sex: ['M', 'F', null][randomInt(0, 2)],
    city: `City${id}`,
    country: `Country${id}`,
    profile: `https://example.com/avatar/${id}.jpg`,
    profileMedium: `https://example.com/avatar/${id}_medium.jpg`,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date(),
    ...overrides,
  };
};

export const createMockStravaToken = (userId: number, overrides?: Partial<PrismaStravaToken>): PrismaStravaToken => {
  const id = mockIdCounter++;
  const now = Date.now();
  const expiresAt = Math.floor(now / 1000) + 3600;

  return {
    id,
    userId,
    accessToken: randomString(40),
    refreshToken: randomString(40),
    expiresAt,
    createdAt: new Date('2024-01-01'),
    ...overrides,
  };
};

export const createMockPrismaUserPreferences = (overrides?: Partial<PrismaUserPreferences>): PrismaUserPreferences => {
  const id = mockIdCounter++;

  return {
    id,
    userId: randomInt(1, 1000),
    selectedSports: [],
    onboardingCompleted: false,
    locale: 'en',
    theme: 'system',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date(),
    ...overrides,
  };
};

export const createMockPrismaActivity = (overrides?: Partial<PrismaActivity>): PrismaActivity => {
  const id = mockIdCounter++;
  const stravaId = BigInt(randomInt(1000000000, 9999999999));

  return {
    id,
    stravaId,
    userId: randomInt(1, 1000),
    name: `Morning Run ${id}`,
    type: 'Run',
    distance: randomInt(1000, 50000),
    movingTime: randomInt(600, 10800),
    elapsedTime: randomInt(600, 10800),
    totalElevationGain: randomInt(0, 1000),
    startDate: new Date('2024-01-01T08:00:00Z'),
    startDateLocal: new Date('2024-01-01T09:00:00Z'),
    timezone: '(GMT+01:00) Europe/Paris',
    averageSpeed: 3.5,
    maxSpeed: 5.2,
    averageHeartrate: 145,
    maxHeartrate: 175,
    kilojoules: 850,
    deviceWatts: true,
    hasKudoed: false,
    kudosCount: randomInt(0, 50),
    averageCadence: 85,
    elevHigh: null,
    elevLow: null,
    calories: null,
    splits: null,
    averageWatts: null,
    weightedAverageWatts: null,
    maxWatts: null,
    raw: { summary_polyline: 'abc123', map: { id: 'xyz789' } },
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date(),
    ...overrides,
  };
};

export const createMockPrismaSyncHistory = (overrides?: Partial<PrismaSyncHistory>): PrismaSyncHistory => {
  const id = mockIdCounter++;

  return {
    id,
    userId: randomInt(1, 1000),
    status: 'COMPLETED',
    stage: 'COMPLETED',
    totalActivities: 100,
    processedActivities: 100,
    errorMessage: null,
    startedAt: new Date('2024-01-01T10:00:00Z'),
    completedAt: new Date('2024-01-01T10:05:00Z'),
    ...overrides,
  };
};
