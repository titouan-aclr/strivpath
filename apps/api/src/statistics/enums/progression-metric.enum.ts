import { registerEnumType } from '@nestjs/graphql';

export enum ProgressionMetric {
  DISTANCE = 'DISTANCE',
  DURATION = 'DURATION',
  PACE = 'PACE',
  SPEED = 'SPEED',
  SESSIONS = 'SESSIONS',
  ELEVATION = 'ELEVATION',
}

registerEnumType(ProgressionMetric, {
  name: 'ProgressionMetric',
  description: 'Available metrics for progression chart visualization',
});
