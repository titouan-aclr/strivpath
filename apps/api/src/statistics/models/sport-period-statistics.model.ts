import { ObjectType, Field, Int, Float } from '@nestjs/graphql';

@ObjectType({
  description: 'Aggregated statistics for a sport over a specific time period with trend comparisons',
})
export class SportPeriodStatistics {
  @Field(() => Float, { description: 'Total distance in meters' })
  totalDistance!: number;

  @Field(() => Int, { description: 'Total duration in seconds' })
  totalDuration!: number;

  @Field(() => Int, { description: 'Number of activities in the period' })
  activityCount!: number;

  @Field(() => Float, { description: 'Total elevation gain in meters' })
  totalElevation!: number;

  @Field(() => Float, {
    nullable: true,
    description: 'Percentage change in distance compared to previous period',
  })
  distanceTrend?: number;

  @Field(() => Float, {
    nullable: true,
    description: 'Percentage change in duration compared to previous period',
  })
  durationTrend?: number;

  @Field(() => Float, {
    nullable: true,
    description: 'Percentage change in activity count compared to previous period',
  })
  activityTrend?: number;

  @Field(() => Float, {
    nullable: true,
    description: 'Percentage change in elevation compared to previous period',
  })
  elevationTrend?: number;
}
