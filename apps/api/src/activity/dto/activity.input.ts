import { InputType, Field, Int } from '@nestjs/graphql';
import { IsOptional, IsInt, Min, Max, IsString } from 'class-validator';

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

  @Field({ nullable: true, description: 'Filter by activity type' })
  @IsOptional()
  @IsString()
  type?: string;
}
