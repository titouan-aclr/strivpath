import { registerEnumType } from '@nestjs/graphql';

export enum SportType {
  RUN = 'RUN',
  RIDE = 'RIDE',
  SWIM = 'SWIM',
}

registerEnumType(SportType, {
  name: 'SportType',
  description: 'Available sport types for activity tracking',
});
