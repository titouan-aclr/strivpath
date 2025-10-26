import { Resolver, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { UserPreferences, UpdateUserPreferencesInput } from '@repo/graphql-types';
import { UserPreferencesService } from './user-preferences.service';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { TokenPayload } from '../auth/types';

@Resolver(() => UserPreferences)
export class UserPreferencesResolver {
  constructor(private readonly userPreferencesService: UserPreferencesService) {}

  @Mutation(() => UserPreferences, { description: 'Update user preferences (sports, locale, theme)' })
  @UseGuards(GqlAuthGuard)
  async updateUserPreferences(
    @Args('input') input: UpdateUserPreferencesInput,
    @CurrentUser() tokenPayload: TokenPayload,
  ): Promise<UserPreferences> {
    return this.userPreferencesService.update(tokenPayload.sub, input);
  }
}
