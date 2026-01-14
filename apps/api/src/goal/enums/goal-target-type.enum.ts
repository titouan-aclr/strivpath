import { registerEnumType } from '@nestjs/graphql';

export enum GoalTargetType {
  DISTANCE = 'DISTANCE',
  DURATION = 'DURATION',
  ELEVATION = 'ELEVATION',
  FREQUENCY = 'FREQUENCY',
}

registerEnumType(GoalTargetType, {
  name: 'GoalTargetType',
  description: 'Type of metric to track for a goal (distance, duration, elevation gain, or activity frequency)',
});
