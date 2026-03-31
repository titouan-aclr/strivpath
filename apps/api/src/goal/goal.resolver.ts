import { Resolver, Query, Mutation, Args, Int, Float, ResolveField, Parent } from '@nestjs/graphql';
import { UseGuards, NotFoundException } from '@nestjs/common';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { TokenPayload } from '../auth/types/token-payload.interface';
import { Goal } from './models/goal.model';
import { GoalProgressPoint } from './models/goal-progress-point.model';
import { GoalTemplate } from './models/goal-template.model';
import { CreateGoalInput, UpdateGoalInput, CreateGoalFromTemplateInput } from './dto/goal.input';
import { GoalService } from './goal.service';
import { GoalTemplateService } from './goal-template.service';
import { GoalStatus } from './enums/goal-status.enum';
import { Locale } from './enums/locale.enum';
import { SportType } from '../user-preferences/enums/sport-type.enum';

@Resolver(() => Goal)
export class GoalResolver {
  constructor(
    private readonly goalService: GoalService,
    private readonly goalTemplateService: GoalTemplateService,
  ) {}

  @Query(() => [Goal], {
    description: 'Get all goals for the current user with optional filtering',
  })
  @UseGuards(GqlAuthGuard)
  async goals(
    @CurrentUser() tokenPayload: TokenPayload,
    @Args('status', { type: () => GoalStatus, nullable: true })
    status?: GoalStatus,
    @Args('sportType', { type: () => SportType, nullable: true })
    sportType?: SportType,
    @Args('includeArchived', {
      type: () => Boolean,
      nullable: true,
      defaultValue: false,
    })
    includeArchived?: boolean,
  ): Promise<Goal[]> {
    return this.goalService.findAll(tokenPayload.sub, {
      status,
      sportType,
      includeArchived,
    });
  }

  @Query(() => Goal, {
    nullable: true,
    description: 'Get a single goal by ID (user-scoped)',
  })
  @UseGuards(GqlAuthGuard)
  async goal(
    @CurrentUser() tokenPayload: TokenPayload,
    @Args('id', { type: () => Int }) id: number,
  ): Promise<Goal | null> {
    return this.goalService.findById(id, tokenPayload.sub);
  }

  @Query(() => [Goal], {
    description: 'Get all active goals for the current user',
  })
  @UseGuards(GqlAuthGuard)
  async activeGoals(@CurrentUser() tokenPayload: TokenPayload): Promise<Goal[]> {
    return this.goalService.findActiveGoals(tokenPayload.sub);
  }

  @Query(() => Goal, {
    nullable: true,
    description: 'Get the primary goal for dashboard display (highest priority: global goals first, then by deadline)',
  })
  @UseGuards(GqlAuthGuard)
  async primaryDashboardGoal(@CurrentUser() tokenPayload: TokenPayload): Promise<Goal | null> {
    return this.goalService.findPrimaryDashboardGoal(tokenPayload.sub);
  }

  @Query(() => [Goal], {
    description: 'Get secondary goals for dashboard display (max 2, excluding the primary goal)',
  })
  @UseGuards(GqlAuthGuard)
  async secondaryDashboardGoals(@CurrentUser() tokenPayload: TokenPayload): Promise<Goal[]> {
    return this.goalService.findSecondaryDashboardGoals(tokenPayload.sub);
  }

  @Query(() => [GoalTemplate], {
    description: 'Get all preset goal templates with localized content',
  })
  async goalTemplates(
    @Args('category', { type: () => String, nullable: true })
    category?: string,
    @Args('locale', {
      type: () => Locale,
      nullable: true,
      defaultValue: Locale.EN,
    })
    locale?: Locale,
  ): Promise<GoalTemplate[]> {
    if (category) {
      return this.goalTemplateService.findByCategory(category, locale);
    }
    return this.goalTemplateService.findAll(locale);
  }

  @Mutation(() => Goal, {
    description: 'Create a new custom goal',
  })
  @UseGuards(GqlAuthGuard)
  async createGoal(
    @CurrentUser() tokenPayload: TokenPayload,
    @Args('input', { type: () => CreateGoalInput }) input: CreateGoalInput,
  ): Promise<Goal> {
    return this.goalService.create(tokenPayload.sub, input);
  }

  @Mutation(() => Goal, {
    description: 'Create a goal from a preset template',
  })
  @UseGuards(GqlAuthGuard)
  async createGoalFromTemplate(
    @CurrentUser() tokenPayload: TokenPayload,
    @Args('input', { type: () => CreateGoalFromTemplateInput })
    input: CreateGoalFromTemplateInput,
  ): Promise<Goal> {
    return this.goalTemplateService.createFromTemplate(
      input.templateId,
      tokenPayload.sub,
      input.startDate,
      input.customTitle,
      input.locale,
    );
  }

  @Mutation(() => Goal, {
    description: 'Update an existing goal',
  })
  @UseGuards(GqlAuthGuard)
  async updateGoal(
    @CurrentUser() tokenPayload: TokenPayload,
    @Args('id', { type: () => Int }) id: number,
    @Args('input', { type: () => UpdateGoalInput }) input: UpdateGoalInput,
  ): Promise<Goal> {
    return this.goalService.update(id, tokenPayload.sub, input);
  }

  @Mutation(() => Boolean, {
    description: 'Delete a goal permanently',
  })
  @UseGuards(GqlAuthGuard)
  async deleteGoal(
    @CurrentUser() tokenPayload: TokenPayload,
    @Args('id', { type: () => Int }) id: number,
  ): Promise<boolean> {
    await this.goalService.delete(id, tokenPayload.sub);
    return true;
  }

  @Mutation(() => Goal, {
    description: 'Archive a goal (soft delete, can be restored)',
  })
  @UseGuards(GqlAuthGuard)
  async archiveGoal(
    @CurrentUser() tokenPayload: TokenPayload,
    @Args('id', { type: () => Int }) id: number,
  ): Promise<Goal> {
    return this.goalService.archive(id, tokenPayload.sub);
  }

  @Mutation(() => Goal, {
    description: 'Manually refresh goal progress calculation',
  })
  @UseGuards(GqlAuthGuard)
  async refreshGoalProgress(
    @CurrentUser() tokenPayload: TokenPayload,
    @Args('id', { type: () => Int }) id: number,
  ): Promise<Goal> {
    const goal = await this.goalService.findById(id, tokenPayload.sub);
    if (!goal) {
      throw new NotFoundException(`Goal with ID ${id} not found or does not belong to user`);
    }
    await this.goalService.updateGoalProgress(id);
    return (await this.goalService.findById(id, tokenPayload.sub))!;
  }

  @ResolveField(() => Float, {
    description: 'Calculated progress percentage (0-100+)',
  })
  progressPercentage(@Parent() goal: Goal): number {
    if (goal.targetValue === 0) return 0;
    return Number(((goal.currentValue / goal.targetValue) * 100).toFixed(2));
  }

  @ResolveField(() => Boolean, {
    description: 'Whether the goal end date has passed',
  })
  isExpired(@Parent() goal: Goal): boolean {
    return new Date(goal.endDate) < new Date();
  }

  @ResolveField(() => Int, {
    nullable: true,
    description: 'Number of days remaining until goal end date (null if expired)',
  })
  daysRemaining(@Parent() goal: Goal): number | null {
    const now = new Date();
    const end = new Date(goal.endDate);
    if (end < now) return null;

    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  @ResolveField(() => [GoalProgressPoint], {
    description: 'Historical progress data points for charting (cumulative values per day with activity)',
  })
  async progressHistory(@Parent() goal: Goal): Promise<GoalProgressPoint[]> {
    return this.goalService.calculateProgressHistory(goal);
  }
}
