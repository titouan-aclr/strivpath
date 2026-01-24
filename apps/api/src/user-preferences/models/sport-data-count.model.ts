import { ObjectType, Field, Int } from '@nestjs/graphql';

@ObjectType({ description: 'Count of activities and goals for a specific sport' })
export class SportDataCount {
  @Field(() => Int, { description: 'Number of activities for this sport' })
  activitiesCount!: number;

  @Field(() => Int, { description: 'Number of goals for this sport' })
  goalsCount!: number;
}
