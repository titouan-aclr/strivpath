import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { GoalListSkeleton } from './goal-list-skeleton';
import { GoalDetailSkeleton } from './goal-detail-skeleton';

describe('GoalListSkeleton', () => {
  it('should render default number of skeleton cards (6)', () => {
    const { container } = render(<GoalListSkeleton />);

    const cards = container.querySelectorAll('.grid > div');
    expect(cards).toHaveLength(6);
  });

  it('should render custom number of skeleton cards', () => {
    const { container } = render(<GoalListSkeleton count={3} />);

    const cards = container.querySelectorAll('.grid > div');
    expect(cards).toHaveLength(3);
  });

  it('should render 10 skeleton cards when count is 10', () => {
    const { container } = render(<GoalListSkeleton count={10} />);

    const cards = container.querySelectorAll('.grid > div');
    expect(cards).toHaveLength(10);
  });

  it('should have grid layout with responsive columns', () => {
    const { container } = render(<GoalListSkeleton />);

    const grid = container.querySelector('.grid');
    expect(grid).toHaveClass('grid-cols-1');
    expect(grid).toHaveClass('md:grid-cols-2');
    expect(grid).toHaveClass('lg:grid-cols-3');
  });

  it('should have aria-label for loading state', () => {
    const { container } = render(<GoalListSkeleton />);

    const grid = container.querySelector('[aria-label="Loading goals"]');
    expect(grid).toBeInTheDocument();
  });

  it('should have aria-busy attribute', () => {
    const { container } = render(<GoalListSkeleton />);

    const grid = container.querySelector('[aria-busy="true"]');
    expect(grid).toBeInTheDocument();
  });

  it('should render skeleton elements inside each card', () => {
    const { container } = render(<GoalListSkeleton count={1} />);

    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });
});

describe('GoalDetailSkeleton', () => {
  it('should render main container', () => {
    const { container } = render(<GoalDetailSkeleton />);

    const mainContainer = container.querySelector('.container');
    expect(mainContainer).toBeInTheDocument();
  });

  it('should render header skeleton elements', () => {
    const { container } = render(<GoalDetailSkeleton />);

    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('should have grid layout for cards', () => {
    const { container } = render(<GoalDetailSkeleton />);

    const grid = container.querySelector('.grid');
    expect(grid).toHaveClass('grid-cols-1');
    expect(grid).toHaveClass('lg:grid-cols-2');
  });

  it('should render circular skeleton for progress chart', () => {
    const { container } = render(<GoalDetailSkeleton />);

    const circularSkeleton = container.querySelector('.rounded-full');
    expect(circularSkeleton).toBeInTheDocument();
  });

  it('should render multiple detail rows (4)', () => {
    const { container } = render(<GoalDetailSkeleton />);

    const skeletons = container.querySelectorAll('.animate-pulse');
    const detailRows = Array.from(skeletons).filter(el => el.classList.contains('h-12'));
    expect(detailRows.length).toBeGreaterThanOrEqual(4);
  });

  it('should render action buttons skeleton (3)', () => {
    const { container } = render(<GoalDetailSkeleton />);

    const skeletons = container.querySelectorAll('.animate-pulse');
    const actionButtons = Array.from(skeletons).filter(el => el.classList.contains('h-10'));
    expect(actionButtons.length).toBeGreaterThanOrEqual(3);
  });

  it('should have correct spacing between sections', () => {
    const { container } = render(<GoalDetailSkeleton />);

    const mainContainer = container.querySelector('.space-y-6');
    expect(mainContainer).toBeInTheDocument();
  });
});
