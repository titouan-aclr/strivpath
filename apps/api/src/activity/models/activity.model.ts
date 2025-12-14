import { ObjectType, Field, ID, Int, Float } from '@nestjs/graphql';
import { GraphQLBigInt } from 'graphql-scalars';
import { Split } from '../types/split.type';

@ObjectType()
export class Activity {
  @Field(() => ID)
  id!: number;

  @Field(() => GraphQLBigInt)
  stravaId!: bigint;

  @Field(() => Int)
  userId!: number;

  @Field()
  name!: string;

  @Field()
  type!: string;

  @Field(() => Float)
  distance!: number;

  @Field(() => Int)
  movingTime!: number;

  @Field(() => Int)
  elapsedTime!: number;

  @Field(() => Float)
  totalElevationGain!: number;

  @Field()
  startDate!: Date;

  @Field()
  startDateLocal!: Date;

  @Field()
  timezone!: string;

  @Field(() => Float, { nullable: true })
  averageSpeed?: number;

  @Field(() => Float, { nullable: true })
  maxSpeed?: number;

  @Field(() => Float, { nullable: true })
  averageHeartrate?: number;

  @Field(() => Float, { nullable: true })
  maxHeartrate?: number;

  @Field(() => Float, { nullable: true })
  kilojoules?: number;

  @Field({ nullable: true })
  deviceWatts?: boolean;

  @Field()
  hasKudoed!: boolean;

  @Field(() => Int)
  kudosCount!: number;

  @Field(() => Float, { nullable: true })
  averageCadence?: number;

  @Field(() => Float, { nullable: true, description: 'Maximum altitude in meters' })
  elevHigh?: number;

  @Field(() => Float, { nullable: true, description: 'Minimum altitude in meters' })
  elevLow?: number;

  @Field(() => Float, { nullable: true, description: 'Calories burned' })
  calories?: number;

  @Field(() => [Split], { nullable: true, description: 'Split data per kilometer' })
  splits?: Split[];

  @Field(() => Float, { nullable: true, description: 'Average power in watts' })
  averageWatts?: number;

  @Field(() => Float, { nullable: true, description: 'Weighted average power in watts' })
  weightedAverageWatts?: number;

  @Field(() => Int, { nullable: true, description: 'Maximum power in watts' })
  maxWatts?: number;

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;
}
