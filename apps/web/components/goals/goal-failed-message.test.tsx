import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GoalFailedMessage } from './goal-failed-message';

const mockPush = vi.fn();
const mockRouter = {
  push: mockPush,
  back: vi.fn(),
  forward: vi.fn(),
  refresh: vi.fn(),
  replace: vi.fn(),
  prefetch: vi.fn(),
};

const mockUseTranslations = (namespace?: string) => (key: string) => {
  const translations: Record<string, string> = {
    'goals.detail.failed.title': 'Goal Not Achieved',
    'goals.detail.failed.message': "Don't give up! Try again with a new goal.",
    'goals.detail.failed.createNew': 'Create New Goal',
  };
  const fullKey = namespace ? `${namespace}.${key}` : key;
  return translations[fullKey] || key;
};

vi.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
}));

vi.mock('next-intl', () => ({
  useTranslations: (namespace?: string) => mockUseTranslations(namespace),
  useLocale: () => 'en',
}));

describe('GoalFailedMessage', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should render failure title', () => {
    render(<GoalFailedMessage />);

    expect(screen.getByText('Goal Not Achieved')).toBeInTheDocument();
  });

  it('should render encouragement message', () => {
    render(<GoalFailedMessage />);

    expect(screen.getByText("Don't give up! Try again with a new goal.")).toBeInTheDocument();
  });

  it('should display trending down icon', () => {
    const { container } = render(<GoalFailedMessage />);

    const icon = container.querySelector('svg');
    expect(icon).toBeInTheDocument();
  });

  it('should have amber color scheme', () => {
    const { container } = render(<GoalFailedMessage />);

    const card = container.querySelector('.border-amber-500');
    expect(card).toBeInTheDocument();

    const bgCard = container.querySelector('.bg-amber-50');
    expect(bgCard).toBeInTheDocument();
  });

  it('should render create new button with correct text', () => {
    render(<GoalFailedMessage />);

    const button = screen.getByRole('button', { name: /create new goal/i });
    expect(button).toBeInTheDocument();
  });

  it('should navigate to new goal page when create button is clicked', async () => {
    const user = userEvent.setup();
    render(<GoalFailedMessage />);

    const button = screen.getByRole('button', { name: /create new goal/i });
    await user.click(button);

    expect(mockPush).toHaveBeenCalledWith('/en/goals/new');
  });

  it('should have correct text colors for light and dark mode', () => {
    render(<GoalFailedMessage />);

    const title = screen.getByText('Goal Not Achieved');
    expect(title).toHaveClass('text-amber-700');
    expect(title).toHaveClass('dark:text-amber-400');

    const message = screen.getByText("Don't give up! Try again with a new goal.");
    expect(message).toHaveClass('text-amber-600');
    expect(message).toHaveClass('dark:text-amber-500');
  });

  it('should have icon with amber background', () => {
    const { container } = render(<GoalFailedMessage />);

    const iconContainer = container.querySelector('.bg-amber-500\\/20');
    expect(iconContainer).toBeInTheDocument();
  });
});
