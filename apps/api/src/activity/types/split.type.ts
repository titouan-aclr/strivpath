import { ObjectType, Field, Float, Int } from '@nestjs/graphql';

@ObjectType({ description: 'Split data for a segment of the activity' })
export class Split {
  @Field(() => Float, { description: 'Distance of this split in meters' })
  distance!: number;

  @Field(() => Int, { description: 'Moving time for this split in seconds' })
  movingTime!: number;

  @Field(() => Int, { description: 'Elapsed time for this split in seconds' })
  elapsedTime!: number;

  @Field(() => Float, { description: 'Average speed for this split in m/s' })
  averageSpeed!: number;

  @Field(() => Int, { nullable: true, description: 'Elevation gain/loss in meters' })
  elevationDifference?: number;
}
