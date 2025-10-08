import { User as PrismaUser, StravaToken as PrismaStravaToken } from '@prisma/client';

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
  const expiresAt = new Date();
  expiresAt.setFullYear(expiresAt.getFullYear() + 1);

  return {
    id,
    userId,
    accessToken: randomString(40),
    refreshToken: randomString(40),
    expiresAt,
    scope: 'read,activity:read_all,profile:read_all',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date(),
    ...overrides,
  };
};
