import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HowItWorksSection } from './how-it-works-section';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const messages: Record<string, string> = {
      sectionLabel: 'How it works',
      heading: 'From Strava to your goals in 3 steps',
      'step1.title': 'Connect Strava',
      'step1.description': 'Log in with your Strava account. We import your activities automatically.',
      'step2.title': 'Set your goals',
      'step2.description': 'Choose a target: distance, duration, elevation. Set a deadline.',
      'step3.title': 'Celebrate progress',
      'step3.description': 'Watch your goals advance with every Strava sync.',
    };
    return messages[key] ?? key;
  },
}));

vi.mock('motion/react', () => ({
  motion: {
    div: ({ children, className }: { children?: React.ReactNode; className?: string }) => (
      <div className={className}>{children}</div>
    ),
  },
}));

vi.mock('@/components/ui/animated-beam', () => ({
  AnimatedBeam: () => null,
}));

vi.mock('@/components/ui/blur-fade', () => ({
  BlurFade: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe('HowItWorksSection', () => {
  it('renders the section label and heading', () => {
    render(<HowItWorksSection />);
    expect(screen.getByText('How it works')).toBeInTheDocument();
    expect(screen.getByText('From Strava to your goals in 3 steps')).toBeInTheDocument();
  });

  it('renders all three step titles', () => {
    render(<HowItWorksSection />);
    expect(screen.getByText('Connect Strava')).toBeInTheDocument();
    expect(screen.getByText('Set your goals')).toBeInTheDocument();
    expect(screen.getByText('Celebrate progress')).toBeInTheDocument();
  });

  it('renders step numbers 1, 2, 3', () => {
    render(<HowItWorksSection />);
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('renders all three step descriptions', () => {
    render(<HowItWorksSection />);
    expect(screen.getByText(/import your activities automatically/i)).toBeInTheDocument();
    expect(screen.getByText(/set a deadline/i)).toBeInTheDocument();
    expect(screen.getByText(/every strava sync/i)).toBeInTheDocument();
  });

  it('renders the section with id="how-it-works"', () => {
    const { container } = render(<HowItWorksSection />);
    expect(container.querySelector('#how-it-works')).toBeInTheDocument();
  });
});
