import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GoalCreationProgress } from './goal-creation-progress';

const mockUseTranslations = (namespace?: string) => (key: string) => {
  const translations: Record<string, string> = {
    'goals.create.steps.template': 'Select a template',
    'goals.create.steps.details': 'Configure goal details',
  };
  const fullKey = namespace ? `${namespace}.${key}` : key;
  return translations[fullKey] || key;
};

vi.mock('next-intl', () => ({
  useTranslations: (namespace?: string) => mockUseTranslations(namespace),
}));

describe('GoalCreationProgress', () => {
  it('should render step 1 indicator', () => {
    render(<GoalCreationProgress currentStep={1} />);

    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('should render step 2 indicator', () => {
    render(<GoalCreationProgress currentStep={1} />);

    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('should highlight current step with strava-orange background', () => {
    const { container } = render(<GoalCreationProgress currentStep={1} />);

    const circles = container.querySelectorAll('.rounded-full');
    expect(circles[0]).toHaveClass('bg-strava-orange');
    expect(circles[0]).toHaveClass('text-white');
  });

  it('should not highlight future steps', () => {
    const { container } = render(<GoalCreationProgress currentStep={1} />);

    const circles = container.querySelectorAll('.rounded-full');
    expect(circles[1]).toHaveClass('bg-muted');
    expect(circles[1]).toHaveClass('text-muted-foreground');
  });

  it('should highlight both steps when on step 2', () => {
    const { container } = render(<GoalCreationProgress currentStep={2} />);

    const circles = container.querySelectorAll('.rounded-full');
    expect(circles[0]).toHaveClass('bg-strava-orange');
    expect(circles[1]).toHaveClass('bg-strava-orange');
  });

  it('should display step 1 label when currentStep is 1', () => {
    render(<GoalCreationProgress currentStep={1} />);

    expect(screen.getByText('Select a template')).toBeInTheDocument();
  });

  it('should display step 2 label when currentStep is 2', () => {
    render(<GoalCreationProgress currentStep={2} />);

    expect(screen.getByText('Configure goal details')).toBeInTheDocument();
  });

  it('should have orange connector when past step 1', () => {
    const { container } = render(<GoalCreationProgress currentStep={2} />);

    const connector = container.querySelector('.bg-strava-orange.h-1\\.5.w-32');
    expect(connector).toBeInTheDocument();
  });

  it('should have muted connector when on step 1', () => {
    const { container } = render(<GoalCreationProgress currentStep={1} />);

    const connector = container.querySelector('.bg-muted.h-1\\.5.w-32');
    expect(connector).toBeInTheDocument();
  });

  it('should render circular step indicators', () => {
    const { container } = render(<GoalCreationProgress currentStep={1} />);

    const circles = container.querySelectorAll('.rounded-full.h-10.w-10');
    expect(circles).toHaveLength(2);
  });

  it('should center content', () => {
    const { container } = render(<GoalCreationProgress currentStep={1} />);

    const centerContainer = container.querySelector('.justify-center');
    expect(centerContainer).toBeInTheDocument();

    const textCenter = container.querySelector('.text-center');
    expect(textCenter).toBeInTheDocument();
  });

  it('should have proper z-index for step circles', () => {
    const { container } = render(<GoalCreationProgress currentStep={1} />);

    const circles = container.querySelectorAll('.rounded-full');
    expect(circles[0]).toHaveClass('relative');
    expect(circles[0]).toHaveClass('z-10');
  });

  it('should have transition classes for animations', () => {
    const { container } = render(<GoalCreationProgress currentStep={1} />);

    const circles = container.querySelectorAll('.rounded-full');
    expect(circles[0]).toHaveClass('transition-colors');
    expect(circles[0]).toHaveClass('duration-200');
  });

  it('should have connector with transition', () => {
    const { container } = render(<GoalCreationProgress currentStep={1} />);

    const connector = container.querySelector('.transition-colors.duration-300');
    expect(connector).toBeInTheDocument();
  });
});
