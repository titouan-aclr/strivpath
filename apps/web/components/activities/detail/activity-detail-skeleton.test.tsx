import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ActivityDetailSkeleton } from './activity-detail-skeleton';

describe('ActivityDetailSkeleton', () => {
  it('should render with correct accessibility attributes', () => {
    render(<ActivityDetailSkeleton />);

    const container = screen.getByRole('status');
    expect(container).toHaveAttribute('aria-live', 'polite');
    expect(container).toHaveAttribute('aria-label', 'Loading activity details');
  });

  it('should render header section skeleton', () => {
    const { container } = render(<ActivityDetailSkeleton />);

    const header = container.querySelector('.flex.items-start.gap-4');
    expect(header).toBeInTheDocument();
  });

  it('should render 4 primary stat cards', () => {
    const { container } = render(<ActivityDetailSkeleton />);

    const primaryGrid = container.querySelector('.lg\\:grid-cols-4');
    expect(primaryGrid).toBeInTheDocument();
    expect(primaryGrid?.children).toHaveLength(4);
  });

  it('should render 3 secondary stat cards', () => {
    const { container } = render(<ActivityDetailSkeleton />);

    const secondaryGrid = container.querySelector('.lg\\:grid-cols-3');
    expect(secondaryGrid).toBeInTheDocument();
    expect(secondaryGrid?.children).toHaveLength(3);
  });

  it('should render splits chart skeleton', () => {
    const { container } = render(<ActivityDetailSkeleton />);

    const chartSkeleton = container.querySelector('.h-\\[300px\\]');
    expect(chartSkeleton).toBeInTheDocument();
  });

  it('should have proper spacing between sections', () => {
    const { container } = render(<ActivityDetailSkeleton />);

    const mainContainer = container.querySelector('.space-y-6');
    expect(mainContainer).toBeInTheDocument();
  });

  it('should render stat grids with 2-column mobile layout', () => {
    const { container } = render(<ActivityDetailSkeleton />);

    const primaryGrid = container.querySelector('.grid-cols-2.lg\\:grid-cols-4');
    const secondaryGrid = container.querySelector('.grid-cols-2.lg\\:grid-cols-3');
    expect(primaryGrid).toBeInTheDocument();
    expect(secondaryGrid).toBeInTheDocument();
  });

  it('should render badge skeleton inside the content area, not alongside the icon', () => {
    const { container } = render(<ActivityDetailSkeleton />);

    const headerFlex = container.querySelector('.flex.items-start.gap-4');
    const contentArea = headerFlex?.querySelector('.flex-1');
    const badgeSkeleton = contentArea?.querySelector('.rounded-full');
    expect(badgeSkeleton).toBeInTheDocument();
  });
});
