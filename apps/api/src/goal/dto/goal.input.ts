import { InputType, Field, Int, Float } from '@nestjs/graphql';
import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsDateString,
  IsBoolean,
  Min,
  MinLength,
} from 'class-validator';
import { GoalTargetType } from '../enums/goal-target-type.enum';
import { GoalPeriodType } from '../enums/goal-period-type.enum';
import { SportType } from '../../user-preferences/enums/sport-type.enum';

@InputType({ description: 'Input for creating a new goal' })
export class CreateGoalInput {
  @Field({ description: 'Goal title' })
  @IsString()
  @MinLength(1)
  title!: string;

  @Field({ nullable: true, description: 'Optional goal description' })
  @IsOptional()
  @IsString()
  description?: string;

  @Field(() => GoalTargetType, { description: 'Type of metric to track' })
  @IsEnum(GoalTargetType)
  targetType!: GoalTargetType;

  @Field(() => Float, {
    description: 'Target value to achieve (must be positive)',
  })
  @IsNumber()
  @Min(0.01)
  targetValue!: number;

  @Field(() => GoalPeriodType, { description: 'Time period type' })
  @IsEnum(GoalPeriodType)
  periodType!: GoalPeriodType;

  @Field({ description: 'Start date of the goal period (ISO 8601 format)' })
  @IsDateString()
  startDate!: string;

  @Field({
    nullable: true,
    description: 'End date (required for CUSTOM period, auto-calculated for others)',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @Field({
    nullable: true,
    defaultValue: false,
    description: 'Whether this goal repeats automatically each period',
  })
  @IsOptional()
  @IsBoolean()
  isRecurring?: boolean;

  @Field({
    nullable: true,
    description: 'End date for recurring goals (null = repeats indefinitely)',
  })
  @IsOptional()
  @IsDateString()
  recurrenceEndDate?: string;

  @Field(() => SportType, {
    nullable: true,
    description: 'Sport type filter (Run, Ride, Swim) or null for all sports',
  })
  @IsOptional()
  @IsEnum(SportType)
  sportType?: SportType;
}

@InputType({ description: 'Input for updating an existing goal' })
export class UpdateGoalInput {
  @Field({ nullable: true, description: 'Updated goal title' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  title?: string;

  @Field({ nullable: true, description: 'Updated goal description' })
  @IsOptional()
  @IsString()
  description?: string;

  @Field(() => Float, {
    nullable: true,
    description: 'Updated target value (must be positive)',
  })
  @IsOptional()
  @IsNumber()
  @Min(0.01)
  targetValue?: number;

  @Field({
    nullable: true,
    description: 'Updated end date (for extending or shortening the goal period)',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

@InputType({ description: 'Input for creating a goal from a preset template' })
export class CreateGoalFromTemplateInput {
  @Field(() => Int, { description: 'ID of the template to use' })
  @IsInt()
  @Min(1)
  templateId!: number;

  @Field({ description: 'Start date for the goal (ISO 8601 format)' })
  @IsDateString()
  startDate!: string;

  @Field({
    nullable: true,
    description: 'Optional custom title (overrides template title)',
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  customTitle?: string;
}
