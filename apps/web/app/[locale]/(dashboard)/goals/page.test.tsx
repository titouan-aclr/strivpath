import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import GoalsPage from './page';

vi.mock('next-intl/server', () => ({
  getTranslations: vi.fn(() =>
    Promise.resolve((key: string) => {
      return `goals.meta.${key}`;
    }),
  ),
}));

const mockUseTranslations = vi.fn((namespace?: string) => (key: string) => {
  const fullKey = namespace ? `${namespace}.${key}` : key;
  return fullKey;
});

vi.mock('next-intl', () => ({
  useTranslations: mockUseTranslations,
  useLocale: () => 'en',
}));

vi.mock('@/lib/goals/use-goals', () => ({
  useGoals: () => ({
    goals: [],
    loading: false,
    error: null,
    refetch: vi.fn(),
  }),
}));

vi.mock('@/lib/goals/use-goal-mutations', () => ({
  useArchiveGoal: () => ({ archiveGoal: vi.fn(), loading: false }),
  useDeleteGoal: () => ({ deleteGoal: vi.fn(), loading: false }),
}));

vi.mock('@/components/goals/goals-page-content', () => ({
  GoalsPageContent: () => <div data-testid="goals-page-content">Goals Page Content</div>,
}));

describe('GoalsPage', () => {
  it('should render GoalsPageContent component', () => {
    render(<GoalsPage />);

    expect(screen.getByTestId('goals-page-content')).toBeInTheDocument();
  });

  it('should render page structure correctly', () => {
    render(<GoalsPage />);

    const content = screen.getByTestId('goals-page-content');
    expect(content).toHaveTextContent('Goals Page Content');
  });
});
