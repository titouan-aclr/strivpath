import { Resolver, Query } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { SyncHistory } from './models/sync-history.model';
import { SyncHistoryService } from './sync-history.service';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { TokenPayload } from '../auth/types';

@Resolver(() => SyncHistory)
export class SyncHistoryResolver {
  constructor(private readonly syncHistoryService: SyncHistoryService) {}

  @Query(() => SyncHistory, { nullable: true, description: 'Get the latest sync history for current user' })
  @UseGuards(GqlAuthGuard)
  async latestSyncHistory(@CurrentUser() tokenPayload: TokenPayload): Promise<SyncHistory | null> {
    return this.syncHistoryService.findLatestForUser(tokenPayload.sub);
  }
}
