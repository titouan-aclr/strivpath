import { ObjectType, Field, Int, Float } from '@nestjs/graphql';

@ObjectType({
  description: 'Aggregated statistics for a specific time period',
})
export class PeriodStatistics {
  @Field(() => Int, { description: 'Total training time in seconds' })
  totalTime!: number;

  @Field(() => Int, { description: 'Number of activities in the period' })
  activityCount!: number;

  @Field(() => Float, { description: 'Average time per session in seconds' })
  averageTimePerSession!: number;

  @Field({ description: 'Start date of the period' })
  periodStart!: Date;

  @Field({ description: 'End date of the period' })
  periodEnd!: Date;
}
