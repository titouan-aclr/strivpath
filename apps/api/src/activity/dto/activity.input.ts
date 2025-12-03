import { InputType, Field, Int } from '@nestjs/graphql';
import { IsOptional, IsInt, Min, Max, IsEnum, IsDate } from 'class-validator';
import { Type } from 'class-transformer';
import { ActivityType } from '../enums/activity-type.enum';
import { OrderBy } from '../enums/order-by.enum';
import { OrderDirection } from '../enums/order-direction.enum';

@InputType()
export class ActivitiesFilterInput {
  @Field(() => Int, { nullable: true, description: 'Number of items to skip' })
  @IsOptional()
  @IsInt()
  @Min(0)
  offset?: number;

  @Field(() => Int, { nullable: true, description: 'Maximum number of items to return' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @Field(() => ActivityType, { nullable: true, description: 'Filter by activity type' })
  @IsOptional()
  @IsEnum(ActivityType)
  type?: ActivityType;

  @Field(() => Date, { nullable: true, description: 'Filter activities starting from this date' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  startDate?: Date;

  @Field(() => Date, { nullable: true, description: 'Filter activities up to this date' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  endDate?: Date;

  @Field(() => OrderBy, { nullable: true, description: 'Field to sort by', defaultValue: OrderBy.DATE })
  @IsOptional()
  @IsEnum(OrderBy)
  orderBy?: OrderBy;

  @Field(() => OrderDirection, { nullable: true, description: 'Sort direction', defaultValue: OrderDirection.DESC })
  @IsOptional()
  @IsEnum(OrderDirection)
  orderDirection?: OrderDirection;
}
