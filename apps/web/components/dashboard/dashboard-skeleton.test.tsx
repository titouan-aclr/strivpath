import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DashboardSkeleton } from './dashboard-skeleton';

describe('DashboardSkeleton', () => {
  describe('Rendering', () => {
    it('should render without errors', () => {
      const { container } = render(<DashboardSkeleton />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should have loading aria attributes', () => {
      render(<DashboardSkeleton />);
      const skeleton = screen.getByLabelText('Loading dashboard');
      expect(skeleton).toBeInTheDocument();
      expect(skeleton).toHaveAttribute('aria-busy', 'true');
    });
  });

  describe('Structure', () => {
    it('should render header skeleton', () => {
      const { container } = render(<DashboardSkeleton />);
      const headerSkeletons = container.querySelectorAll('.h-8.w-48, .h-4.w-32, .h-9.w-28');
      expect(headerSkeletons.length).toBeGreaterThan(0);
    });

    it('should render goals section skeleton', () => {
      const { container } = render(<DashboardSkeleton />);
      const goalCards = container.querySelectorAll('.grid.gap-4.sm\\:grid-cols-2 > div');
      expect(goalCards.length).toBe(2);
    });

    it('should render heatmap skeleton in col-span-2', () => {
      const { container } = render(<DashboardSkeleton />);
      const heatmapSection = container.querySelector('.lg\\:col-span-2');
      expect(heatmapSection).toBeInTheDocument();
      const heatmapCells = heatmapSection?.querySelectorAll('.grid.grid-cols-\\[repeat\\(53\\,1fr\\)\\] > *');
      expect(heatmapCells?.length).toBe(53 * 7);
    });

    it('should render sport distribution skeleton in col-span-1', () => {
      const { container } = render(<DashboardSkeleton />);
      const sportDistSection = container.querySelector('.lg\\:col-span-1');
      expect(sportDistSection).toBeInTheDocument();
    });

    it('should render sport distribution skeleton with 2 items', () => {
      const { container } = render(<DashboardSkeleton />);
      const sportDistSection = container.querySelector('.lg\\:col-span-1');
      const sportItems = sportDistSection?.querySelectorAll('.space-y-4 > .space-y-2');
      expect(sportItems?.length).toBe(2);
    });

    it('should render recent activities skeleton with 3 items', () => {
      const { container } = render(<DashboardSkeleton />);
      const activitySkeletons = container.querySelectorAll('.space-y-3 > div.p-4');
      expect(activitySkeletons.length).toBe(3);
    });
  });

  describe('Layout', () => {
    it('should have proper grid layout for sport distribution and heatmap', () => {
      const { container } = render(<DashboardSkeleton />);
      const gridContainer = container.querySelector('.grid.grid-cols-1.lg\\:grid-cols-3');
      expect(gridContainer).toBeInTheDocument();
    });

    it('should have sport distribution as 1/3 and heatmap as 2/3', () => {
      const { container } = render(<DashboardSkeleton />);
      const gridContainer = container.querySelector('.grid.grid-cols-1.lg\\:grid-cols-3');
      const colSpan1 = gridContainer?.querySelector('.lg\\:col-span-1');
      const colSpan2 = gridContainer?.querySelector('.lg\\:col-span-2');
      expect(colSpan1).toBeInTheDocument();
      expect(colSpan2).toBeInTheDocument();
    });
  });

  describe('Skeleton Animation', () => {
    it('should have animated skeleton elements', () => {
      const { container } = render(<DashboardSkeleton />);
      const animatedElements = container.querySelectorAll('[class*="animate-pulse"]');
      expect(animatedElements.length).toBeGreaterThan(0);
    });
  });
});
