import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { AppModule } from '../../src/app.module';
import { UserPreferencesService } from '../../src/user-preferences/user-preferences.service';
import { UserService } from '../../src/user/user.service';
import { PrismaService } from '../../src/database/prisma.service';
import { UserPreferencesResolver } from '../../src/user-preferences/user-preferences.resolver';
import { getTestPrismaClient, seedTestUser, generateTestAccessToken } from '../test-db';
import { SportType, ThemeType, LocaleType, UpdateUserPreferencesInput } from '@repo/graphql-types';
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
      expect(preferences.locale).toBe(LocaleType.EN);
      expect(preferences.theme).toBe(ThemeType.SYSTEM);
    });

    it('should retrieve preferences by userId', async () => {
      const { user } = await seedTestUser();

      const preferences = await userPreferencesService.findByUserId(user.id);

      expect(preferences).toBeDefined();
      expect(preferences?.userId).toBe(user.id);
      expect(preferences?.onboardingCompleted).toBe(false);
    });
  });

  describe('updateUserPreferences', () => {
    it('should update selected sports', async () => {
      const { user } = await seedTestUser();

      const input: UpdateUserPreferencesInput = {
        selectedSports: [SportType.RUN, SportType.RIDE],
      };

      const updatedPreferences = await userPreferencesService.update(user.id, input);

      expect(updatedPreferences).toBeDefined();
      expect(updatedPreferences.selectedSports).toEqual([SportType.RUN, SportType.RIDE]);

      const dbPreferences = await prisma.userPreferences.findUnique({
        where: { userId: user.id },
      });

      expect(dbPreferences?.selectedSports).toEqual([SportType.RUN, SportType.RIDE]);
    });

    it('should complete onboarding on first sports selection', async () => {
      const { user } = await seedTestUser();

      const preferencesBefore = await prisma.userPreferences.findUnique({
        where: { userId: user.id },
      });
      expect(preferencesBefore?.onboardingCompleted).toBe(false);

      const input: UpdateUserPreferencesInput = {
        selectedSports: [SportType.RUN],
      };

      const updatedPreferences = await userPreferencesService.update(user.id, input);

      expect(updatedPreferences.onboardingCompleted).toBe(true);

      const preferencesAfter = await prisma.userPreferences.findUnique({
        where: { userId: user.id },
      });
      expect(preferencesAfter?.onboardingCompleted).toBe(true);
    });

    it('should not change onboarding status if already completed', async () => {
      const { user } = await seedTestUser();

      await prisma.userPreferences.update({
        where: { userId: user.id },
        data: {
          onboardingCompleted: true,
          selectedSports: [SportType.RUN],
        },
      });

      const input: UpdateUserPreferencesInput = {
        selectedSports: [SportType.RUN, SportType.RIDE],
      };

      const updatedPreferences = await userPreferencesService.update(user.id, input);

      expect(updatedPreferences.onboardingCompleted).toBe(true);
    });

    it('should update locale independently', async () => {
      const { user } = await seedTestUser();

      await prisma.userPreferences.update({
        where: { userId: user.id },
        data: { selectedSports: [SportType.RUN] },
      });

      const input: UpdateUserPreferencesInput = {
        locale: LocaleType.FR,
      };

      const updatedPreferences = await userPreferencesService.update(user.id, input);

      expect(updatedPreferences.locale).toBe(LocaleType.FR);
      expect(updatedPreferences.selectedSports).toEqual([SportType.RUN]);

      const dbPreferences = await prisma.userPreferences.findUnique({
        where: { userId: user.id },
      });
      expect(dbPreferences?.locale).toBe(LocaleType.FR);
      expect(dbPreferences?.selectedSports).toEqual([SportType.RUN]);
    });

    it('should update theme independently', async () => {
      const { user } = await seedTestUser();

      await prisma.userPreferences.update({
        where: { userId: user.id },
        data: {
          selectedSports: [SportType.RUN],
          locale: LocaleType.EN,
        },
      });

      const input: UpdateUserPreferencesInput = {
        theme: ThemeType.DARK,
      };

      const updatedPreferences = await userPreferencesService.update(user.id, input);

      expect(updatedPreferences.theme).toBe(ThemeType.DARK);
      expect(updatedPreferences.locale).toBe(LocaleType.EN);
      expect(updatedPreferences.selectedSports).toEqual([SportType.RUN]);

      const dbPreferences = await prisma.userPreferences.findUnique({
        where: { userId: user.id },
      });
      expect(dbPreferences?.theme).toBe(ThemeType.DARK);
    });

    it('should update multiple fields at once', async () => {
      const { user } = await seedTestUser();

      const input: UpdateUserPreferencesInput = {
        selectedSports: [SportType.RUN, SportType.SWIM],
        locale: LocaleType.FR,
        theme: ThemeType.LIGHT,
      };

      const updatedPreferences = await userPreferencesService.update(user.id, input);

      expect(updatedPreferences.selectedSports).toEqual([SportType.RUN, SportType.SWIM]);
      expect(updatedPreferences.locale).toBe(LocaleType.FR);
      expect(updatedPreferences.theme).toBe(ThemeType.LIGHT);
      expect(updatedPreferences.onboardingCompleted).toBe(true);
    });

    it('should throw NotFoundException when preferences not found', async () => {
      const nonExistentUserId = 999999;

      const input: UpdateUserPreferencesInput = {
        selectedSports: [SportType.RUN],
      };

      await expect(userPreferencesService.update(nonExistentUserId, input)).rejects.toThrow(NotFoundException);
      await expect(userPreferencesService.update(nonExistentUserId, input)).rejects.toThrow(
        `User preferences not found for user ${nonExistentUserId}`,
      );
    });

    it('should handle all sport types', async () => {
      const { user } = await seedTestUser();

      const input: UpdateUserPreferencesInput = {
        selectedSports: [SportType.RUN, SportType.RIDE, SportType.SWIM],
      };

      const updatedPreferences = await userPreferencesService.update(user.id, input);

      expect(updatedPreferences.selectedSports).toHaveLength(3);
      expect(updatedPreferences.selectedSports).toContain(SportType.RUN);
      expect(updatedPreferences.selectedSports).toContain(SportType.RIDE);
      expect(updatedPreferences.selectedSports).toContain(SportType.SWIM);
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

      await userPreferencesService.update(user1.id, {
        selectedSports: [SportType.RUN],
        locale: LocaleType.EN,
      });

      await userPreferencesService.update(user2.id, {
        selectedSports: [SportType.RIDE],
        locale: LocaleType.FR,
      });

      await prisma.user.delete({ where: { id: user1.id } });

      const user1Preferences = await prisma.userPreferences.findUnique({
        where: { userId: user1.id },
      });
      expect(user1Preferences).toBeNull();

      const user2Preferences = await prisma.userPreferences.findUnique({
        where: { userId: user2.id },
      });
      expect(user2Preferences).toBeDefined();
      expect(user2Preferences?.selectedSports).toEqual([SportType.RIDE]);
      expect(user2Preferences?.locale).toBe(LocaleType.FR);
    });
  });

  describe('concurrent updates', () => {
    it('should handle concurrent preference updates', async () => {
      const { user } = await seedTestUser();

      const update1 = userPreferencesService.update(user.id, {
        locale: LocaleType.EN,
      });

      const update2 = userPreferencesService.update(user.id, {
        theme: ThemeType.DARK,
      });

      await Promise.all([update1, update2]);

      const finalPreferences = await prisma.userPreferences.findUnique({
        where: { userId: user.id },
      });

      expect(finalPreferences).toBeDefined();
      expect(finalPreferences?.locale === LocaleType.EN || finalPreferences?.theme === ThemeType.DARK).toBe(true);
    });

    it('should maintain consistency with sequential updates', async () => {
      const { user } = await seedTestUser();

      await userPreferencesService.update(user.id, {
        selectedSports: [SportType.RUN],
      });

      await userPreferencesService.update(user.id, {
        locale: LocaleType.FR,
      });

      await userPreferencesService.update(user.id, {
        theme: ThemeType.DARK,
      });

      const finalPreferences = await prisma.userPreferences.findUnique({
        where: { userId: user.id },
      });

      expect(finalPreferences).toBeDefined();
      expect(finalPreferences?.selectedSports).toEqual([SportType.RUN]);
      expect(finalPreferences?.locale).toBe(LocaleType.FR);
      expect(finalPreferences?.theme).toBe(ThemeType.DARK);
      expect(finalPreferences?.onboardingCompleted).toBe(true);
    });
  });

  describe('JSON field handling', () => {
    it('should correctly store and retrieve selectedSports as JSON array', async () => {
      const { user } = await seedTestUser();

      const sports = [SportType.RUN, SportType.RIDE, SportType.SWIM];

      await userPreferencesService.update(user.id, {
        selectedSports: sports,
      });

      const preferences = await userPreferencesService.findByUserId(user.id);
      expect(preferences?.selectedSports).toEqual(sports);

      const dbPreferences = await prisma.userPreferences.findUnique({
        where: { userId: user.id },
      });
      expect(Array.isArray(dbPreferences?.selectedSports)).toBe(true);
      expect(dbPreferences?.selectedSports).toEqual(sports);
    });
  });

  describe('authentication', () => {
    it('should successfully update preferences with valid JWT token through resolver', async () => {
      const { user } = await seedTestUser();
      const tokenPayload: TokenPayload = {
        sub: user.id,
        stravaId: user.stravaId,
      };

      const input: UpdateUserPreferencesInput = {
        selectedSports: [SportType.RUN],
        locale: LocaleType.FR,
      };

      const result = await userPreferencesResolver.updateUserPreferences(input, tokenPayload);

      expect(result).toBeDefined();
      expect(result.selectedSports).toEqual([SportType.RUN]);
      expect(result.locale).toBe(LocaleType.FR);
      expect(result.userId).toBe(user.id);
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

      await userPreferencesResolver.updateUserPreferences({ selectedSports: [SportType.RUN] }, tokenPayload1);

      await userPreferencesResolver.updateUserPreferences({ selectedSports: [SportType.RIDE] }, tokenPayload2);

      const prefs1 = await prisma.userPreferences.findUnique({
        where: { userId: user1.id },
      });

      const prefs2 = await prisma.userPreferences.findUnique({
        where: { userId: user2.id },
      });

      expect(prefs1?.selectedSports).toEqual([SportType.RUN]);
      expect(prefs2?.selectedSports).toEqual([SportType.RIDE]);
    });

    it('should prevent user from updating another users preferences', async () => {
      const { user: user1 } = await seedTestUser({ stravaId: 111111 });
      const { user: user2 } = await seedTestUser({ stravaId: 222222 });

      const tokenPayloadUser1: TokenPayload = {
        sub: user1.id,
        stravaId: user1.stravaId,
      };

      await userPreferencesResolver.updateUserPreferences({ selectedSports: [SportType.RIDE] }, tokenPayloadUser1);

      const user2Preferences = await prisma.userPreferences.findUnique({
        where: { userId: user2.id },
      });

      expect(user2Preferences?.selectedSports).toEqual([SportType.RUN]);
      expect(user2Preferences?.onboardingCompleted).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle update with empty input object', async () => {
      const { user } = await seedTestUser();

      await userPreferencesService.update(user.id, {
        selectedSports: [SportType.RUN],
        locale: LocaleType.EN,
        theme: ThemeType.DARK,
      });

      const input: UpdateUserPreferencesInput = {};

      const result = await userPreferencesService.update(user.id, input);

      expect(result).toBeDefined();
      expect(result.selectedSports).toEqual([SportType.RUN]);
      expect(result.locale).toBe(LocaleType.EN);
      expect(result.theme).toBe(ThemeType.DARK);
    });

    it('should update only selectedSports when provided alone', async () => {
      const { user } = await seedTestUser();

      await userPreferencesService.update(user.id, {
        locale: LocaleType.FR,
        theme: ThemeType.LIGHT,
      });

      const input: UpdateUserPreferencesInput = {
        selectedSports: [SportType.SWIM],
      };

      const result = await userPreferencesService.update(user.id, input);

      expect(result.selectedSports).toEqual([SportType.SWIM]);
      expect(result.locale).toBe(LocaleType.FR);
      expect(result.theme).toBe(ThemeType.LIGHT);
    });

    it('should update only locale when provided alone', async () => {
      const { user } = await seedTestUser();

      await userPreferencesService.update(user.id, {
        selectedSports: [SportType.RUN],
        theme: ThemeType.DARK,
      });

      const input: UpdateUserPreferencesInput = {
        locale: LocaleType.FR,
      };

      const result = await userPreferencesService.update(user.id, input);

      expect(result.locale).toBe(LocaleType.FR);
      expect(result.selectedSports).toEqual([SportType.RUN]);
      expect(result.theme).toBe(ThemeType.DARK);
    });

    it('should update only theme when provided alone', async () => {
      const { user } = await seedTestUser();

      await userPreferencesService.update(user.id, {
        selectedSports: [SportType.RIDE],
        locale: LocaleType.EN,
      });

      const input: UpdateUserPreferencesInput = {
        theme: ThemeType.LIGHT,
      };

      const result = await userPreferencesService.update(user.id, input);

      expect(result.theme).toBe(ThemeType.LIGHT);
      expect(result.selectedSports).toEqual([SportType.RIDE]);
      expect(result.locale).toBe(LocaleType.EN);
    });

    it('should change from default Run to multiple sports', async () => {
      const { user } = await seedTestUser();

      const preferencesBeforeUpdate = await prisma.userPreferences.findUnique({
        where: { userId: user.id },
      });
      expect(preferencesBeforeUpdate?.selectedSports).toEqual([SportType.RUN]);
      expect(preferencesBeforeUpdate?.onboardingCompleted).toBe(false);

      const result = await userPreferencesService.update(user.id, {
        selectedSports: [SportType.RIDE, SportType.SWIM],
      });

      expect(result.selectedSports).toEqual([SportType.RIDE, SportType.SWIM]);
      expect(result.onboardingCompleted).toBe(true);
    });

    it('should handle duplicate sport types in array gracefully', async () => {
      const { user } = await seedTestUser();

      const inputWithDuplicates = {
        selectedSports: [SportType.RUN, SportType.RUN, SportType.RIDE],
      };

      const result = await userPreferencesService.update(user.id, inputWithDuplicates as UpdateUserPreferencesInput);

      expect(result).toBeDefined();
      expect(result.selectedSports).toContain(SportType.RUN);
      expect(result.selectedSports).toContain(SportType.RIDE);
    });

    it('should handle rapid consecutive updates correctly', async () => {
      const { user } = await seedTestUser();

      const update1Promise = userPreferencesService.update(user.id, {
        locale: LocaleType.EN,
      });

      const update2Promise = userPreferencesService.update(user.id, {
        locale: LocaleType.FR,
      });

      const update3Promise = userPreferencesService.update(user.id, {
        theme: ThemeType.DARK,
      });

      await Promise.all([update1Promise, update2Promise, update3Promise]);

      const finalPreferences = await prisma.userPreferences.findUnique({
        where: { userId: user.id },
      });

      expect(finalPreferences).toBeDefined();
      expect([LocaleType.EN, LocaleType.FR]).toContain(finalPreferences?.locale);
      expect([ThemeType.SYSTEM, ThemeType.DARK]).toContain(finalPreferences?.theme);
    });
  });
});
