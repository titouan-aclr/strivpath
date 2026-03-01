import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { OnboardingLayout } from './onboarding-layout';

const { mockUsePathname } = vi.hoisted(() => ({
  mockUsePathname: vi.fn<() => string>(() => '/onboarding'),
}));

vi.mock('next/navigation', () => ({
  usePathname: mockUsePathname,
}));

vi.mock('@/components/layout/public-page-header', () => ({
  PublicPageHeader: () => <header data-testid="public-page-header" />,
}));

vi.mock('@/components/onboarding/step-progress-bar', () => ({
  StepProgressBar: ({ currentStepIndex }: { currentStepIndex: number }) => (
    <div data-testid="step-progress-bar" data-step={currentStepIndex} />
  ),
}));

describe('OnboardingLayout', () => {
  describe('rendering', () => {
    it('should render PublicPageHeader', () => {
      render(<OnboardingLayout>Content</OnboardingLayout>);

      expect(screen.getByTestId('public-page-header')).toBeInTheDocument();
    });

    it('should render StepProgressBar', () => {
      render(<OnboardingLayout>Content</OnboardingLayout>);

      expect(screen.getByTestId('step-progress-bar')).toBeInTheDocument();
    });

    it('should render children inside the main element', () => {
      render(
        <OnboardingLayout>
          <div>Step content</div>
        </OnboardingLayout>,
      );

      const main = screen.getByRole('main');
      expect(main).toContainElement(screen.getByText('Step content'));
    });

    it('should apply the topographic background pattern', () => {
      const { container } = render(<OnboardingLayout>Content</OnboardingLayout>);

      expect(container.firstChild).toHaveClass('bg-pattern-topo-subtle');
    });
  });

  describe('step index computation', () => {
    it('should pass step index 0 for /onboarding', () => {
      mockUsePathname.mockReturnValue('/onboarding');
      render(<OnboardingLayout>Content</OnboardingLayout>);

      expect(screen.getByTestId('step-progress-bar')).toHaveAttribute('data-step', '0');
    });

    it('should pass step index 1 for /sync', () => {
      mockUsePathname.mockReturnValue('/sync');
      render(<OnboardingLayout>Content</OnboardingLayout>);

      expect(screen.getByTestId('step-progress-bar')).toHaveAttribute('data-step', '1');
    });

    it('should pass step index 2 for /onboarding-complete', () => {
      mockUsePathname.mockReturnValue('/onboarding-complete');
      render(<OnboardingLayout>Content</OnboardingLayout>);

      expect(screen.getByTestId('step-progress-bar')).toHaveAttribute('data-step', '2');
    });

    it('should strip the English locale prefix before resolving step', () => {
      mockUsePathname.mockReturnValue('/en/onboarding');
      render(<OnboardingLayout>Content</OnboardingLayout>);

      expect(screen.getByTestId('step-progress-bar')).toHaveAttribute('data-step', '0');
    });

    it('should strip the French locale prefix before resolving step', () => {
      mockUsePathname.mockReturnValue('/fr/sync');
      render(<OnboardingLayout>Content</OnboardingLayout>);

      expect(screen.getByTestId('step-progress-bar')).toHaveAttribute('data-step', '1');
    });

    it('should pass step index -1 for an unknown path', () => {
      mockUsePathname.mockReturnValue('/unknown');
      render(<OnboardingLayout>Content</OnboardingLayout>);

      expect(screen.getByTestId('step-progress-bar')).toHaveAttribute('data-step', '-1');
    });
  });
});
