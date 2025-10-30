import { ObjectType, Field, Int } from '@nestjs/graphql';
import { SportType } from '../enums/sport-type.enum';
import { ThemeType } from '../enums/theme-type.enum';
import { LocaleType } from '../enums/locale-type.enum';

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

  @Field(() => LocaleType)
  locale!: LocaleType;

  @Field(() => ThemeType)
  theme!: ThemeType;

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;
}
