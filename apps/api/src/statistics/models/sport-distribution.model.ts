import { ObjectType, Field, Float, Int } from '@nestjs/graphql';
import { SportType } from '../../user-preferences/enums/sport-type.enum';

@ObjectType({
  description: 'Distribution of training time by sport type for the current month',
})
export class SportDistribution {
  @Field(() => SportType, { description: 'The sport type' })
  sport!: SportType;

  @Field(() => Float, { description: 'Percentage of total training time (0-100)' })
  percentage!: number;

  @Field(() => Int, { description: 'Total time in seconds for this sport' })
  totalTime!: number;
}
