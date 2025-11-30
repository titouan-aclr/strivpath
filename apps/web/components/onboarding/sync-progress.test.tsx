import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SyncProgress } from './sync-progress';
import { SyncStage } from '@/gql/graphql';
import { MOCK_SYNC_HISTORIES } from '@/mocks/fixtures/onboarding.fixture';
import type { OnboardingError } from '@/lib/onboarding/error-handling';

const { mockUseTranslations } = vi.hoisted(() => ({
  mockUseTranslations: vi.fn(() => (key: string) => key),
}));

vi.mock('next-intl', () => ({
  useTranslations: mockUseTranslations,
}));

vi.mock('./sync-status-indicator', () => ({
  SyncStatusIndicator: ({ stage }: { stage: SyncStage }) => (
    <div data-testid={`status-indicator-${stage}`}>Status: {stage}</div>
  ),
}));

vi.mock('./sync-error-card', () => ({
  SyncErrorCard: ({
    error,
    onRetry,
    onReconnect,
  }: {
    error: OnboardingError;
    onRetry?: () => void;
    onReconnect?: () => void;
  }) => (
    <div data-testid="sync-error-card">
      <div>Error: {error.type}</div>
      {onRetry && <button onClick={onRetry}>Retry</button>}
      {onReconnect && <button onClick={onReconnect}>Reconnect</button>}
    </div>
  ),
}));

describe('SyncProgress', () => {
  const defaultProps = {
    syncStatus: null,
    error: null,
    isInitializing: false,
    isRedirecting: false,
    onRetry: vi.fn(),
  };

  describe('Initializing State', () => {
    it('should show loading UI when initializing', () => {
      render(<SyncProgress {...defaultProps} isInitializing={true} />);

      expect(screen.getByText('title')).toBeInTheDocument();
      expect(screen.getByText('description')).toBeInTheDocument();
      expect(screen.getByText('status.pending')).toBeInTheDocument();
    });

    it('should have loading indicator with accessibility label', () => {
      render(<SyncProgress {...defaultProps} isInitializing={true} />);

      expect(screen.getByLabelText('Loading')).toBeInTheDocument();
    });
  });

  describe('Redirecting State', () => {
    it('should show success UI when redirecting', () => {
      render(<SyncProgress {...defaultProps} isRedirecting={true} />);

      expect(screen.getByText('status.done')).toBeInTheDocument();
      expect(screen.getByText('redirecting')).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('should show error card when error exists', () => {
      const error: OnboardingError = {
        type: 'network',
        message: 'Network error',
        supportId: 'E-12345',
        retriable: true,
      };

      render(<SyncProgress {...defaultProps} error={error} />);

      expect(screen.getByTestId('sync-error-card')).toBeInTheDocument();
      expect(screen.getByText('Error: network')).toBeInTheDocument();
    });

    it('should pass onRetry when error is retriable', () => {
      const error: OnboardingError = {
        type: 'network',
        message: 'Network error',
        supportId: 'E-12345',
        retriable: true,
      };

      render(<SyncProgress {...defaultProps} error={error} />);

      expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
    });

    it('should not pass onRetry when error is not retriable', () => {
      const error: OnboardingError = {
        type: 'unknown',
        message: 'Unknown error',
        supportId: 'E-12345',
        retriable: false,
      };

      render(<SyncProgress {...defaultProps} error={error} />);

      expect(screen.queryByRole('button', { name: 'Retry' })).not.toBeInTheDocument();
    });

    it('should pass onReconnect when error is token_expired', () => {
      const error: OnboardingError = {
        type: 'token_expired',
        message: 'Token expired',
        supportId: 'E-12345',
        retriable: false,
      };

      render(<SyncProgress {...defaultProps} error={error} />);

      expect(screen.getByRole('button', { name: 'Reconnect' })).toBeInTheDocument();
    });

    it('should not pass onReconnect for non-token errors', () => {
      const error: OnboardingError = {
        type: 'network',
        message: 'Network error',
        supportId: 'E-12345',
        retriable: true,
      };

      render(<SyncProgress {...defaultProps} error={error} />);

      expect(screen.queryByRole('button', { name: 'Reconnect' })).not.toBeInTheDocument();
    });
  });

  describe('Null State', () => {
    it('should return null when no syncStatus and no error', () => {
      const { container } = render(<SyncProgress {...defaultProps} syncStatus={null} />);

      expect(container.firstChild).toBeNull();
    });
  });

  describe('Normal Sync Progress', () => {
    it('should render all three status indicators', () => {
      render(<SyncProgress {...defaultProps} syncStatus={MOCK_SYNC_HISTORIES.fetchingInProgress} />);

      expect(screen.getByTestId('status-indicator-FETCHING')).toBeInTheDocument();
      expect(screen.getByTestId('status-indicator-STORING')).toBeInTheDocument();
      expect(screen.getByTestId('status-indicator-COMPUTING')).toBeInTheDocument();
    });

    it('should show progress bar with correct value for fetching stage', () => {
      render(<SyncProgress {...defaultProps} syncStatus={MOCK_SYNC_HISTORIES.fetchingInProgress} />);

      expect(screen.getByLabelText('Progress: 25%')).toBeInTheDocument();
    });

    it('should show progress bar with correct value for storing stage', () => {
      render(<SyncProgress {...defaultProps} syncStatus={MOCK_SYNC_HISTORIES.storingInProgress} />);

      expect(screen.getByLabelText('Progress: 50%')).toBeInTheDocument();
    });

    it('should show progress bar with correct value for computing stage', () => {
      render(<SyncProgress {...defaultProps} syncStatus={MOCK_SYNC_HISTORIES.computingInProgress} />);

      expect(screen.getByLabelText('Progress: 75%')).toBeInTheDocument();
    });

    it('should show 100% progress when completed', () => {
      render(<SyncProgress {...defaultProps} syncStatus={MOCK_SYNC_HISTORIES.completed} />);

      expect(screen.getByLabelText('Progress: 100%')).toBeInTheDocument();
    });

    it('should show activity count when totalActivities > 0', () => {
      render(<SyncProgress {...defaultProps} syncStatus={MOCK_SYNC_HISTORIES.fetchingInProgress} />);

      expect(screen.getByText(/progress/i)).toBeInTheDocument();
    });

    it('should not show activity count when totalActivities is 0', () => {
      const syncWithNoActivities = {
        ...MOCK_SYNC_HISTORIES.pending,
        totalActivities: 0,
        processedActivities: 0,
      };

      render(<SyncProgress {...defaultProps} syncStatus={syncWithNoActivities} />);

      expect(screen.queryByText(/progress/i)).not.toBeInTheDocument();
    });

    it('should have status region with aria-live', () => {
      render(<SyncProgress {...defaultProps} syncStatus={MOCK_SYNC_HISTORIES.fetchingInProgress} />);

      const statusRegion = screen.getByRole('status');
      expect(statusRegion).toHaveAttribute('aria-live', 'polite');
    });
  });
});
