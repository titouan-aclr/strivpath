import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ActivityListSkeleton } from './activity-list-skeleton';

describe('ActivityListSkeleton', () => {
  describe('Rendering', () => {
    it('should render with default count of 5', () => {
      const { container } = render(<ActivityListSkeleton />);
      const skeletonCards = container.querySelectorAll('.space-y-4 > div');
      expect(skeletonCards).toHaveLength(5);
    });

    it('should render with custom count', () => {
      const { container } = render(<ActivityListSkeleton count={3} />);
      const skeletonCards = container.querySelectorAll('.space-y-4 > div');
      expect(skeletonCards).toHaveLength(3);
    });

    it('should render 0 skeletons when count is 0', () => {
      const { container } = render(<ActivityListSkeleton count={0} />);
      const skeletonCards = container.querySelectorAll('.space-y-4 > div');
      expect(skeletonCards).toHaveLength(0);
    });
  });

  describe('Structure', () => {
    it('should render skeleton elements in correct structure', () => {
      const { container } = render(<ActivityListSkeleton count={1} />);

      const card = container.querySelector('.p-6');
      expect(card).toBeInTheDocument();

      const headerSkeletons = container.querySelectorAll('.h-10, .h-5, .h-4');
      expect(headerSkeletons.length).toBeGreaterThan(0);
    });

    it('should render 3-column grid for metrics', () => {
      const { container } = render(<ActivityListSkeleton count={1} />);

      const metricsGrid = container.querySelector('.grid-cols-3');
      expect(metricsGrid).toBeInTheDocument();
    });

    it('should render footer skeletons with border-t', () => {
      const { container } = render(<ActivityListSkeleton count={1} />);

      const footer = container.querySelector('.border-t');
      expect(footer).toBeInTheDocument();
      expect(footer).toHaveClass('pt-3');
    });
  });

  describe('Accessibility', () => {
    it('should have aria-label for screen readers', () => {
      render(<ActivityListSkeleton />);

      const container = screen.getByLabelText('Loading activities');
      expect(container).toBeInTheDocument();
    });

    it('should have aria-busy attribute', () => {
      render(<ActivityListSkeleton />);

      const container = screen.getByLabelText('Loading activities');
      expect(container).toHaveAttribute('aria-busy', 'true');
    });
  });
});
