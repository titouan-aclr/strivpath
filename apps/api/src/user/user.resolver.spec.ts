import { Test, TestingModule } from '@nestjs/testing';
import { UserResolver } from './user.resolver';
import { UserService } from './user.service';
import { AuthService } from '../auth/auth.service';
import { AuthCookieService } from '../auth/auth-cookie.service';
import { createMockPrismaUser } from '../../test/mocks/factories';
import { UserMapper } from './user.mapper';
import { TokenPayload } from '../auth/types';
import { GraphQLContext } from '../common/types';
import { Response } from 'express';

describe('UserResolver', () => {
  let resolver: UserResolver;
  let userService: UserService;
  let authService: AuthService;
  let authCookieService: AuthCookieService;

  const mockUserService = {
    findAll: jest.fn(),
    findByStravaId: jest.fn(),
    deleteUserData: jest.fn(),
    deleteAccount: jest.fn(),
  };

  const mockAuthService = {
    revokeAllUserRefreshTokens: jest.fn(),
  };

  const mockAuthCookieService = {
    clearAllAuthCookies: jest.fn(),
  };

  const mockTokenPayload: TokenPayload = {
    sub: 1,
    stravaId: 12345,
  };

  const mockResponse = {
    cookie: jest.fn(),
    clearCookie: jest.fn(),
  } as unknown as Response;

  const mockContext: GraphQLContext = {
    req: {} as any,
    res: mockResponse,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserResolver,
        { provide: UserService, useValue: mockUserService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: AuthCookieService, useValue: mockAuthCookieService },
      ],
    }).compile();

    resolver = module.get<UserResolver>(UserResolver);
    userService = module.get<UserService>(UserService);
    authService = module.get<AuthService>(AuthService);
    authCookieService = module.get<AuthCookieService>(AuthCookieService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('users', () => {
    it('should return an array of GraphQL users', async () => {
      const mockPrismaUsers = [
        createMockPrismaUser({ stravaId: 12345, username: 'user1' }),
        createMockPrismaUser({ stravaId: 67890, username: 'user2' }),
      ];
      const expectedGraphQLUsers = mockPrismaUsers.map(user => UserMapper.toGraphQL(user));

      mockUserService.findAll.mockResolvedValue(mockPrismaUsers);

      const result = await resolver.users();

      expect(result).toEqual(expectedGraphQLUsers);
      expect(result).toHaveLength(2);
      expect(userService.findAll).toHaveBeenCalledTimes(1);
    });

    it('should return an empty array when no users exist', async () => {
      mockUserService.findAll.mockResolvedValue([]);

      const result = await resolver.users();

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should map Prisma users to GraphQL users correctly', async () => {
      const mockPrismaUser = createMockPrismaUser({
        stravaId: 12345,
        username: 'testuser',
        firstname: 'Test',
        lastname: 'User',
        city: 'Paris',
        country: 'France',
      });

      mockUserService.findAll.mockResolvedValue([mockPrismaUser]);

      const result = await resolver.users();

      expect(result[0]).toMatchObject({
        id: mockPrismaUser.id,
        stravaId: mockPrismaUser.stravaId,
        username: mockPrismaUser.username,
        firstname: mockPrismaUser.firstname,
        lastname: mockPrismaUser.lastname,
        city: mockPrismaUser.city,
        country: mockPrismaUser.country,
      });
    });
  });

  describe('userByStravaId', () => {
    it('should return a GraphQL user when found', async () => {
      const mockPrismaUser = { ...createMockPrismaUser({ stravaId: 12345 }), tokens: [] };
      const expectedGraphQLUser = UserMapper.toGraphQL(mockPrismaUser);

      mockUserService.findByStravaId.mockResolvedValue(mockPrismaUser);

      const result = await resolver.userByStravaId(12345);

      expect(result).toEqual(expectedGraphQLUser);
      expect(userService.findByStravaId).toHaveBeenCalledWith(12345);
    });

    it('should return null when user not found', async () => {
      mockUserService.findByStravaId.mockResolvedValue(null);

      const result = await resolver.userByStravaId(99999);

      expect(result).toBeNull();
      expect(userService.findByStravaId).toHaveBeenCalledWith(99999);
    });

    it('should handle nullable fields correctly', async () => {
      const mockPrismaUser = {
        ...createMockPrismaUser({
          stravaId: 12345,
          username: null,
          firstname: null,
          lastname: null,
          city: null,
          country: null,
        }),
        tokens: [],
      };

      mockUserService.findByStravaId.mockResolvedValue(mockPrismaUser);

      const result = await resolver.userByStravaId(12345);

      expect(result).toBeDefined();
      expect(result?.username).toBeUndefined();
      expect(result?.firstname).toBeUndefined();
      expect(result?.lastname).toBeUndefined();
    });
  });

  describe('deleteUserData', () => {
    it('should delete user data and return true', async () => {
      mockUserService.deleteUserData.mockResolvedValue(true);

      const result = await resolver.deleteUserData(mockTokenPayload);

      expect(result).toBe(true);
      expect(userService.deleteUserData).toHaveBeenCalledWith(mockTokenPayload.sub);
    });

    it('should use userId from token payload', async () => {
      const differentTokenPayload: TokenPayload = {
        sub: 42,
        stravaId: 99999,
      };

      mockUserService.deleteUserData.mockResolvedValue(true);

      await resolver.deleteUserData(differentTokenPayload);

      expect(userService.deleteUserData).toHaveBeenCalledWith(42);
    });
  });

  describe('deleteAccount', () => {
    it('should revoke tokens, clear cookies, and delete account', async () => {
      mockAuthService.revokeAllUserRefreshTokens.mockResolvedValue(undefined);
      mockUserService.deleteAccount.mockResolvedValue(true);

      const result = await resolver.deleteAccount(mockTokenPayload, mockContext);

      expect(result).toBe(true);
      expect(authService.revokeAllUserRefreshTokens).toHaveBeenCalledWith(mockTokenPayload.sub);
      expect(authCookieService.clearAllAuthCookies).toHaveBeenCalledWith(mockContext.res);
      expect(userService.deleteAccount).toHaveBeenCalledWith(mockTokenPayload.sub);
    });

    it('should execute operations in correct order', async () => {
      const callOrder: string[] = [];

      mockAuthService.revokeAllUserRefreshTokens.mockImplementation(async () => {
        callOrder.push('revokeTokens');
      });
      mockAuthCookieService.clearAllAuthCookies.mockImplementation(() => {
        callOrder.push('clearCookies');
      });
      mockUserService.deleteAccount.mockImplementation(async () => {
        callOrder.push('deleteAccount');
        return true;
      });

      await resolver.deleteAccount(mockTokenPayload, mockContext);

      expect(callOrder).toEqual(['revokeTokens', 'clearCookies', 'deleteAccount']);
    });

    it('should use userId from token payload', async () => {
      const differentTokenPayload: TokenPayload = {
        sub: 42,
        stravaId: 99999,
      };

      mockAuthService.revokeAllUserRefreshTokens.mockResolvedValue(undefined);
      mockUserService.deleteAccount.mockResolvedValue(true);

      await resolver.deleteAccount(differentTokenPayload, mockContext);

      expect(authService.revokeAllUserRefreshTokens).toHaveBeenCalledWith(42);
      expect(userService.deleteAccount).toHaveBeenCalledWith(42);
    });
  });
});
