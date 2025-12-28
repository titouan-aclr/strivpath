import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { refreshStateManager, useRefreshState } from './use-refresh-state';

describe('RefreshStateManager', () => {
  beforeEach(() => {
    refreshStateManager.reset();
  });

  describe('Initial State', () => {
    it('should have initial state with isRefreshing false', () => {
      const state = refreshStateManager.getState();

      expect(state).toEqual({ isRefreshing: false });
    });

    it('should return fresh state object reference on getState', () => {
      const state1 = refreshStateManager.getState();
      const state2 = refreshStateManager.getState();

      expect(state1).toEqual(state2);
      expect(state1).toBe(state2);
    });
  });

  describe('Subscribe and Notify', () => {
    it('should add listener on subscribe', () => {
      const listener = vi.fn();

      const unsubscribe = refreshStateManager.subscribe(listener);

      expect(typeof unsubscribe).toBe('function');
    });

    it('should call listener when state changes', () => {
      const listener = vi.fn();
      refreshStateManager.subscribe(listener);

      refreshStateManager.setRefreshing(true);

      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('should call multiple listeners when state changes', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();
      const listener3 = vi.fn();

      refreshStateManager.subscribe(listener1);
      refreshStateManager.subscribe(listener2);
      refreshStateManager.subscribe(listener3);

      refreshStateManager.setRefreshing(true);

      expect(listener1).toHaveBeenCalledTimes(1);
      expect(listener2).toHaveBeenCalledTimes(1);
      expect(listener3).toHaveBeenCalledTimes(1);
    });

    it('should not call listener if state value unchanged', () => {
      const listener = vi.fn();
      refreshStateManager.subscribe(listener);

      refreshStateManager.setRefreshing(false);

      expect(listener).not.toHaveBeenCalled();
    });

    it('should call listener on each distinct state change', () => {
      const listener = vi.fn();
      refreshStateManager.subscribe(listener);

      refreshStateManager.setRefreshing(true);
      refreshStateManager.setRefreshing(false);
      refreshStateManager.setRefreshing(true);

      expect(listener).toHaveBeenCalledTimes(3);
    });

    it('should remove listener when unsubscribe is called', () => {
      const listener = vi.fn();
      const unsubscribe = refreshStateManager.subscribe(listener);

      unsubscribe();
      refreshStateManager.setRefreshing(true);

      expect(listener).not.toHaveBeenCalled();
    });

    it('should only remove specific listener on unsubscribe', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();

      const unsubscribe1 = refreshStateManager.subscribe(listener1);
      refreshStateManager.subscribe(listener2);

      unsubscribe1();
      refreshStateManager.setRefreshing(true);

      expect(listener1).not.toHaveBeenCalled();
      expect(listener2).toHaveBeenCalledTimes(1);
    });
  });

  describe('State Updates', () => {
    it('should update state to isRefreshing true', () => {
      refreshStateManager.setRefreshing(true);

      const state = refreshStateManager.getState();
      expect(state.isRefreshing).toBe(true);
    });

    it('should update state to isRefreshing false', () => {
      refreshStateManager.setRefreshing(true);
      refreshStateManager.setRefreshing(false);

      const state = refreshStateManager.getState();
      expect(state.isRefreshing).toBe(false);
    });

    it('should toggle state multiple times', () => {
      refreshStateManager.setRefreshing(true);
      expect(refreshStateManager.getState().isRefreshing).toBe(true);

      refreshStateManager.setRefreshing(false);
      expect(refreshStateManager.getState().isRefreshing).toBe(false);

      refreshStateManager.setRefreshing(true);
      expect(refreshStateManager.getState().isRefreshing).toBe(true);
    });
  });

  describe('Reset', () => {
    it('should reset state to initial values', () => {
      refreshStateManager.setRefreshing(true);

      refreshStateManager.reset();

      const state = refreshStateManager.getState();
      expect(state.isRefreshing).toBe(false);
    });

    it('should clear all listeners on reset', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();

      refreshStateManager.subscribe(listener1);
      refreshStateManager.subscribe(listener2);

      refreshStateManager.reset();
      refreshStateManager.setRefreshing(true);

      expect(listener1).not.toHaveBeenCalled();
      expect(listener2).not.toHaveBeenCalled();
    });

    it('should allow new subscriptions after reset', () => {
      refreshStateManager.reset();

      const listener = vi.fn();
      refreshStateManager.subscribe(listener);

      refreshStateManager.setRefreshing(true);

      expect(listener).toHaveBeenCalledTimes(1);
    });
  });
});

describe('useRefreshState', () => {
  beforeEach(() => {
    refreshStateManager.reset();
  });

  describe('Hook Behavior', () => {
    it('should return initial state', () => {
      const { result } = renderHook(() => useRefreshState());

      expect(result.current).toEqual({ isRefreshing: false });
    });

    it('should update when state changes', () => {
      const { result } = renderHook(() => useRefreshState());

      expect(result.current.isRefreshing).toBe(false);

      act(() => {
        refreshStateManager.setRefreshing(true);
      });

      expect(result.current.isRefreshing).toBe(true);
    });

    it('should reflect multiple state changes', () => {
      const { result } = renderHook(() => useRefreshState());

      act(() => {
        refreshStateManager.setRefreshing(true);
      });
      expect(result.current.isRefreshing).toBe(true);

      act(() => {
        refreshStateManager.setRefreshing(false);
      });
      expect(result.current.isRefreshing).toBe(false);

      act(() => {
        refreshStateManager.setRefreshing(true);
      });
      expect(result.current.isRefreshing).toBe(true);
    });

    it('should share state across multiple hook instances', () => {
      const { result: result1 } = renderHook(() => useRefreshState());
      const { result: result2 } = renderHook(() => useRefreshState());

      expect(result1.current.isRefreshing).toBe(false);
      expect(result2.current.isRefreshing).toBe(false);

      act(() => {
        refreshStateManager.setRefreshing(true);
      });

      expect(result1.current.isRefreshing).toBe(true);
      expect(result2.current.isRefreshing).toBe(true);
    });

    it('should cleanup subscription on unmount', () => {
      const { unmount } = renderHook(() => useRefreshState());

      const listenersCountBefore = (refreshStateManager as unknown as { listeners: Set<() => void> }).listeners.size;

      unmount();

      const listenersCountAfter = (refreshStateManager as unknown as { listeners: Set<() => void> }).listeners.size;

      expect(listenersCountAfter).toBe(listenersCountBefore - 1);
    });

    it('should not affect other hooks when one unmounts', () => {
      const { result: result1 } = renderHook(() => useRefreshState());
      const { unmount: unmount2 } = renderHook(() => useRefreshState());

      unmount2();

      act(() => {
        refreshStateManager.setRefreshing(true);
      });

      expect(result1.current.isRefreshing).toBe(true);
    });
  });

  describe('Integration', () => {
    it('should work with external state manager calls', () => {
      const { result, unmount } = renderHook(() => useRefreshState());

      act(() => {
        refreshStateManager.setRefreshing(true);
      });
      expect(result.current.isRefreshing).toBe(true);

      unmount();

      act(() => {
        refreshStateManager.reset();
      });

      const { result: result2 } = renderHook(() => useRefreshState());
      expect(result2.current.isRefreshing).toBe(false);

      act(() => {
        refreshStateManager.setRefreshing(true);
      });
      expect(result2.current.isRefreshing).toBe(true);
    });

    it('should synchronize state between hook and direct manager access', () => {
      const { result } = renderHook(() => useRefreshState());

      act(() => {
        refreshStateManager.setRefreshing(true);
      });

      expect(result.current.isRefreshing).toBe(true);
      expect(refreshStateManager.getState().isRefreshing).toBe(true);

      act(() => {
        refreshStateManager.setRefreshing(false);
      });

      expect(result.current.isRefreshing).toBe(false);
      expect(refreshStateManager.getState().isRefreshing).toBe(false);
    });
  });
});
