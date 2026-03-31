import { registerEnumType } from '@nestjs/graphql';

export enum SyncStage {
  FETCHING = 'FETCHING',
  STORING = 'STORING',
  COMPUTING = 'COMPUTING',
  DONE = 'DONE',
}

registerEnumType(SyncStage, {
  name: 'SyncStage',
  description: 'Current stage of an activity synchronization',
});
