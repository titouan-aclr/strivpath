import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GoalStatusBadge } from './goal-status-badge';
import { GoalStatus } from '@/gql/graphql';

const mockUseTranslations = (namespace?: string) => (key: string) => {
  const translations: Record<string, string> = {
    'goals.status.active': 'Active',
    'goals.status.completed': 'Completed',
    'goals.status.failed': 'Failed',
    'goals.status.archived': 'Archived',
  };
  const fullKey = namespace ? `${namespace}.${key}` : key;
  return translations[fullKey] || key;
};

vi.mock('next-intl', () => ({
  useTranslations: (namespace?: string) => mockUseTranslations(namespace),
}));

describe('GoalStatusBadge', () => {
  it('should render ACTIVE status with correct text and styles', () => {
    const { container } = render(<GoalStatusBadge status={GoalStatus.Active} />);

    expect(screen.getByText('Active')).toBeInTheDocument();

    const badge = container.querySelector('.bg-goal-progress');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('text-white', 'hover:bg-goal-progress/90');
  });

  it('should render COMPLETED status with correct text and styles', () => {
    const { container } = render(<GoalStatusBadge status={GoalStatus.Completed} />);

    expect(screen.getByText('Completed')).toBeInTheDocument();

    const badge = container.querySelector('.bg-green-500');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('text-white', 'hover:bg-green-500/90');
  });

  it('should render FAILED status with correct text and styles', () => {
    render(<GoalStatusBadge status={GoalStatus.Failed} />);

    expect(screen.getByText('Failed')).toBeInTheDocument();
  });

  it('should render ARCHIVED status with correct text and styles', () => {
    const { container } = render(<GoalStatusBadge status={GoalStatus.Archived} />);

    expect(screen.getByText('Archived')).toBeInTheDocument();

    const badge = container.querySelector('.bg-strava-orange');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('text-white', 'hover:bg-strava-orange/90');
  });
});
