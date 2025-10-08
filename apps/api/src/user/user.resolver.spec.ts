import { Test, TestingModule } from '@nestjs/testing';
import { UserResolver } from './user.resolver';
import { UserService } from './user.service';
import { createMockPrismaUser } from '../../test/mocks/factories';
import { UserMapper } from './user.mapper';

describe('UserResolver', () => {
  let resolver: UserResolver;
  let userService: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserResolver,
        {
          provide: UserService,
          useValue: {
            findAll: jest.fn(),
            findByStravaId: jest.fn(),
          },
        },
      ],
    }).compile();

    resolver = module.get<UserResolver>(UserResolver);
    userService = module.get<UserService>(UserService);
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

      jest.spyOn(userService, 'findAll').mockResolvedValue(mockPrismaUsers);

      const result = await resolver.users();

      expect(result).toEqual(expectedGraphQLUsers);
      expect(result).toHaveLength(2);
      expect(userService.findAll).toHaveBeenCalledTimes(1);
    });

    it('should return an empty array when no users exist', async () => {
      jest.spyOn(userService, 'findAll').mockResolvedValue([]);

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

      jest.spyOn(userService, 'findAll').mockResolvedValue([mockPrismaUser]);

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
      const mockPrismaUser = createMockPrismaUser({ stravaId: 12345 });
      const expectedGraphQLUser = UserMapper.toGraphQL(mockPrismaUser);

      jest.spyOn(userService, 'findByStravaId').mockResolvedValue(mockPrismaUser);

      const result = await resolver.userByStravaId(12345);

      expect(result).toEqual(expectedGraphQLUser);
      expect(userService.findByStravaId).toHaveBeenCalledWith(12345);
    });

    it('should return null when user not found', async () => {
      jest.spyOn(userService, 'findByStravaId').mockResolvedValue(null);

      const result = await resolver.userByStravaId(99999);

      expect(result).toBeNull();
      expect(userService.findByStravaId).toHaveBeenCalledWith(99999);
    });

    it('should handle nullable fields correctly', async () => {
      const mockPrismaUser = createMockPrismaUser({
        stravaId: 12345,
        username: null,
        firstname: null,
        lastname: null,
        city: null,
        country: null,
      });

      jest.spyOn(userService, 'findByStravaId').mockResolvedValue(mockPrismaUser);

      const result = await resolver.userByStravaId(12345);

      expect(result).toBeDefined();
      expect(result?.username).toBeUndefined();
      expect(result?.firstname).toBeUndefined();
      expect(result?.lastname).toBeUndefined();
    });
  });
});
