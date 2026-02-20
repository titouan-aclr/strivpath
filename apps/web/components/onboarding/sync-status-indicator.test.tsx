import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SyncStatusIndicator } from './sync-status-indicator';
import { SyncStage, SyncStatus } from '@/gql/graphql';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

describe('SyncStatusIndicator', () => {
  it('should show pending state when stage has not been reached', () => {
    const { container } = render(
      <SyncStatusIndicator
        stage={SyncStage.Storing}
        currentStage={SyncStage.Fetching}
        status={SyncStatus.InProgress}
      />,
    );

    const icon = container.querySelector('.bg-muted');
    expect(icon).toBeInTheDocument();
  });

  it('should show active state when stage is current', () => {
    const { container } = render(
      <SyncStatusIndicator
        stage={SyncStage.Fetching}
        currentStage={SyncStage.Fetching}
        status={SyncStatus.InProgress}
      />,
    );

    const icon = container.querySelector('.bg-primary');
    expect(icon).toBeInTheDocument();
  });

  it('should show completed state when stage has been passed', () => {
    const { container } = render(
      <SyncStatusIndicator
        stage={SyncStage.Fetching}
        currentStage={SyncStage.Storing}
        status={SyncStatus.InProgress}
      />,
    );

    const icon = container.querySelector('.bg-green-500');
    expect(icon).toBeInTheDocument();
  });

  it('should show completed state when sync is completed', () => {
    const { container } = render(
      <SyncStatusIndicator stage={SyncStage.Fetching} currentStage={SyncStage.Done} status={SyncStatus.Completed} />,
    );

    const icon = container.querySelector('.bg-green-500');
    expect(icon).toBeInTheDocument();
  });

  it('should show failed state when sync has failed', () => {
    const { container } = render(
      <SyncStatusIndicator stage={SyncStage.Fetching} currentStage={SyncStage.Fetching} status={SyncStatus.Failed} />,
    );

    const icon = container.querySelector('.bg-destructive');
    expect(icon).toBeInTheDocument();
  });

  it('should show pending state when currentStage is null', () => {
    const { container } = render(
      <SyncStatusIndicator stage={SyncStage.Fetching} currentStage={null} status={SyncStatus.Pending} />,
    );

    const icon = container.querySelector('.bg-muted');
    expect(icon).toBeInTheDocument();
  });

  it('should display correct label for each stage', () => {
    render(
      <SyncStatusIndicator
        stage={SyncStage.Fetching}
        currentStage={SyncStage.Fetching}
        status={SyncStatus.InProgress}
      />,
    );

    expect(screen.getByText('status.fetching')).toBeInTheDocument();
  });

  it('should have aria-label', () => {
    render(
      <SyncStatusIndicator
        stage={SyncStage.Fetching}
        currentStage={SyncStage.Fetching}
        status={SyncStatus.InProgress}
      />,
    );

    expect(screen.getByLabelText('status.fetching')).toBeInTheDocument();
  });
});
