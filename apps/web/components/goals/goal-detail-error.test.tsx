import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GoalDetailError } from './goal-detail-error';

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
    'goals.detail.error.title': 'Goal Not Found',
    'goals.detail.error.description': 'The goal you are looking for does not exist or has been deleted.',
    'goals.detail.error.goBack': 'Back to Goals',
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

describe('GoalDetailError', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should render error title', () => {
    render(<GoalDetailError />);

    expect(screen.getByText('Goal Not Found')).toBeInTheDocument();
  });

  it('should render error description', () => {
    render(<GoalDetailError />);

    expect(screen.getByText('The goal you are looking for does not exist or has been deleted.')).toBeInTheDocument();
  });

  it('should display alert circle icon', () => {
    const { container } = render(<GoalDetailError />);

    const icon = container.querySelector('svg');
    expect(icon).toBeInTheDocument();
  });

  it('should render go back button', () => {
    render(<GoalDetailError />);

    const button = screen.getByRole('button', { name: /back to goals/i });
    expect(button).toBeInTheDocument();
  });

  it('should navigate to goals list when go back button is clicked', () => {
    render(<GoalDetailError />);

    const button = screen.getByRole('button', { name: /back to goals/i });
    fireEvent.click(button);

    expect(mockPush).toHaveBeenCalledWith('/en/goals');
  });

  it('should have centered layout', () => {
    const { container } = render(<GoalDetailError />);

    const card = container.querySelector('.max-w-md.mx-auto');
    expect(card).toBeInTheDocument();
  });

  it('should have destructive icon background', () => {
    const { container } = render(<GoalDetailError />);

    const iconContainer = container.querySelector('.bg-destructive\\/10');
    expect(iconContainer).toBeInTheDocument();
  });

  it('should have text-center class for content', () => {
    const { container } = render(<GoalDetailError />);

    const content = container.querySelector('.text-center');
    expect(content).toBeInTheDocument();
  });

  it('should render icon with destructive color', () => {
    const { container } = render(<GoalDetailError />);

    const icon = container.querySelector('.text-destructive');
    expect(icon).toBeInTheDocument();
  });

  it('should have correct button with arrow icon', () => {
    render(<GoalDetailError />);

    const button = screen.getByRole('button', { name: /back to goals/i });
    expect(button).toBeInTheDocument();

    const arrowIcon = button.querySelector('svg');
    expect(arrowIcon).toBeInTheDocument();
  });
});
