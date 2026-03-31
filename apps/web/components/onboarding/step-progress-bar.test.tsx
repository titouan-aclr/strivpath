import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StepProgressBar } from './step-progress-bar';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      'onboarding.steps.selectSports': 'Select your sports',
      'onboarding.steps.syncActivities': 'Sync activities',
      'onboarding.steps.confirmation': 'All set!',
    };
    return translations[key] ?? key;
  },
}));

const MOCK_STEPS = [
  { path: '/onboarding', label: 'onboarding.steps.selectSports' },
  { path: '/sync', label: 'onboarding.steps.syncActivities' },
  { path: '/onboarding-complete', label: 'onboarding.steps.confirmation' },
];

describe('StepProgressBar', () => {
  describe('rendering', () => {
    it('should render the correct number of step circles', () => {
      const { container } = render(<StepProgressBar steps={MOCK_STEPS} currentStepIndex={0} />);

      const circles = container.querySelectorAll('.rounded-full');
      expect(circles).toHaveLength(3);
    });

    it('should render step numbers inside circles', () => {
      render(<StepProgressBar steps={MOCK_STEPS} currentStepIndex={0} />);

      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('should render connectors between steps (steps - 1)', () => {
      const { container } = render(<StepProgressBar steps={MOCK_STEPS} currentStepIndex={0} />);

      const connectors = container.querySelectorAll('.flex-1.h-1\\.5');
      expect(connectors).toHaveLength(2);
    });

    it('should display the label for the current step', () => {
      render(<StepProgressBar steps={MOCK_STEPS} currentStepIndex={1} />);

      expect(screen.getByText('Sync activities')).toBeInTheDocument();
    });

    it('should not display a label when currentStepIndex is out of bounds', () => {
      render(<StepProgressBar steps={MOCK_STEPS} currentStepIndex={-1} />);

      expect(screen.queryByText('Select your sports')).not.toBeInTheDocument();
      expect(screen.queryByText('Sync activities')).not.toBeInTheDocument();
    });
  });

  describe('active state', () => {
    it('should apply active style to current and past steps', () => {
      const { container } = render(<StepProgressBar steps={MOCK_STEPS} currentStepIndex={1} />);

      const circles = container.querySelectorAll('.rounded-full');
      expect(circles[0]).toHaveClass('bg-primary');
      expect(circles[1]).toHaveClass('bg-primary');
      expect(circles[2]).not.toHaveClass('bg-primary');
    });

    it('should apply inactive style to future steps', () => {
      const { container } = render(<StepProgressBar steps={MOCK_STEPS} currentStepIndex={0} />);

      const circles = container.querySelectorAll('.rounded-full');
      expect(circles[1]).toHaveClass('bg-muted');
      expect(circles[2]).toHaveClass('bg-muted');
    });

    it('should apply active style to completed connectors', () => {
      const { container } = render(<StepProgressBar steps={MOCK_STEPS} currentStepIndex={2} />);

      const connectors = container.querySelectorAll('.flex-1');
      expect(connectors[0]).toHaveClass('bg-primary');
      expect(connectors[1]).toHaveClass('bg-primary');
    });

    it('should apply inactive style to pending connectors', () => {
      const { container } = render(<StepProgressBar steps={MOCK_STEPS} currentStepIndex={0} />);

      const connectors = container.querySelectorAll('.flex-1');
      expect(connectors[0]).toHaveClass('bg-muted');
      expect(connectors[1]).toHaveClass('bg-muted');
    });

    it('should only mark the first connector as completed when on step 2', () => {
      const { container } = render(<StepProgressBar steps={MOCK_STEPS} currentStepIndex={1} />);

      const connectors = container.querySelectorAll('.flex-1');
      expect(connectors[0]).toHaveClass('bg-primary');
      expect(connectors[1]).toHaveClass('bg-muted');
    });
  });

  describe('responsive layout', () => {
    it('should have shrink-0 on circles to prevent squishing', () => {
      const { container } = render(<StepProgressBar steps={MOCK_STEPS} currentStepIndex={0} />);

      const circles = container.querySelectorAll('.rounded-full.shrink-0');
      expect(circles).toHaveLength(3);
    });

    it('should constrain the wrapper width to prevent overflow on mobile', () => {
      const { container } = render(<StepProgressBar steps={MOCK_STEPS} currentStepIndex={0} />);

      const wrapper = container.querySelector('.max-w-xs');
      expect(wrapper).toBeInTheDocument();
    });

    it('should use flex-1 connectors that adapt to available width', () => {
      const { container } = render(<StepProgressBar steps={MOCK_STEPS} currentStepIndex={0} />);

      const connectors = container.querySelectorAll('.flex-1');
      connectors.forEach(connector => expect(connector).toHaveClass('flex-1'));
    });

    it('should use smaller circle size on mobile', () => {
      const { container } = render(<StepProgressBar steps={MOCK_STEPS} currentStepIndex={0} />);

      const circles = container.querySelectorAll('.rounded-full');
      circles.forEach(circle => expect(circle).toHaveClass('h-8', 'w-8'));
    });
  });
});
