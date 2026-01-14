import { registerEnumType } from '@nestjs/graphql';

export enum GoalStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  ARCHIVED = 'ARCHIVED',
}

registerEnumType(GoalStatus, {
  name: 'GoalStatus',
  description:
    'Current status of a goal (active, completed when target reached, failed when expired, or archived by user)',
});
