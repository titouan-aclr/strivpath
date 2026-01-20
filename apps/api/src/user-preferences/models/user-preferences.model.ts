import { ObjectType, Field, Int } from '@nestjs/graphql';
import { SportType } from '../enums/sport-type.enum';

@ObjectType()
export class UserPreferences {
  @Field(() => Int)
  id!: number;

  @Field(() => Int)
  userId!: number;

  @Field(() => [SportType])
  selectedSports!: SportType[];

  @Field()
  onboardingCompleted!: boolean;

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;
}
