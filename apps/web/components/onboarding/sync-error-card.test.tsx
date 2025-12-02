import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SyncErrorCard } from './sync-error-card';
import type { OnboardingError } from '@/lib/onboarding/error-handling';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

describe('SyncErrorCard', () => {
  const baseError: OnboardingError = {
    type: 'network',
    message: 'Network connection failed',
    supportId: 'E-ABC123',
    retriable: true,
  };

  describe('Rendering', () => {
    it('should display error message', () => {
      render(<SyncErrorCard error={baseError} />);

      expect(screen.getByText('Network connection failed')).toBeInTheDocument();
    });

    it('should display support ID', () => {
      render(<SyncErrorCard error={baseError} />);

      expect(screen.getByText(/errors.supportId/i)).toBeInTheDocument();
      expect(screen.getByText('E-ABC123')).toBeInTheDocument();
    });

    it('should display title and description', () => {
      render(<SyncErrorCard error={baseError} />);

      expect(screen.getByText('sync.title')).toBeInTheDocument();
      expect(screen.getByText('sync.description')).toBeInTheDocument();
    });

    it('should show error code when provided and not UNKNOWN', () => {
      const errorWithCode: OnboardingError = {
        ...baseError,
        code: 'NETWORK_ERROR',
      };

      render(<SyncErrorCard error={errorWithCode} />);

      expect(screen.getByText(/errors.errorCode/i)).toBeInTheDocument();
    });

    it('should not show error code when code is UNKNOWN', () => {
      const errorWithUnknownCode: OnboardingError = {
        ...baseError,
        code: 'UNKNOWN',
      };

      render(<SyncErrorCard error={errorWithUnknownCode} />);

      expect(screen.queryByText(/errors.errorCode/i)).not.toBeInTheDocument();
    });

    it('should not show error code when code is not provided', () => {
      render(<SyncErrorCard error={baseError} />);

      expect(screen.queryByText(/errors.errorCode/i)).not.toBeInTheDocument();
    });
  });

  describe('Retry Button', () => {
    it('should show retry button when error is retriable and onRetry is provided', () => {
      const onRetry = vi.fn();
      const retriableError: OnboardingError = {
        ...baseError,
        retriable: true,
      };

      render(<SyncErrorCard error={retriableError} onRetry={onRetry} />);

      expect(screen.getByRole('button', { name: 'sync.retry' })).toBeInTheDocument();
    });

    it('should not show retry button when error is not retriable', () => {
      const onRetry = vi.fn();
      const nonRetriableError: OnboardingError = {
        ...baseError,
        retriable: false,
      };

      render(<SyncErrorCard error={nonRetriableError} onRetry={onRetry} />);

      expect(screen.queryByRole('button', { name: 'sync.retry' })).not.toBeInTheDocument();
    });

    it('should not show retry button when onRetry is not provided', () => {
      const retriableError: OnboardingError = {
        ...baseError,
        retriable: true,
      };

      render(<SyncErrorCard error={retriableError} />);

      expect(screen.queryByRole('button', { name: 'sync.retry' })).not.toBeInTheDocument();
    });

    it('should call onRetry when retry button is clicked', async () => {
      const user = userEvent.setup();
      const onRetry = vi.fn();
      const retriableError: OnboardingError = {
        ...baseError,
        retriable: true,
      };

      render(<SyncErrorCard error={retriableError} onRetry={onRetry} />);

      const retryButton = screen.getByRole('button', { name: 'sync.retry' });
      await user.click(retryButton);

      expect(onRetry).toHaveBeenCalledOnce();
    });
  });

  describe('Reconnect Button', () => {
    it('should show reconnect button when error type is token_expired and onReconnect is provided', () => {
      const onReconnect = vi.fn();
      const tokenExpiredError: OnboardingError = {
        type: 'token_expired',
        message: 'Token expired',
        supportId: 'E-TOKEN',
        retriable: false,
      };

      render(<SyncErrorCard error={tokenExpiredError} onReconnect={onReconnect} />);

      expect(screen.getByRole('button', { name: 'errors.reconnectButton' })).toBeInTheDocument();
    });

    it('should not show reconnect button for non-token errors', () => {
      const onReconnect = vi.fn();

      render(<SyncErrorCard error={baseError} onReconnect={onReconnect} />);

      expect(screen.queryByRole('button', { name: 'errors.reconnectButton' })).not.toBeInTheDocument();
    });

    it('should not show reconnect button when onReconnect is not provided', () => {
      const tokenExpiredError: OnboardingError = {
        type: 'token_expired',
        message: 'Token expired',
        supportId: 'E-TOKEN',
        retriable: false,
      };

      render(<SyncErrorCard error={tokenExpiredError} />);

      expect(screen.queryByRole('button', { name: 'errors.reconnectButton' })).not.toBeInTheDocument();
    });

    it('should call onReconnect when reconnect button is clicked', async () => {
      const user = userEvent.setup();
      const onReconnect = vi.fn();
      const tokenExpiredError: OnboardingError = {
        type: 'token_expired',
        message: 'Token expired',
        supportId: 'E-TOKEN',
        retriable: false,
      };

      render(<SyncErrorCard error={tokenExpiredError} onReconnect={onReconnect} />);

      const reconnectButton = screen.getByRole('button', { name: 'errors.reconnectButton' });
      await user.click(reconnectButton);

      expect(onReconnect).toHaveBeenCalledOnce();
    });
  });

  describe('Contact Support Button', () => {
    it('should show contact support button when error type is unknown', () => {
      const unknownError: OnboardingError = {
        type: 'unknown',
        message: 'Unknown error occurred',
        supportId: 'E-UNKNOWN',
        retriable: false,
      };

      render(<SyncErrorCard error={unknownError} />);

      expect(screen.getByRole('button', { name: 'errors.contactSupport' })).toBeInTheDocument();
    });

    it('should not show contact support button for non-unknown errors', () => {
      render(<SyncErrorCard error={baseError} />);

      expect(screen.queryByRole('button', { name: 'errors.contactSupport' })).not.toBeInTheDocument();
    });
  });

  describe('Multiple Buttons', () => {
    it('should show both reconnect and retry buttons when applicable', () => {
      const onRetry = vi.fn();
      const onReconnect = vi.fn();
      const tokenExpiredError: OnboardingError = {
        type: 'token_expired',
        message: 'Token expired',
        supportId: 'E-TOKEN',
        retriable: true,
      };

      render(<SyncErrorCard error={tokenExpiredError} onRetry={onRetry} onReconnect={onReconnect} />);

      expect(screen.getByRole('button', { name: 'errors.reconnectButton' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'sync.retry' })).toBeInTheDocument();
    });
  });
});
