import { ObjectType, Field, ID, Float } from '@nestjs/graphql';
import { GoalTargetType } from '../enums/goal-target-type.enum';
import { GoalPeriodType } from '../enums/goal-period-type.enum';

@ObjectType({
  description: 'A preset goal template with localized title and description',
})
export class GoalTemplate {
  @Field(() => ID)
  id!: number;

  @Field(() => GoalTargetType, { description: 'Type of metric to track' })
  targetType!: GoalTargetType;

  @Field(() => Float, { description: 'Target value for the goal' })
  targetValue!: number;

  @Field(() => GoalPeriodType, {
    description: 'Recommended period type for this template',
  })
  periodType!: GoalPeriodType;

  @Field({
    nullable: true,
    description: 'Suggested sport type (Run, Ride, Swim, or null for all sports)',
  })
  sportType?: string;

  @Field({
    description: 'Template category (beginner, intermediate, advanced, challenge)',
  })
  category!: string;

  @Field({ description: 'Whether this is a system preset template' })
  isPreset!: boolean;

  @Field({
    description: 'Localized title (resolved by field resolver based on user locale)',
  })
  title!: string;

  @Field({
    nullable: true,
    description: 'Localized description (resolved by field resolver based on user locale)',
  })
  description?: string;

  @Field({ description: 'Timestamp when the template was created' })
  createdAt!: Date;

  @Field({ description: 'Timestamp when the template was last updated' })
  updatedAt!: Date;
}
