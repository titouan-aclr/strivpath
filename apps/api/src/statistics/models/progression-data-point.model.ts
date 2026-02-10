import { ObjectType, Field, Float, Int } from '@nestjs/graphql';
import { IntervalType } from '../enums/interval-type.enum';

@ObjectType({
  description: 'A single data point for progression chart visualization',
})
export class ProgressionDataPoint {
  @Field(() => Int, { description: 'Index within the interval (0-6 for days, 1-5 for weeks, 0-11 for months)' })
  index!: number;

  @Field(() => IntervalType, { description: 'Type of interval (DAY, WEEK, MONTH)' })
  intervalType!: IntervalType;

  @Field(() => Float, { description: 'Numeric value for the data point' })
  value!: number;
}
