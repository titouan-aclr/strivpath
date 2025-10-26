import { registerEnumType } from '@nestjs/graphql';

/* eslint-disable no-unused-vars */
export enum SyncStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export enum SyncStage {
  FETCHING = 'FETCHING',
  STORING = 'STORING',
  COMPUTING = 'COMPUTING',
  DONE = 'DONE',
}
/* eslint-enable no-unused-vars */

registerEnumType(SyncStatus, {
  name: 'SyncStatus',
  description: 'Status of an activity synchronization',
});

registerEnumType(SyncStage, {
  name: 'SyncStage',
  description: 'Current stage of an activity synchronization',
});
