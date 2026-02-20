import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GoalsEmptyState } from './goals-empty-state';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      title: 'Set your first goal',
      description: 'Track your progress and stay motivated',
      cta: 'Create a goal',
    };
    return translations[key] || key;
  },
}));

describe('GoalsEmptyState', () => {
  it('should render title', () => {
    render(<GoalsEmptyState />);

    expect(screen.getByText('Set your first goal')).toBeInTheDocument();
  });

  it('should render description', () => {
    render(<GoalsEmptyState />);

    expect(screen.getByText('Track your progress and stay motivated')).toBeInTheDocument();
  });

  it('should render CTA button', () => {
    render(<GoalsEmptyState />);

    expect(screen.getByRole('link', { name: /Create a goal/i })).toBeInTheDocument();
  });

  it('should have correct link to goals/new', () => {
    render(<GoalsEmptyState />);

    const link = screen.getByRole('link', { name: /Create a goal/i });
    expect(link).toHaveAttribute('href', '/goals/new');
  });

  it('should render target icon', () => {
    const { container } = render(<GoalsEmptyState />);

    const iconContainer = container.querySelector('.bg-primary\\/10');
    expect(iconContainer).toBeInTheDocument();
    expect(container.querySelector('.text-primary')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const { container } = render(<GoalsEmptyState className="custom-empty-state" />);

    expect(container.querySelector('.custom-empty-state')).toBeInTheDocument();
  });

  it('should render plus icon in button', () => {
    render(<GoalsEmptyState />);

    const button = screen.getByRole('link', { name: /Create a goal/i });
    expect(button.querySelector('svg')).toBeInTheDocument();
  });
});
