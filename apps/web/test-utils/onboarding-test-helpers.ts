import { vi } from 'vitest';

export const setupFakeTimers = () => {
  vi.useFakeTimers();
  return {
    advanceByTime: async (ms: number) => await vi.advanceTimersByTimeAsync(ms),
    runAllTimers: async () => await vi.runAllTimersAsync(),
    cleanup: () => vi.useRealTimers(),
  };
};
