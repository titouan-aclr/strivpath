import { ObjectType, Field, registerEnumType, Int } from '@nestjs/graphql';

/* eslint-disable no-unused-vars */
export enum SportType {
  RUN = 'Run',
  RIDE = 'Ride',
  SWIM = 'Swim',
}

export enum ThemeType {
  LIGHT = 'light',
  DARK = 'dark',
  SYSTEM = 'system',
}
/* eslint-enable no-unused-vars */

registerEnumType(SportType, {
  name: 'SportType',
  description: 'Available sport types for activity tracking',
});

registerEnumType(ThemeType, {
  name: 'ThemeType',
  description: 'Available theme options',
});

@ObjectType()
export class UserPreferences {
  @Field(() => Int)
  id: number;

  @Field(() => Int)
  userId: number;

  @Field(() => [SportType])
  selectedSports: SportType[];

  @Field()
  onboardingCompleted: boolean;

  @Field()
  locale: string;

  @Field(() => ThemeType)
  theme: ThemeType;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
