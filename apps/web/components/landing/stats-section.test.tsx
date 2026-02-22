import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { StatsSection } from './stats-section';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const messages: Record<string, string> = {
      sectionLabel: 'By the numbers',
      heading: 'Built around what matters',
      'stat1.label': 'Goal types to set',
      'stat2.label': 'Sports tracked in one place',
      'stat3.label': 'Milestones to unlock',
    };
    return messages[key] ?? key;
  },
}));

vi.mock('@/components/ui/blur-fade', () => ({
  BlurFade: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/components/ui/number-ticker', () => ({
  NumberTicker: ({ value, className }: { value: number; className?: string }) => (
    <span className={className}>{value}</span>
  ),
}));

vi.mock('motion/react', () => ({
  motion: {
    span: ({ children, className }: { children?: React.ReactNode; className?: string }) => (
      <span className={className}>{children}</span>
    ),
  },
  useInView: () => true,
}));

describe('StatsSection', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders the section label and heading', () => {
    render(<StatsSection />);
    expect(screen.getByText('By the numbers')).toBeInTheDocument();
    expect(screen.getByText('Built around what matters')).toBeInTheDocument();
  });

  it('renders numeric stat values via NumberTicker', () => {
    render(<StatsSection />);
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('renders the infinity symbol for milestones', () => {
    render(<StatsSection />);
    expect(screen.getByText('∞')).toBeInTheDocument();
  });

  it('starts the counter at 50 before animation begins', () => {
    vi.useFakeTimers();
    render(<StatsSection />);
    expect(screen.getByText('50')).toBeInTheDocument();
  });

  it('advances the counter past 100 after timers complete', () => {
    vi.useFakeTimers();
    render(<StatsSection />);
    act(() => {
      vi.runAllTimers();
    });
    expect(screen.queryByText('50')).not.toBeInTheDocument();
    expect(screen.getByText('∞')).toBeInTheDocument();
  });

  it('renders all three stat labels', () => {
    render(<StatsSection />);
    expect(screen.getByText('Goal types to set')).toBeInTheDocument();
    expect(screen.getByText('Sports tracked in one place')).toBeInTheDocument();
    expect(screen.getByText('Milestones to unlock')).toBeInTheDocument();
  });

  it('renders the section with id="stats"', () => {
    const { container } = render(<StatsSection />);
    expect(container.querySelector('#stats')).toBeInTheDocument();
  });
});
