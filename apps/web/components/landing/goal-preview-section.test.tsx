import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GoalPreviewSection } from './goal-preview-section';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const messages: Record<string, string> = {
      sectionLabel: 'Goal tracking',
      heading: 'Set it. Track it. Celebrate it.',
      subheading: 'Define your target and watch every Strava activity contribute to it.',
      bullet1: 'Distance, duration, elevation, or frequency',
      bullet2: 'Weekly, monthly, or yearly periods',
      bullet3: 'Automatic progress with every sync',
      goalTitle: 'Run 100 km this month',
      goalSport: '🏃 Running',
      goalProgress: '74 km of 100 km',
      goalDaysLeft: '8 days left',
      chartLabel: 'Weekly distance (km)',
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

vi.mock('@/components/ui/chart', () => ({
  ChartContainer: ({ children }: { children: React.ReactNode }) => <div data-testid="chart-container">{children}</div>,
  ChartTooltip: () => null,
  ChartTooltipContent: () => null,
}));

vi.mock('recharts', () => ({
  AreaChart: () => null,
  Area: () => null,
}));

describe('GoalPreviewSection', () => {
  it('renders the section label and heading', () => {
    render(<GoalPreviewSection />);
    expect(screen.getByText('Goal tracking')).toBeInTheDocument();
    expect(screen.getByText('Set it. Track it. Celebrate it.')).toBeInTheDocument();
  });

  it('renders the goal card content', () => {
    render(<GoalPreviewSection />);
    expect(screen.getByText('Run 100 km this month')).toBeInTheDocument();
    expect(screen.getByText('🏃 Running')).toBeInTheDocument();
    expect(screen.getByText('74 km of 100 km')).toBeInTheDocument();
    expect(screen.getByText('8 days left')).toBeInTheDocument();
  });

  it('renders the progress percentage', () => {
    render(<GoalPreviewSection />);
    expect(screen.getByText('74%')).toBeInTheDocument();
  });

  it('renders the chart with its label', () => {
    render(<GoalPreviewSection />);
    expect(screen.getByText('Weekly distance (km)')).toBeInTheDocument();
    expect(screen.getByTestId('chart-container')).toBeInTheDocument();
  });

  it('renders the section with id="goal-preview"', () => {
    const { container } = render(<GoalPreviewSection />);
    expect(container.querySelector('#goal-preview')).toBeInTheDocument();
  });
});
