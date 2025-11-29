import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeAll, afterAll } from 'vitest';
import { server } from './mocks/server';

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });

  const originalUnhandledRejection = process.listeners('unhandledRejection');
  process.removeAllListeners('unhandledRejection');

  process.on('unhandledRejection', (reason: unknown) => {
    if (reason instanceof Error && reason.message?.includes('Failed to fetch')) {
      return;
    }
    if (reason instanceof Error && reason.message?.includes('Network error')) {
      return;
    }
    if (reason instanceof Error && reason.message?.includes('Unexpected error')) {
      return;
    }
    if (reason instanceof Error && reason.message?.includes('Internal server error')) {
      return;
    }

    originalUnhandledRejection.forEach(listener => {
      if (typeof listener === 'function') {
        const error = reason instanceof Error ? reason : new Error(String(reason));
        listener(reason, Promise.reject(error));
      }
    });
  });
});

afterEach(() => {
  cleanup();
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});
