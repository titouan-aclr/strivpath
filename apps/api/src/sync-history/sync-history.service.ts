import { Injectable } from '@nestjs/common';
import { SyncHistory } from './models/sync-history.model';
import { SyncStatus } from './enums/sync-status.enum';
import { SyncStage } from './enums/sync-stage.enum';
import { PrismaService } from '../database/prisma.service';
import { SyncHistoryMapper } from './sync-history.mapper';

@Injectable()
export class SyncHistoryService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: number): Promise<SyncHistory> {
    const prismaSyncHistory = await this.prisma.syncHistory.create({
      data: {
        userId,
        status: SyncStatus.PENDING,
        stage: null,
        totalActivities: 0,
        processedActivities: 0,
      },
    });

    return SyncHistoryMapper.toGraphQL(prismaSyncHistory);
  }

  async update(
    id: number,
    data: {
      status?: SyncStatus;
      stage?: SyncStage | null;
      totalActivities?: number;
      processedActivities?: number;
      errorMessage?: string;
      completedAt?: Date;
    },
  ): Promise<SyncHistory> {
    const prismaSyncHistory = await this.prisma.syncHistory.update({
      where: { id },
      data,
    });

    return SyncHistoryMapper.toGraphQL(prismaSyncHistory);
  }

  async findLatestForUser(userId: number): Promise<SyncHistory | null> {
    const prismaSyncHistory = await this.prisma.syncHistory.findFirst({
      where: { userId },
      orderBy: { startedAt: 'desc' },
    });

    return prismaSyncHistory ? SyncHistoryMapper.toGraphQL(prismaSyncHistory) : null;
  }

  async findById(id: number): Promise<SyncHistory | null> {
    const prismaSyncHistory = await this.prisma.syncHistory.findUnique({
      where: { id },
    });

    return prismaSyncHistory ? SyncHistoryMapper.toGraphQL(prismaSyncHistory) : null;
  }
}
