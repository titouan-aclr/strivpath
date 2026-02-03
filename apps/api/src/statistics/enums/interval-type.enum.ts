import { registerEnumType } from '@nestjs/graphql';

export enum IntervalType {
  DAY = 'DAY',
  WEEK = 'WEEK',
  MONTH = 'MONTH',
}

registerEnumType(IntervalType, {
  name: 'IntervalType',
  description: 'Type of time interval for progression data',
});
