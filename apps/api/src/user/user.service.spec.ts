import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { PrismaService } from '@/database/prisma.service';
import { createMockPrismaService, MockPrismaService } from '../../test/mocks/prisma.mock';
import { createMockPrismaUser, createMockStravaToken } from '../../test/mocks/factories';
import { StravaAthleteResponse, StravaTokenResponse } from '../strava/types';

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

  describe('upsertFromStrava', () => {
    const mockAthleteResponse: StravaAthleteResponse = {
      id: 12345,
      username: 'testathlete',
      resource_state: 3,
      firstname: 'Test',
      lastname: 'Athlete',
      bio: 'Test bio',
      city: 'Paris',
      state: 'Île-de-France',
      country: 'France',
      sex: 'M',
      premium: false,
      summit: false,
      created_at: '2020-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
      badge_type_id: 1,
      weight: 70,
      profile_medium: 'https://example.com/profile-medium.jpg',
      profile: 'https://example.com/profile.jpg',
      friend: null,
      follower: null,
      blocked: false,
      can_follow: true,
      follower_count: 10,
      friend_count: 5,
      mutual_friend_count: 2,
      athlete_type: 1,
      date_preference: 'dd/MM/yyyy',
      measurement_preference: 'meters',
      clubs: [],
      ftp: null,
      bikes: [],
      shoes: [],
    };

    const mockStravaTokens: StravaTokenResponse = {
      token_type: 'Bearer',
      expires_at: 1234567890,
      expires_in: 21600,
      refresh_token: 'strava-refresh-token',
      access_token: 'strava-access-token',
      athlete: mockAthleteResponse,
    };

    it('should create new user with default preferences on first login', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const mockCreatedUser = createMockPrismaUser({
        stravaId: mockAthleteResponse.id,
        username: mockAthleteResponse.username,
        firstname: mockAthleteResponse.firstname,
        lastname: mockAthleteResponse.lastname,
      });

      prisma.user.create.mockResolvedValue(mockCreatedUser);

      const result = await service.upsertFromStrava(mockAthleteResponse, mockStravaTokens);

      expect(result.stravaId).toBe(mockAthleteResponse.id);
      expect(result.username).toBe(mockAthleteResponse.username);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { stravaId: mockAthleteResponse.id },
      });
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          stravaId: mockAthleteResponse.id,
          username: mockAthleteResponse.username,
          firstname: mockAthleteResponse.firstname,
          lastname: mockAthleteResponse.lastname,
          sex: mockAthleteResponse.sex,
          city: mockAthleteResponse.city,
          country: mockAthleteResponse.country,
          profile: mockAthleteResponse.profile,
          profileMedium: mockAthleteResponse.profile_medium,
          tokens: {
            create: {
              accessToken: mockStravaTokens.access_token,
              refreshToken: mockStravaTokens.refresh_token,
              expiresAt: mockStravaTokens.expires_at,
            },
          },
          preferences: {
            create: {
              selectedSports: [],
              onboardingCompleted: false,
              locale: 'en',
              theme: 'system',
            },
          },
        },
      });
    });

    it('should update existing user and add new Strava token', async () => {
      const existingUser = createMockPrismaUser({
        id: 1,
        stravaId: mockAthleteResponse.id,
        username: 'oldusername',
        firstname: 'Old',
        lastname: 'Name',
      });

      const updatedUser = createMockPrismaUser({
        id: 1,
        stravaId: mockAthleteResponse.id,
        username: mockAthleteResponse.username,
        firstname: mockAthleteResponse.firstname,
        lastname: mockAthleteResponse.lastname,
        city: mockAthleteResponse.city,
        country: mockAthleteResponse.country,
      });

      prisma.user.findUnique.mockResolvedValue(existingUser);
      prisma.user.update.mockResolvedValue(updatedUser);

      const result = await service.upsertFromStrava(mockAthleteResponse, mockStravaTokens);

      expect(result.stravaId).toBe(mockAthleteResponse.id);
      expect(result.username).toBe(mockAthleteResponse.username);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: existingUser.id },
        data: {
          username: mockAthleteResponse.username,
          firstname: mockAthleteResponse.firstname,
          lastname: mockAthleteResponse.lastname,
          sex: mockAthleteResponse.sex,
          city: mockAthleteResponse.city,
          country: mockAthleteResponse.country,
          profile: mockAthleteResponse.profile,
          profileMedium: mockAthleteResponse.profile_medium,
          tokens: {
            create: {
              accessToken: mockStravaTokens.access_token,
              refreshToken: mockStravaTokens.refresh_token,
              expiresAt: mockStravaTokens.expires_at,
            },
          },
        },
      });
    });

    it('should preserve token history when updating user', async () => {
      const existingUser = createMockPrismaUser({
        id: 1,
        stravaId: mockAthleteResponse.id,
      });

      prisma.user.findUnique.mockResolvedValue(existingUser);
      prisma.user.update.mockResolvedValue(existingUser);

      await service.upsertFromStrava(mockAthleteResponse, mockStravaTokens);

      const updateCall = (prisma.user.update as jest.Mock).mock.calls[0][0];
      expect(updateCall.data.tokens.create).toBeDefined();
      expect(updateCall.data.tokens.create.accessToken).toBe(mockStravaTokens.access_token);
    });
  });
});
