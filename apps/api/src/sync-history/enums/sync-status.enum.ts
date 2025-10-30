import { registerEnumType } from '@nestjs/graphql';

export enum SyncStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

registerEnumType(SyncStatus, {
  name: 'SyncStatus',
  description: 'Status of an activity synchronization',
});
