import { ObjectType, Field, ID, Int, Float } from '@nestjs/graphql';
import { GoalTargetType } from '../enums/goal-target-type.enum';
import { GoalPeriodType } from '../enums/goal-period-type.enum';
import { GoalStatus } from '../enums/goal-status.enum';

@ObjectType({
  description: 'A user goal for tracking progress over a defined period',
})
export class Goal {
  @Field(() => ID)
  id!: number;

  @Field(() => Int, { description: 'ID of the user who owns this goal' })
  userId!: number;

  @Field({ description: 'Goal title (e.g., "Run 50km this month")' })
  title!: string;

  @Field({
    nullable: true,
    description: 'Optional description or notes about the goal',
  })
  description?: string;

  @Field(() => GoalTargetType, { description: 'Type of metric being tracked' })
  targetType!: GoalTargetType;

  @Field(() => Float, {
    description: 'Target value to achieve (e.g., 50 for 50km)',
  })
  targetValue!: number;

  @Field(() => GoalPeriodType, {
    description: 'Time period type for this goal',
  })
  periodType!: GoalPeriodType;

  @Field({ description: 'Start date of the goal period' })
  startDate!: Date;

  @Field({ description: 'End date of the goal period' })
  endDate!: Date;

  @Field(() => Int, {
    nullable: true,
    description: 'ID of the template this goal was created from (if any)',
  })
  templateId?: number;

  @Field({
    nullable: true,
    description: 'Sport type filter (Run, Ride, Swim, or null for all sports)',
  })
  sportType?: string;

  @Field(() => GoalStatus, { description: 'Current status of the goal' })
  status!: GoalStatus;

  @Field(() => Float, {
    description: 'Current progress value (updated automatically from activities)',
  })
  currentValue!: number;

  @Field({
    nullable: true,
    description: 'Timestamp when the goal was completed',
  })
  completedAt?: Date;

  @Field({ description: 'Timestamp when the goal was created' })
  createdAt!: Date;

  @Field({ description: 'Timestamp when the goal was last updated' })
  updatedAt!: Date;
}
