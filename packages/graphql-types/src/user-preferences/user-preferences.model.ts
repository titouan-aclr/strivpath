import { ObjectType, Field, registerEnumType, Int } from '@nestjs/graphql';

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

export enum LocaleType {
  EN = 'en',
  FR = 'fr',
}

registerEnumType(SportType, {
  name: 'SportType',
  description: 'Available sport types for activity tracking',
});

registerEnumType(ThemeType, {
  name: 'ThemeType',
  description: 'Available theme options',
});

registerEnumType(LocaleType, {
  name: 'LocaleType',
  description: 'Available locale options',
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

  @Field(() => LocaleType)
  locale: LocaleType;

  @Field(() => ThemeType)
  theme: ThemeType;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
