import { registerEnumType } from '@nestjs/graphql';

export enum GoalPeriodType {
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  YEARLY = 'YEARLY',
  CUSTOM = 'CUSTOM',
}

registerEnumType(GoalPeriodType, {
  name: 'GoalPeriodType',
  description: 'Time period for goal tracking (weekly from Monday, monthly, yearly, or custom date range)',
});
