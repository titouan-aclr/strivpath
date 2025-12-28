'use client';

import { useSyncExternalStore } from 'react';

interface RefreshState {
  isRefreshing: boolean;
}

type RefreshListener = () => void;

class RefreshStateManager {
  private state: RefreshState = { isRefreshing: false };
  private listeners = new Set<RefreshListener>();

  getState = (): RefreshState => {
    return this.state;
  };

  subscribe = (listener: RefreshListener): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  setRefreshing = (isRefreshing: boolean): void => {
    if (this.state.isRefreshing !== isRefreshing) {
      this.state = { isRefreshing };
      this.listeners.forEach(listener => listener());
    }
  };

  reset = (): void => {
    this.state = { isRefreshing: false };
    this.listeners.clear();
  };
}

export const refreshStateManager = new RefreshStateManager();

export function useRefreshState(): RefreshState {
  return useSyncExternalStore(
    refreshStateManager.subscribe,
    refreshStateManager.getState,
    refreshStateManager.getState,
  );
}
