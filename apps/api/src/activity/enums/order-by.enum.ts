import { registerEnumType } from '@nestjs/graphql';

export enum OrderBy {
  DATE = 'DATE',
  DISTANCE = 'DISTANCE',
  DURATION = 'DURATION',
}

registerEnumType(OrderBy, {
  name: 'OrderBy',
  description: 'Field to order activities by',
});
