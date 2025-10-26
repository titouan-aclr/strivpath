import { UserMapper } from './user.mapper';
import { createMockPrismaUser } from '../../test/mocks/factories';

describe('UserMapper', () => {
  describe('toGraphQL', () => {
    it('should map all fields correctly from Prisma to GraphQL', () => {
      const prismaUser = createMockPrismaUser({
        id: 1,
        stravaId: 12345,
        username: 'testuser',
        firstname: 'Test',
        lastname: 'User',
        sex: 'M',
        city: 'Paris',
        country: 'France',
        profile: 'https://example.com/profile.jpg',
        profileMedium: 'https://example.com/profile-medium.jpg',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
      });

      const result = UserMapper.toGraphQL(prismaUser);

      expect(result).toEqual({
        id: 1,
        stravaId: 12345,
        username: 'testuser',
        firstname: 'Test',
        lastname: 'User',
        sex: 'M',
        city: 'Paris',
        country: 'France',
        profile: 'https://example.com/profile.jpg',
        profileMedium: 'https://example.com/profile-medium.jpg',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
      });
    });

    it('should convert null to undefined for optional fields', () => {
      const prismaUser = createMockPrismaUser({
        id: 1,
        stravaId: 12345,
        username: null,
        firstname: null,
        lastname: null,
        sex: null,
        city: null,
        country: null,
        profile: null,
        profileMedium: null,
      });

      const result = UserMapper.toGraphQL(prismaUser);

      expect(result.username).toBeUndefined();
      expect(result.firstname).toBeUndefined();
      expect(result.lastname).toBeUndefined();
      expect(result.sex).toBeUndefined();
      expect(result.city).toBeUndefined();
      expect(result.country).toBeUndefined();
      expect(result.profile).toBeUndefined();
      expect(result.profileMedium).toBeUndefined();
    });

    it('should handle minimal data with only required fields', () => {
      const prismaUser = createMockPrismaUser({
        id: 1,
        stravaId: 12345,
        username: null,
        firstname: null,
        lastname: null,
        sex: null,
        city: null,
        country: null,
        profile: null,
        profileMedium: null,
      });

      const result = UserMapper.toGraphQL(prismaUser);

      expect(result.id).toBe(1);
      expect(result.stravaId).toBe(12345);
      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();
    });

    it('should handle complete data with all fields populated', () => {
      const prismaUser = createMockPrismaUser({
        id: 99,
        stravaId: 999999,
        username: 'athletepro',
        firstname: 'Professional',
        lastname: 'Athlete',
        sex: 'F',
        city: 'New York',
        country: 'USA',
        profile: 'https://strava.com/athletes/999999/picture',
        profileMedium: 'https://strava.com/athletes/999999/picture-medium',
        createdAt: new Date('2023-06-15T10:30:00Z'),
        updatedAt: new Date('2024-01-20T14:45:00Z'),
      });

      const result = UserMapper.toGraphQL(prismaUser);

      expect(result).toMatchObject({
        id: 99,
        stravaId: 999999,
        username: 'athletepro',
        firstname: 'Professional',
        lastname: 'Athlete',
        sex: 'F',
        city: 'New York',
        country: 'USA',
        profile: 'https://strava.com/athletes/999999/picture',
        profileMedium: 'https://strava.com/athletes/999999/picture-medium',
      });
      expect(result.createdAt).toEqual(new Date('2023-06-15T10:30:00Z'));
      expect(result.updatedAt).toEqual(new Date('2024-01-20T14:45:00Z'));
    });

    it('should preserve date objects without modification', () => {
      const createdAt = new Date('2023-01-15T08:00:00Z');
      const updatedAt = new Date('2024-01-15T08:00:00Z');

      const prismaUser = createMockPrismaUser({
        createdAt,
        updatedAt,
      });

      const result = UserMapper.toGraphQL(prismaUser);

      expect(result.createdAt).toBe(createdAt);
      expect(result.updatedAt).toBe(updatedAt);
    });

    it('should handle partial optional data correctly', () => {
      const prismaUser = createMockPrismaUser({
        username: 'partialuser',
        firstname: 'First',
        lastname: null,
        sex: 'M',
        city: null,
        country: 'Germany',
        profile: null,
        profileMedium: null,
      });

      const result = UserMapper.toGraphQL(prismaUser);

      expect(result.username).toBe('partialuser');
      expect(result.firstname).toBe('First');
      expect(result.lastname).toBeUndefined();
      expect(result.sex).toBe('M');
      expect(result.city).toBeUndefined();
      expect(result.country).toBe('Germany');
      expect(result.profile).toBeUndefined();
      expect(result.profileMedium).toBeUndefined();
    });
  });
});
