import { render, screen, fireEvent } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { describe, it, expect, vi } from 'vitest';
import { DashboardError } from './dashboard-error';

const messages = {
  dashboard: {
    error: {
      title: 'Failed to load dashboard',
      description: 'An error occurred while loading your dashboard. Please try again.',
      retry: 'Retry',
    },
  },
};

function renderWithIntl(ui: React.ReactElement) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      {ui}
    </NextIntlClientProvider>,
  );
}

describe('DashboardError', () => {
  it('renders error message and retry button', () => {
    const onRetry = vi.fn();
    renderWithIntl(<DashboardError onRetry={onRetry} />);

    expect(screen.getByText('Failed to load dashboard')).toBeInTheDocument();
    expect(screen.getByText('An error occurred while loading your dashboard. Please try again.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });

  it('calls onRetry when retry button is clicked', () => {
    const onRetry = vi.fn();
    renderWithIntl(<DashboardError onRetry={onRetry} />);

    fireEvent.click(screen.getByRole('button', { name: /retry/i }));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('has destructive border styling', () => {
    const onRetry = vi.fn();
    const { container } = renderWithIntl(<DashboardError onRetry={onRetry} />);

    const card = container.querySelector('.border-destructive');
    expect(card).toBeInTheDocument();
  });

  it('renders alert icon with aria-hidden', () => {
    const onRetry = vi.fn();
    const { container } = renderWithIntl(<DashboardError onRetry={onRetry} />);

    const icon = container.querySelector('[aria-hidden="true"]');
    expect(icon).toBeInTheDocument();
  });
});
