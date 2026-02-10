import { ObjectType, Field, Float } from '@nestjs/graphql';

@ObjectType({
  description: 'Average performance metrics for a sport over a time period',
})
export class SportAverageMetrics {
  @Field(() => Float, {
    nullable: true,
    description: 'Average pace in seconds per kilometer (for running/swimming)',
  })
  averagePace?: number;

  @Field(() => Float, {
    nullable: true,
    description: 'Average speed in meters per second (for cycling)',
  })
  averageSpeed?: number;

  @Field(() => Float, {
    nullable: true,
    description: 'Average heart rate in beats per minute',
  })
  averageHeartRate?: number;

  @Field(() => Float, {
    nullable: true,
    description: 'Average cadence (steps/strokes per minute)',
  })
  averageCadence?: number;

  @Field(() => Float, {
    nullable: true,
    description: 'Average power output in watts (cycling only)',
  })
  averagePower?: number;
}
