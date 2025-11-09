import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AuthStatusIndicator } from './auth-status-indicator';

describe('AuthStatusIndicator', () => {
  it('should render badge variant by default', () => {
    render(<AuthStatusIndicator />);

    const status = screen.getByRole('status');
    expect(status).toBeInTheDocument();
    expect(status).toHaveAttribute('aria-label', 'Loading...');
  });

  it('should render inline variant with message', () => {
    render(<AuthStatusIndicator variant="inline" message="Refreshing..." />);

    expect(screen.getByText('Refreshing...')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Refreshing...');
  });

  it('should render compact variant', () => {
    render(<AuthStatusIndicator variant="compact" message="Syncing" />);

    const status = screen.getByRole('status');
    expect(status).toHaveAttribute('aria-label', 'Syncing');
  });

  it('should apply custom className', () => {
    render(<AuthStatusIndicator className="custom-class" />);

    const status = screen.getByRole('status');
    expect(status).toHaveClass('custom-class');
  });

  it('should use motion-safe for animations', () => {
    render(<AuthStatusIndicator />);

    const badge = screen.getByRole('status');
    expect(badge).toHaveClass('motion-safe:animate-pulse');
  });

  it('should have motion-reduce fallback', () => {
    render(<AuthStatusIndicator />);

    const badge = screen.getByRole('status');
    expect(badge).toHaveClass('motion-reduce:opacity-80');
  });

  it('should be accessible with aria attributes', () => {
    render(<AuthStatusIndicator message="Custom message" />);

    const status = screen.getByRole('status');
    expect(status).toHaveAttribute('aria-label', 'Custom message');
    expect(status).toHaveAttribute('aria-busy', 'true');
  });
});
