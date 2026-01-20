import { Resolver, Mutation, Query, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { UserPreferences } from './models/user-preferences.model';
import { SportDataCount } from './models/sport-data-count.model';
import { UserPreferencesService } from './user-preferences.service';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { TokenPayload } from '../auth/types';
import { SportType } from './enums/sport-type.enum';

@Resolver(() => UserPreferences)
export class UserPreferencesResolver {
  constructor(private readonly userPreferencesService: UserPreferencesService) {}

  @Query(() => UserPreferences, { nullable: true, description: 'Get current user preferences' })
  @UseGuards(GqlAuthGuard)
  async userPreferences(@CurrentUser() tokenPayload: TokenPayload): Promise<UserPreferences | null> {
    return this.userPreferencesService.findByUserId(tokenPayload.sub);
  }

  @Query(() => SportDataCount, { description: 'Get count of activities and goals for a sport' })
  @UseGuards(GqlAuthGuard)
  async sportDataCount(
    @CurrentUser() tokenPayload: TokenPayload,
    @Args('sport', { type: () => SportType }) sport: SportType,
  ): Promise<SportDataCount> {
    return this.userPreferencesService.getSportDataCount(tokenPayload.sub, sport);
  }

  @Mutation(() => UserPreferences, { description: 'Complete onboarding process' })
  @UseGuards(GqlAuthGuard)
  async completeOnboarding(@CurrentUser() tokenPayload: TokenPayload): Promise<UserPreferences> {
    return this.userPreferencesService.completeOnboarding(tokenPayload.sub);
  }

  @Mutation(() => UserPreferences, { description: 'Add a sport to user preferences' })
  @UseGuards(GqlAuthGuard)
  async addSportToPreferences(
    @CurrentUser() tokenPayload: TokenPayload,
    @Args('sport', { type: () => SportType }) sport: SportType,
  ): Promise<UserPreferences> {
    return this.userPreferencesService.addSport(tokenPayload.sub, sport);
  }

  @Mutation(() => Boolean, { description: 'Remove a sport from preferences with optional data deletion' })
  @UseGuards(GqlAuthGuard)
  async removeSportFromPreferences(
    @CurrentUser() tokenPayload: TokenPayload,
    @Args('sport', { type: () => SportType }) sport: SportType,
    @Args('deleteData', { type: () => Boolean }) deleteData: boolean,
  ): Promise<boolean> {
    return this.userPreferencesService.removeSport(tokenPayload.sub, sport, deleteData);
  }
}
