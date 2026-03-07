import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGoalSyncNotifications } from './use-goal-sync-notifications';

const { mockRouterPush, mockToastSuccess, mockToastInfo } = vi.hoisted(() => ({
  mockRouterPush: vi.fn(),
  mockToastSuccess: vi.fn(),
  mockToastInfo: vi.fn(),
}));

vi.mock('@/i18n/navigation', () => ({
  useRouter: () => ({ push: mockRouterPush }),
}));

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string, params?: Record<string, unknown>) =>
    params ? `${key}:${JSON.stringify(params)}` : key,
}));

vi.mock('sonner', () => ({
  toast: {
    success: mockToastSuccess,
    info: mockToastInfo,
  },
}));

describe('useGoalSyncNotifications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('notifyGoalUpdates', () => {
    describe('when goalsUpdatedCount is absent or zero', () => {
      it('should not notify when goalsUpdatedCount is undefined', () => {
        const { result } = renderHook(() => useGoalSyncNotifications());

        act(() => {
          result.current.notifyGoalUpdates({});
        });

        expect(mockToastSuccess).not.toHaveBeenCalled();
        expect(mockToastInfo).not.toHaveBeenCalled();
      });

      it('should not notify when goalsUpdatedCount is 0', () => {
        const { result } = renderHook(() => useGoalSyncNotifications());

        act(() => {
          result.current.notifyGoalUpdates({ goalsUpdatedCount: 0 });
        });

        expect(mockToastSuccess).not.toHaveBeenCalled();
        expect(mockToastInfo).not.toHaveBeenCalled();
      });

      it('should not notify when only completedGoalIds are provided without goalsUpdatedCount', () => {
        const { result } = renderHook(() => useGoalSyncNotifications());

        act(() => {
          result.current.notifyGoalUpdates({ completedGoalIds: [1, 2, 3] });
        });

        expect(mockToastSuccess).not.toHaveBeenCalled();
        expect(mockToastInfo).not.toHaveBeenCalled();
      });
    });

    describe('when goals are updated but none completed', () => {
      it('should show info toast with updated count', () => {
        const { result } = renderHook(() => useGoalSyncNotifications());

        act(() => {
          result.current.notifyGoalUpdates({ goalsUpdatedCount: 3 });
        });

        expect(mockToastInfo).toHaveBeenCalledOnce();
        expect(mockToastInfo).toHaveBeenCalledWith(expect.stringContaining('goalsUpdated'), { duration: 3000 });
        expect(mockToastSuccess).not.toHaveBeenCalled();
      });

      it('should pass the updated count to the translation', () => {
        const { result } = renderHook(() => useGoalSyncNotifications());

        act(() => {
          result.current.notifyGoalUpdates({ goalsUpdatedCount: 5 });
        });

        expect(mockToastInfo).toHaveBeenCalledWith(expect.stringContaining('"count":5'), expect.any(Object));
      });

      it('should show info toast when goalsCompletedCount is 0', () => {
        const { result } = renderHook(() => useGoalSyncNotifications());

        act(() => {
          result.current.notifyGoalUpdates({ goalsUpdatedCount: 2, goalsCompletedCount: 0 });
        });

        expect(mockToastInfo).toHaveBeenCalledOnce();
        expect(mockToastSuccess).not.toHaveBeenCalled();
      });
    });

    describe('when goals are completed', () => {
      it('should show success toast with completed count', () => {
        const { result } = renderHook(() => useGoalSyncNotifications());

        act(() => {
          result.current.notifyGoalUpdates({ goalsUpdatedCount: 2, goalsCompletedCount: 2 });
        });

        expect(mockToastSuccess).toHaveBeenCalledOnce();
        expect(mockToastSuccess).toHaveBeenCalledWith(
          expect.stringContaining('goalsCompleted'),
          expect.objectContaining({ duration: 5000 }),
        );
        expect(mockToastInfo).not.toHaveBeenCalled();
      });

      it('should pass the completed count to the translation', () => {
        const { result } = renderHook(() => useGoalSyncNotifications());

        act(() => {
          result.current.notifyGoalUpdates({ goalsUpdatedCount: 1, goalsCompletedCount: 1 });
        });

        expect(mockToastSuccess).toHaveBeenCalledWith(expect.stringContaining('"count":1'), expect.any(Object));
      });

      it('should include a view goals action button', () => {
        const { result } = renderHook(() => useGoalSyncNotifications());

        act(() => {
          result.current.notifyGoalUpdates({ goalsUpdatedCount: 1, goalsCompletedCount: 1 });
        });

        expect(mockToastSuccess).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            action: expect.objectContaining({
              label: 'viewGoals',
              onClick: expect.any(Function),
            }),
          }),
        );
      });

      it('should navigate to /goals when action button is clicked', () => {
        const { result } = renderHook(() => useGoalSyncNotifications());

        act(() => {
          result.current.notifyGoalUpdates({ goalsUpdatedCount: 1, goalsCompletedCount: 1 });
        });

        const { action } = mockToastSuccess.mock.calls[0][1] as { action: { onClick: () => void } };
        act(() => {
          action.onClick();
        });

        expect(mockRouterPush).toHaveBeenCalledOnce();
        expect(mockRouterPush).toHaveBeenCalledWith('/goals');
      });

      it('should show success toast when some goals are completed out of more updated', () => {
        const { result } = renderHook(() => useGoalSyncNotifications());

        act(() => {
          result.current.notifyGoalUpdates({ goalsUpdatedCount: 5, goalsCompletedCount: 2 });
        });

        expect(mockToastSuccess).toHaveBeenCalledOnce();
        expect(mockToastSuccess).toHaveBeenCalledWith(expect.stringContaining('"count":2'), expect.any(Object));
      });
    });

    describe('return value', () => {
      it('should expose notifyGoalUpdates function', () => {
        const { result } = renderHook(() => useGoalSyncNotifications());

        expect(result.current.notifyGoalUpdates).toBeTypeOf('function');
      });
    });
  });
});
