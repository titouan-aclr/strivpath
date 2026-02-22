import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FeaturesSection } from './features-section';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const messages: Record<string, string> = {
      sectionLabel: 'Features',
      heading: 'Everything you need to reach your goals',
      subheading: 'Built for athletes who want to turn their Strava data into real progress.',
      'card1.title': 'Goal Tracking',
      'card1.description': 'Set meaningful targets and watch your progress build week after week.',
      'card2.title': 'Progress Insights',
      'card2.description': 'Visualize your performance trends over time.',
      'card3.title': 'Multi-Sport Support',
      'card3.description': 'Running, cycling, swimming — all your sports in one dashboard.',
      'card4.title': 'Achievements',
      'card4.description': 'Earn badges for milestones, consistency, and personal records.',
      'card4.comingSoon': 'Coming soon',
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

vi.mock('@/components/ui/blur-fade', () => ({
  BlurFade: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/components/ui/border-beam', () => ({
  BorderBeam: () => null,
}));

describe('FeaturesSection', () => {
  it('renders the section label and heading', () => {
    render(<FeaturesSection />);
    expect(screen.getByText('Features')).toBeInTheDocument();
    expect(screen.getByText('Everything you need to reach your goals')).toBeInTheDocument();
  });

  it('renders all four feature card titles', () => {
    render(<FeaturesSection />);
    expect(screen.getByText('Goal Tracking')).toBeInTheDocument();
    expect(screen.getByText('Progress Insights')).toBeInTheDocument();
    expect(screen.getByText('Multi-Sport Support')).toBeInTheDocument();
    expect(screen.getByText('Achievements')).toBeInTheDocument();
  });

  it('renders the "Coming soon" badge only on the fourth card', () => {
    render(<FeaturesSection />);
    const badges = screen.getAllByText('Coming soon');
    expect(badges).toHaveLength(1);
  });

  it('renders all four feature descriptions', () => {
    render(<FeaturesSection />);
    expect(screen.getByText(/watch your progress build/i)).toBeInTheDocument();
    expect(screen.getByText(/performance trends over time/i)).toBeInTheDocument();
    expect(screen.getByText(/all your sports in one dashboard/i)).toBeInTheDocument();
    expect(screen.getByText(/earn badges for milestones/i)).toBeInTheDocument();
  });

  it('renders the section with id="features"', () => {
    const { container } = render(<FeaturesSection />);
    expect(container.querySelector('#features')).toBeInTheDocument();
  });
});
