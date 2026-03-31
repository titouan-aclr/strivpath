import { Module } from '@nestjs/common';
import { SyncHistoryService } from './sync-history.service';
import { SyncHistoryResolver } from './sync-history.resolver';

@Module({
  providers: [SyncHistoryService, SyncHistoryResolver],
  exports: [SyncHistoryService],
})
export class SyncHistoryModule {}
