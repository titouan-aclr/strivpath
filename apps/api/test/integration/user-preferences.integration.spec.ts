import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, NotFoundException, BadRequestException } from '@nestjs/common';
import { AppModule } from '../../src/app.module';
import { UserPreferencesService } from '../../src/user-preferences/user-preferences.service';
import { UserService } from '../../src/user/user.service';
import { PrismaService } from '../../src/database/prisma.service';
import { UserPreferencesResolver } from '../../src/user-preferences/user-preferences.resolver';
import { getTestPrismaClient, seedTestUser } from '../test-db';
import { SportType } from '../../src/user-preferences/enums/sport-type.enum';
import { TokenPayload } from '../../src/auth/types';

describe('User Preferences Integration', () => {
  let app: INestApplication;
  let userPreferencesService: UserPreferencesService;
  let userService: UserService;
  let userPreferencesResolver: UserPreferencesResolver;
  let prisma: ReturnType<typeof getTestPrismaClient>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    userPreferencesService = moduleFixture.get<UserPreferencesService>(UserPreferencesService);
    userService = moduleFixture.get<UserService>(UserService);
    userPreferencesResolver = moduleFixture.get<UserPreferencesResolver>(UserPreferencesResolver);
    prisma = getTestPrismaClient();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('default preferences creation', () => {
    it('should create default preferences with Run sport on user creation', async () => {
      const { user, preferences } = await seedTestUser();

      expect(preferences).toBeDefined();
      expect(preferences.userId).toBe(user.id);
      expect(preferences.selectedSports).toEqual([SportType.RUN]);
      expect(preferences.onboardingCompleted).toBe(false);
    });

    it('should retrieve preferences by userId', async () => {
      const { user } = await seedTestUser();

      const preferences = await userPreferencesService.findByUserId(user.id);

      expect(preferences).toBeDefined();
      expect(preferences?.userId).toBe(user.id);
      expect(preferences?.onboardingCompleted).toBe(false);
    });
  });

  describe('completeOnboarding', () => {
    it('should complete onboarding when sports are selected', async () => {
      const { user } = await seedTestUser();

      const preferencesBefore = await prisma.userPreferences.findUnique({
        where: { userId: user.id },
      });
      expect(preferencesBefore?.onboardingCompleted).toBe(false);

      const updatedPreferences = await userPreferencesService.completeOnboarding(user.id);

      expect(updatedPreferences.onboardingCompleted).toBe(true);

      const preferencesAfter = await prisma.userPreferences.findUnique({
        where: { userId: user.id },
      });
      expect(preferencesAfter?.onboardingCompleted).toBe(true);
    });

    it('should return existing preferences if already completed', async () => {
      const { user } = await seedTestUser();

      await prisma.userPreferences.update({
        where: { userId: user.id },
        data: { onboardingCompleted: true },
      });

      const result = await userPreferencesService.completeOnboarding(user.id);

      expect(result.onboardingCompleted).toBe(true);
    });

    it('should throw BadRequestException if no sports selected', async () => {
      const { user } = await seedTestUser();

      await prisma.userPreferences.update({
        where: { userId: user.id },
        data: { selectedSports: [] },
      });

      await expect(userPreferencesService.completeOnboarding(user.id)).rejects.toThrow(BadRequestException);
      await expect(userPreferencesService.completeOnboarding(user.id)).rejects.toThrow(
        'Cannot complete onboarding without selecting at least one sport',
      );
    });

    it('should throw NotFoundException when preferences not found', async () => {
      const nonExistentUserId = 999999;

      await expect(userPreferencesService.completeOnboarding(nonExistentUserId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('addSport', () => {
    it('should add a new sport to preferences', async () => {
      const { user } = await seedTestUser();

      const updatedPreferences = await userPreferencesService.addSport(user.id, SportType.RIDE);

      expect(updatedPreferences.selectedSports).toContain(SportType.RUN);
      expect(updatedPreferences.selectedSports).toContain(SportType.RIDE);

      const dbPreferences = await prisma.userPreferences.findUnique({
        where: { userId: user.id },
      });

      expect(dbPreferences?.selectedSports).toContain(SportType.RUN);
      expect(dbPreferences?.selectedSports).toContain(SportType.RIDE);
    });

    it('should handle all sport types', async () => {
      const { user } = await seedTestUser();

      await userPreferencesService.addSport(user.id, SportType.RIDE);
      const updatedPreferences = await userPreferencesService.addSport(user.id, SportType.SWIM);

      expect(updatedPreferences.selectedSports).toHaveLength(3);
      expect(updatedPreferences.selectedSports).toContain(SportType.RUN);
      expect(updatedPreferences.selectedSports).toContain(SportType.RIDE);
      expect(updatedPreferences.selectedSports).toContain(SportType.SWIM);
    });

    it('should throw BadRequestException if sport already exists', async () => {
      const { user } = await seedTestUser();

      await expect(userPreferencesService.addSport(user.id, SportType.RUN)).rejects.toThrow(BadRequestException);
      await expect(userPreferencesService.addSport(user.id, SportType.RUN)).rejects.toThrow(
        'Sport RUN is already in user preferences',
      );
    });

    it('should throw NotFoundException when preferences not found', async () => {
      const nonExistentUserId = 999999;

      await expect(userPreferencesService.addSport(nonExistentUserId, SportType.RUN)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('removeSport', () => {
    it('should remove sport and delete data when deleteData is true', async () => {
      const { user } = await seedTestUser();

      await userPreferencesService.addSport(user.id, SportType.RIDE);

      const result = await userPreferencesService.removeSport(user.id, SportType.RIDE, true);

      expect(result).toBe(true);

      const dbPreferences = await prisma.userPreferences.findUnique({
        where: { userId: user.id },
      });

      expect(dbPreferences?.selectedSports).toEqual([SportType.RUN]);
    });

    it('should throw BadRequestException when trying to remove last sport', async () => {
      const { user } = await seedTestUser();

      await expect(userPreferencesService.removeSport(user.id, SportType.RUN, true)).rejects.toThrow(
        BadRequestException,
      );
      await expect(userPreferencesService.removeSport(user.id, SportType.RUN, true)).rejects.toThrow(
        'Cannot remove last sport - at least one sport must be selected',
      );
    });

    it('should throw BadRequestException when sport is not in preferences', async () => {
      const { user } = await seedTestUser();

      await expect(userPreferencesService.removeSport(user.id, SportType.SWIM, true)).rejects.toThrow(
        BadRequestException,
      );
      await expect(userPreferencesService.removeSport(user.id, SportType.SWIM, true)).rejects.toThrow(
        'Sport SWIM is not in user preferences',
      );
    });
  });

  describe('cascade operations', () => {
    it('should cascade delete preferences when user deleted', async () => {
      const { user, preferences } = await seedTestUser();

      expect(preferences).toBeDefined();

      const preferencesBefore = await prisma.userPreferences.findUnique({
        where: { userId: user.id },
      });
      expect(preferencesBefore).toBeDefined();

      await prisma.user.delete({
        where: { id: user.id },
      });

      const preferencesAfter = await prisma.userPreferences.findUnique({
        where: { userId: user.id },
      });
      expect(preferencesAfter).toBeNull();
    });

    it('should maintain data integrity across user operations', async () => {
      const { user: user1 } = await seedTestUser({ stravaId: 111111 });
      const { user: user2 } = await seedTestUser({ stravaId: 222222 });

      await userPreferencesService.addSport(user2.id, SportType.RIDE);

      await prisma.user.delete({ where: { id: user1.id } });

      const user1Preferences = await prisma.userPreferences.findUnique({
        where: { userId: user1.id },
      });
      expect(user1Preferences).toBeNull();

      const user2Preferences = await prisma.userPreferences.findUnique({
        where: { userId: user2.id },
      });
      expect(user2Preferences).toBeDefined();
      expect(user2Preferences?.selectedSports).toContain(SportType.RIDE);
    });
  });

  describe('concurrent updates', () => {
    it('should handle concurrent sport additions', async () => {
      const { user } = await seedTestUser();

      const add1 = userPreferencesService.addSport(user.id, SportType.RIDE);
      const add2 = userPreferencesService.addSport(user.id, SportType.SWIM);

      await Promise.allSettled([add1, add2]);

      const finalPreferences = await prisma.userPreferences.findUnique({
        where: { userId: user.id },
      });

      expect(finalPreferences).toBeDefined();
      expect(finalPreferences?.selectedSports).toContain(SportType.RUN);
    });

    it('should maintain consistency with sequential updates', async () => {
      const { user } = await seedTestUser();

      await userPreferencesService.addSport(user.id, SportType.RIDE);
      await userPreferencesService.addSport(user.id, SportType.SWIM);

      const finalPreferences = await prisma.userPreferences.findUnique({
        where: { userId: user.id },
      });

      expect(finalPreferences).toBeDefined();
      expect(finalPreferences?.selectedSports).toHaveLength(3);
    });
  });

  describe('JSON field handling', () => {
    it('should correctly store and retrieve selectedSports as JSON array', async () => {
      const { user } = await seedTestUser();

      await userPreferencesService.addSport(user.id, SportType.RIDE);
      await userPreferencesService.addSport(user.id, SportType.SWIM);

      const preferences = await userPreferencesService.findByUserId(user.id);
      expect(preferences?.selectedSports).toHaveLength(3);

      const dbPreferences = await prisma.userPreferences.findUnique({
        where: { userId: user.id },
      });
      expect(Array.isArray(dbPreferences?.selectedSports)).toBe(true);
    });
  });

  describe('authentication', () => {
    it('should successfully complete onboarding through resolver', async () => {
      const { user } = await seedTestUser();
      const tokenPayload: TokenPayload = {
        sub: user.id,
        stravaId: user.stravaId,
      };

      const result = await userPreferencesResolver.completeOnboarding(tokenPayload);

      expect(result).toBeDefined();
      expect(result.onboardingCompleted).toBe(true);
      expect(result.userId).toBe(user.id);
    });

    it('should successfully add sport through resolver', async () => {
      const { user } = await seedTestUser();
      const tokenPayload: TokenPayload = {
        sub: user.id,
        stravaId: user.stravaId,
      };

      const result = await userPreferencesResolver.addSportToPreferences(tokenPayload, SportType.RIDE);

      expect(result).toBeDefined();
      expect(result.selectedSports).toContain(SportType.RUN);
      expect(result.selectedSports).toContain(SportType.RIDE);
    });

    it('should extract correct user ID from token payload', async () => {
      const { user: user1 } = await seedTestUser({ stravaId: 111111 });
      const { user: user2 } = await seedTestUser({ stravaId: 222222 });

      const tokenPayload1: TokenPayload = {
        sub: user1.id,
        stravaId: user1.stravaId,
      };

      const tokenPayload2: TokenPayload = {
        sub: user2.id,
        stravaId: user2.stravaId,
      };

      await userPreferencesResolver.addSportToPreferences(tokenPayload1, SportType.RIDE);
      await userPreferencesResolver.addSportToPreferences(tokenPayload2, SportType.SWIM);

      const prefs1 = await prisma.userPreferences.findUnique({
        where: { userId: user1.id },
      });

      const prefs2 = await prisma.userPreferences.findUnique({
        where: { userId: user2.id },
      });

      expect(prefs1?.selectedSports).toContain(SportType.RIDE);
      expect(prefs2?.selectedSports).toContain(SportType.SWIM);
    });

    it('should prevent user from modifying another users preferences', async () => {
      const { user: user1 } = await seedTestUser({ stravaId: 111111 });
      const { user: user2 } = await seedTestUser({ stravaId: 222222 });

      const tokenPayloadUser1: TokenPayload = {
        sub: user1.id,
        stravaId: user1.stravaId,
      };

      await userPreferencesResolver.addSportToPreferences(tokenPayloadUser1, SportType.RIDE);

      const user2Preferences = await prisma.userPreferences.findUnique({
        where: { userId: user2.id },
      });

      expect(user2Preferences?.selectedSports).toEqual([SportType.RUN]);
      expect(user2Preferences?.onboardingCompleted).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle adding sport to user with only default sport', async () => {
      const { user } = await seedTestUser();

      const preferencesBeforeUpdate = await prisma.userPreferences.findUnique({
        where: { userId: user.id },
      });
      expect(preferencesBeforeUpdate?.selectedSports).toEqual([SportType.RUN]);
      expect(preferencesBeforeUpdate?.onboardingCompleted).toBe(false);

      const result = await userPreferencesService.addSport(user.id, SportType.RIDE);

      expect(result.selectedSports).toContain(SportType.RUN);
      expect(result.selectedSports).toContain(SportType.RIDE);
    });
  });
});
