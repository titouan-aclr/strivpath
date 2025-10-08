import { PrismaClient } from '@prisma/client';
import { mockDeep } from 'jest-mock-extended';

jest.mock('../src/database/prisma.service', () => ({
  __esModule: true,
  PrismaService: jest.fn().mockImplementation(() => mockDeep<PrismaClient>()),
}));

beforeEach(() => {
  jest.clearAllMocks();
});
