import { ObjectType, Field, Float } from '@nestjs/graphql';

@ObjectType({
  description: 'A single data point representing cumulative progress on a specific date',
})
export class GoalProgressPoint {
  @Field({ description: 'Date of the progress point' })
  date!: Date;

  @Field(() => Float, {
    description: 'Cumulative progress value up to this date',
  })
  value!: number;
}
