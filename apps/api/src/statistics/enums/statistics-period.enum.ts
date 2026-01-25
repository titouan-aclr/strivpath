import { registerEnumType } from '@nestjs/graphql';

export enum StatisticsPeriod {
  WEEK = 'WEEK',
  MONTH = 'MONTH',
  YEAR = 'YEAR',
}

registerEnumType(StatisticsPeriod, {
  name: 'StatisticsPeriod',
  description: 'Time period for statistics aggregation',
});
