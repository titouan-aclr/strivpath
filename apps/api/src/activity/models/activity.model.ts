import { ObjectType, Field, ID, Int, Float } from '@nestjs/graphql';
import { GraphQLBigInt } from 'graphql-scalars';

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

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;
}
