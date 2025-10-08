import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { PrismaService } from '@/database/prisma.service';
import { createMockPrismaService, MockPrismaService } from '../../test/mocks/prisma.mock';
import { createMockPrismaUser, createMockStravaToken } from '../../test/mocks/factories';

describe('UserService', () => {
  let service: UserService;
  let prisma: MockPrismaService;

  beforeEach(async () => {
    const mockPrisma = createMockPrismaService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [UserService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    service = module.get<UserService>(UserService);
    prisma = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of users', async () => {
      const mockUsers = [createMockPrismaUser({ stravaId: 12345 }), createMockPrismaUser({ stravaId: 67890 })];
      prisma.user.findMany.mockResolvedValue(mockUsers);

      const result = await service.findAll();

      expect(result).toEqual(mockUsers);
      expect(result).toHaveLength(2);
      expect(prisma.user.findMany).toHaveBeenCalledTimes(1);
    });

    it('should return an empty array when no users exist', async () => {
      prisma.user.findMany.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });
  });

  describe('findByStravaId', () => {
    it('should return a user with tokens when found', async () => {
      const mockUser = createMockPrismaUser({ stravaId: 12345 });
      prisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.findByStravaId(12345);

      expect(result).toEqual(mockUser);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { stravaId: 12345 },
        include: { tokens: { orderBy: { createdAt: 'desc' }, take: 1 } },
      });
    });

    it('should return null when user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const result = await service.findByStravaId(99999);

      expect(result).toBeNull();
    });
  });

  describe('createWithTokens', () => {
    it('should create a user with tokens', async () => {
      const userData = {
        stravaId: 12345,
        username: 'testuser',
        firstname: 'Test',
        lastname: 'User',
      };
      const tokenData = {
        accessToken: 'access123',
        refreshToken: 'refresh123',
        expiresAt: new Date('2025-12-31'),
        scope: 'read,activity:read_all',
      };

      const mockCreatedUser = {
        ...createMockPrismaUser(userData),
        tokens: [createMockStravaToken(1, tokenData)],
      };

      prisma.user.create.mockResolvedValue(mockCreatedUser);

      const result = await service.createWithTokens(userData, tokenData);

      expect(result).toEqual(mockCreatedUser);
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          ...userData,
          tokens: {
            create: tokenData,
          },
        },
        include: { tokens: true },
      });
    });
  });

  describe('updateTokens', () => {
    it('should create new token for existing user', async () => {
      const userId = 1;
      const tokenData = {
        accessToken: 'newaccess123',
        refreshToken: 'newrefresh123',
        expiresAt: new Date('2025-12-31'),
        scope: 'read,activity:read_all',
      };

      const mockToken = createMockStravaToken(userId, tokenData);
      prisma.stravaToken.create.mockResolvedValue(mockToken);

      const result = await service.updateTokens(userId, tokenData);

      expect(result).toEqual(mockToken);
      expect(prisma.stravaToken.create).toHaveBeenCalledWith({
        data: { ...tokenData, userId },
      });
    });
  });
});
