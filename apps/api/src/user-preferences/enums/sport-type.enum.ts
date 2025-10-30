import { registerEnumType } from '@nestjs/graphql';

export enum SportType {
  RUN = 'Run',
  RIDE = 'Ride',
  SWIM = 'Swim',
}

registerEnumType(SportType, {
  name: 'SportType',
  description: 'Available sport types for activity tracking',
});
