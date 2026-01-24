import { Test, TestingModule } from '@nestjs/testing';
import { SyncHistoryResolver } from './sync-history.resolver';
import { SyncHistoryService } from './sync-history.service';
import { SyncHistory } from './models/sync-history.model';
import { SyncStatus } from './enums/sync-status.enum';
import { SyncStage } from './enums/sync-stage.enum';
import { TokenPayload } from '../auth/types';

describe('SyncHistoryResolver', () => {
  let resolver: SyncHistoryResolver;
  let syncHistoryService: SyncHistoryService;

  const mockSyncHistoryService = {
    findLatestForUser: jest.fn(),
  };

  const mockSyncHistory: SyncHistory = {
    id: 1,
    userId: 1,
    status: SyncStatus.COMPLETED,
    stage: SyncStage.DONE,
    totalActivities: 50,
    processedActivities: 50,
    startedAt: new Date('2024-01-01T10:00:00Z'),
    completedAt: new Date('2024-01-01T10:05:00Z'),
  };

  const mockTokenPayload: TokenPayload = {
    sub: 1,
    stravaId: 12345,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SyncHistoryResolver, { provide: SyncHistoryService, useValue: mockSyncHistoryService }],
    }).compile();

    resolver = module.get<SyncHistoryResolver>(SyncHistoryResolver);
    syncHistoryService = module.get<SyncHistoryService>(SyncHistoryService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('latestSyncHistory', () => {
    it('should return the latest sync history for current user', async () => {
      mockSyncHistoryService.findLatestForUser.mockResolvedValue(mockSyncHistory);

      const result = await resolver.latestSyncHistory(mockTokenPayload);

      expect(result).toEqual(mockSyncHistory);
      expect(syncHistoryService.findLatestForUser).toHaveBeenCalledWith(mockTokenPayload.sub);
    });

    it('should return null when no sync history exists', async () => {
      mockSyncHistoryService.findLatestForUser.mockResolvedValue(null);

      const result = await resolver.latestSyncHistory(mockTokenPayload);

      expect(result).toBeNull();
      expect(syncHistoryService.findLatestForUser).toHaveBeenCalledWith(mockTokenPayload.sub);
    });

    it('should use userId from token payload', async () => {
      const differentTokenPayload: TokenPayload = {
        sub: 42,
        stravaId: 99999,
      };

      mockSyncHistoryService.findLatestForUser.mockResolvedValue(null);

      await resolver.latestSyncHistory(differentTokenPayload);

      expect(syncHistoryService.findLatestForUser).toHaveBeenCalledWith(42);
    });
  });
});
