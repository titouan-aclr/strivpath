import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GoalCompletedMessage } from './goal-completed-message';

const mockUseTranslations = (namespace?: string) => (key: string) => {
  const translations: Record<string, string> = {
    'goals.detail.completed.title': 'Congratulations!',
    'goals.detail.completed.message': 'You have successfully completed this goal',
  };
  const fullKey = namespace ? `${namespace}.${key}` : key;
  return translations[fullKey] || key;
};

vi.mock('next-intl', () => ({
  useTranslations: (namespace?: string) => mockUseTranslations(namespace),
}));

describe('GoalCompletedMessage', () => {
  it('should render congratulations title', () => {
    render(<GoalCompletedMessage />);

    expect(screen.getByText('Congratulations!')).toBeInTheDocument();
  });

  it('should render success message', () => {
    render(<GoalCompletedMessage />);

    expect(screen.getByText('You have successfully completed this goal')).toBeInTheDocument();
  });

  it('should display trophy icon', () => {
    const { container } = render(<GoalCompletedMessage />);

    const icon = container.querySelector('svg');
    expect(icon).toBeInTheDocument();
  });

  it('should have green color scheme', () => {
    const { container } = render(<GoalCompletedMessage />);

    const card = container.querySelector('.border-green-500');
    expect(card).toBeInTheDocument();

    const bgCard = container.querySelector('.bg-green-50');
    expect(bgCard).toBeInTheDocument();
  });

  it('should have trophy icon with green background', () => {
    const { container } = render(<GoalCompletedMessage />);

    const iconContainer = container.querySelector('.bg-green-500\\/20');
    expect(iconContainer).toBeInTheDocument();
  });

  it('should have correct text colors for light and dark mode', () => {
    render(<GoalCompletedMessage />);

    const title = screen.getByText('Congratulations!');
    expect(title).toHaveClass('text-green-700');
    expect(title).toHaveClass('dark:text-green-400');

    const message = screen.getByText('You have successfully completed this goal');
    expect(message).toHaveClass('text-green-600');
    expect(message).toHaveClass('dark:text-green-500');
  });
});
