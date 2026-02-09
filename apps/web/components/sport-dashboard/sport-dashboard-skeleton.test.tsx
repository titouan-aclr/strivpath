import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SportDashboardSkeleton } from './sport-dashboard-skeleton';

describe('SportDashboardSkeleton', () => {
  it('should render without errors', () => {
    const { container } = render(<SportDashboardSkeleton />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('should have aria-busy and aria-label for accessibility', () => {
    render(<SportDashboardSkeleton />);

    const skeleton = screen.getByLabelText('Loading sport dashboard');
    expect(skeleton).toHaveAttribute('aria-busy', 'true');
  });

  it('should contain skeleton elements for all sections', () => {
    const { container } = render(<SportDashboardSkeleton />);

    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(10);
  });

  it('should render records skeleton with list layout', () => {
    const { container } = render(<SportDashboardSkeleton />);

    const dividers = container.querySelectorAll('.divide-y');
    expect(dividers.length).toBeGreaterThan(0);
  });
});
