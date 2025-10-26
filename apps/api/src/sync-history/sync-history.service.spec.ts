import { Test, TestingModule } from '@nestjs/testing';
import { SyncHistoryService } from './sync-history.service';
import { PrismaService } from '../database/prisma.service';
import { SyncStatus, SyncStage } from '@repo/graphql-types';

describe('SyncHistoryService', () => {
  let service: SyncHistoryService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    syncHistory: {
      create: jest.fn(),
      update: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SyncHistoryService, { provide: PrismaService, useValue: mockPrismaService }],
    }).compile();

    service = module.get<SyncHistoryService>(SyncHistoryService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new SyncHistory with PENDING status', async () => {
      const userId = 1;
      const mockCreatedSync = {
        id: 1,
        userId,
        status: SyncStatus.PENDING,
        stage: null,
        totalActivities: 0,
        processedActivities: 0,
        errorMessage: null,
        startedAt: new Date(),
        completedAt: null,
      };

      mockPrismaService.syncHistory.create.mockResolvedValue(mockCreatedSync);

      const result = await service.create(userId);

      expect(prismaService.syncHistory.create).toHaveBeenCalledWith({
        data: {
          userId,
          status: SyncStatus.PENDING,
          stage: null,
          totalActivities: 0,
          processedActivities: 0,
        },
      });
      expect(result.userId).toBe(userId);
      expect(result.status).toBe(SyncStatus.PENDING);
    });
  });

  describe('update', () => {
    it('should update sync status and stage', async () => {
      const syncId = 1;
      const updateData = {
        status: SyncStatus.IN_PROGRESS,
        stage: SyncStage.FETCHING,
      };
      const mockUpdatedSync = {
        id: syncId,
        userId: 1,
        status: SyncStatus.IN_PROGRESS,
        stage: SyncStage.FETCHING,
        totalActivities: 0,
        processedActivities: 0,
        errorMessage: null,
        startedAt: new Date(),
        completedAt: null,
      };

      mockPrismaService.syncHistory.update.mockResolvedValue(mockUpdatedSync);

      const result = await service.update(syncId, updateData);

      expect(prismaService.syncHistory.update).toHaveBeenCalledWith({
        where: { id: syncId },
        data: updateData,
      });
      expect(result.status).toBe(SyncStatus.IN_PROGRESS);
      expect(result.stage).toBe(SyncStage.FETCHING);
    });
  });

  describe('findLatestForUser', () => {
    it('should return the latest sync for a user', async () => {
      const userId = 1;
      const mockSync = {
        id: 1,
        userId,
        status: SyncStatus.COMPLETED,
        stage: SyncStage.DONE,
        totalActivities: 10,
        processedActivities: 10,
        errorMessage: null,
        startedAt: new Date(),
        completedAt: new Date(),
      };

      mockPrismaService.syncHistory.findFirst.mockResolvedValue(mockSync);

      const result = await service.findLatestForUser(userId);

      expect(prismaService.syncHistory.findFirst).toHaveBeenCalledWith({
        where: { userId },
        orderBy: { startedAt: 'desc' },
      });
      expect(result?.userId).toBe(userId);
      expect(result?.status).toBe(SyncStatus.COMPLETED);
    });

    it('should return null if no sync found', async () => {
      const userId = 1;

      mockPrismaService.syncHistory.findFirst.mockResolvedValue(null);

      const result = await service.findLatestForUser(userId);

      expect(result).toBeNull();
    });
  });

  describe('findById', () => {
    it('should return sync by id', async () => {
      const syncId = 1;
      const mockSync = {
        id: syncId,
        userId: 1,
        status: SyncStatus.COMPLETED,
        stage: SyncStage.DONE,
        totalActivities: 10,
        processedActivities: 10,
        errorMessage: null,
        startedAt: new Date(),
        completedAt: new Date(),
      };

      mockPrismaService.syncHistory.findUnique.mockResolvedValue(mockSync);

      const result = await service.findById(syncId);

      expect(prismaService.syncHistory.findUnique).toHaveBeenCalledWith({
        where: { id: syncId },
      });
      expect(result?.id).toBe(syncId);
    });
  });
});
