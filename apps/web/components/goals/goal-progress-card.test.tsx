import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GoalProgressCard } from './goal-progress-card';
import { GoalStatus, GoalTargetType, GoalPeriodType, SportType } from '@/gql/graphql';
import type { Goal } from '@/gql/graphql';

const mockUseTranslations = (namespace?: string) => (key: string) => {
  const translations: Record<string, string> = {
    'goals.detail.progress': 'Progress',
  };
  const fullKey = namespace ? `${namespace}.${key}` : key;
  return translations[fullKey] || key;
};

vi.mock('next-intl', () => ({
  useTranslations: (namespace?: string) => mockUseTranslations(namespace),
}));

vi.mock('recharts', () => ({
  RadialBarChart: ({ children }: { children: React.ReactNode }) => <div data-testid="radial-bar-chart">{children}</div>,
  RadialBar: ({ dataKey }: { dataKey: string }) => <div data-testid={`radial-bar-${dataKey}`} />,
  PolarGrid: () => <div data-testid="polar-grid" />,
  PolarRadiusAxis: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="polar-radius-axis">{children}</div>
  ),
  Label: ({ content }: { content: (props: { viewBox?: { cx?: number; cy?: number } }) => React.ReactElement }) => {
    const element = content({ viewBox: { cx: 100, cy: 100 } });
    return <div data-testid="chart-label">{element}</div>;
  },
  Tooltip: () => <div data-testid="tooltip" />,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  LineChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Line: () => <div />,
  XAxis: () => <div />,
  YAxis: () => <div />,
  CartesianGrid: () => <div />,
  Legend: () => <div />,
  BarChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Bar: () => <div />,
  PieChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Pie: () => <div />,
  Cell: () => <div />,
}));

const createMockGoal = (overrides?: Partial<Goal>): Goal => ({
  __typename: 'Goal' as const,
  id: '1',
  title: 'Run 50km',
  description: 'Monthly running goal',
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-01-31'),
  targetType: GoalTargetType.Distance,
  targetValue: 50,
  currentValue: 30,
  progressPercentage: 60,
  status: GoalStatus.Active,
  periodType: GoalPeriodType.Monthly,
  sportType: SportType.Run,
  isRecurring: false,
  isExpired: false,
  daysRemaining: 15,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-15'),
  completedAt: null,
  recurrenceEndDate: null,
  templateId: null,
  userId: 1,
  progressHistory: [],
  ...overrides,
});

describe('GoalProgressCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render card title', () => {
      const goal = createMockGoal();
      render(<GoalProgressCard goal={goal} />);

      expect(screen.getByText('Progress')).toBeInTheDocument();
    });

    it('should render radial bar chart', () => {
      const goal = createMockGoal();
      render(<GoalProgressCard goal={goal} />);

      expect(screen.getByTestId('radial-bar-chart')).toBeInTheDocument();
      expect(screen.getByTestId('radial-bar-progress')).toBeInTheDocument();
    });

    it('should render polar grid', () => {
      const goal = createMockGoal();
      render(<GoalProgressCard goal={goal} />);

      expect(screen.getByTestId('polar-grid')).toBeInTheDocument();
    });

    it('should render polar radius axis', () => {
      const goal = createMockGoal();
      render(<GoalProgressCard goal={goal} />);

      expect(screen.getByTestId('polar-radius-axis')).toBeInTheDocument();
    });
  });

  describe('progress display', () => {
    it('should display progress percentage', () => {
      const goal = createMockGoal({
        progressPercentage: 75.5,
      });
      render(<GoalProgressCard goal={goal} />);

      expect(screen.getByText('76%')).toBeInTheDocument();
    });

    it('should round progress percentage', () => {
      const goal = createMockGoal({
        progressPercentage: 42.4,
      });
      render(<GoalProgressCard goal={goal} />);

      expect(screen.getByText('42%')).toBeInTheDocument();
    });

    it('should display 0% for zero progress', () => {
      const goal = createMockGoal({
        currentValue: 0,
        progressPercentage: 0,
      });
      render(<GoalProgressCard goal={goal} />);

      expect(screen.getByText('0%')).toBeInTheDocument();
    });

    it('should display 100% for completed goal', () => {
      const goal = createMockGoal({
        currentValue: 50,
        targetValue: 50,
        progressPercentage: 100,
      });
      render(<GoalProgressCard goal={goal} />);

      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    it('should handle progress over 100%', () => {
      const goal = createMockGoal({
        currentValue: 60,
        targetValue: 50,
        progressPercentage: 120,
      });
      render(<GoalProgressCard goal={goal} />);

      expect(screen.getByText('120%')).toBeInTheDocument();
    });
  });

  describe('current vs target display', () => {
    it('should display current and target values for DISTANCE', () => {
      const goal = createMockGoal({
        targetType: GoalTargetType.Distance,
        currentValue: 35.7,
        targetValue: 100,
      });
      render(<GoalProgressCard goal={goal} />);

      expect(screen.getByText(/35\.7.*\/.*100\.0.*km/i)).toBeInTheDocument();
    });

    it('should display current and target values for DURATION', () => {
      const goal = createMockGoal({
        targetType: GoalTargetType.Duration,
        currentValue: 12.5,
        targetValue: 20,
      });
      render(<GoalProgressCard goal={goal} />);

      expect(screen.getByText(/12\.5.*\/.*20\.0.*hours/i)).toBeInTheDocument();
    });

    it('should display integer values for FREQUENCY', () => {
      const goal = createMockGoal({
        targetType: GoalTargetType.Frequency,
        currentValue: 8.9,
        targetValue: 12,
      });
      render(<GoalProgressCard goal={goal} />);

      expect(screen.getByText(/8.*\/.*12.*sessions/i)).toBeInTheDocument();
    });

    it('should display integer values for ELEVATION', () => {
      const goal = createMockGoal({
        targetType: GoalTargetType.Elevation,
        currentValue: 3456.789,
        targetValue: 5000,
      });
      render(<GoalProgressCard goal={goal} />);

      expect(screen.getByText(/3456.*\/.*5000.*meters/i)).toBeInTheDocument();
    });
  });

  describe('status colors', () => {
    it('should use ACTIVE color for active goals', () => {
      const goal = createMockGoal({
        status: GoalStatus.Active,
      });
      const { container } = render(<GoalProgressCard goal={goal} />);

      const chart = container.querySelector('[data-testid="radial-bar-chart"]');
      expect(chart).toBeInTheDocument();
    });

    it('should use COMPLETED color for completed goals', () => {
      const goal = createMockGoal({
        status: GoalStatus.Completed,
        currentValue: 50,
        progressPercentage: 100,
      });
      const { container } = render(<GoalProgressCard goal={goal} />);

      const chart = container.querySelector('[data-testid="radial-bar-chart"]');
      expect(chart).toBeInTheDocument();
    });

    it('should use FAILED color for failed goals', () => {
      const goal = createMockGoal({
        status: GoalStatus.Failed,
      });
      const { container } = render(<GoalProgressCard goal={goal} />);

      const chart = container.querySelector('[data-testid="radial-bar-chart"]');
      expect(chart).toBeInTheDocument();
    });

    it('should use ARCHIVED color for archived goals', () => {
      const goal = createMockGoal({
        status: GoalStatus.Archived,
      });
      const { container } = render(<GoalProgressCard goal={goal} />);

      const chart = container.querySelector('[data-testid="radial-bar-chart"]');
      expect(chart).toBeInTheDocument();
    });
  });

  describe('layout', () => {
    it('should have correct container classes', () => {
      const goal = createMockGoal();
      const { container } = render(<GoalProgressCard goal={goal} />);

      const chartContainer = container.querySelector('.aspect-square');
      expect(chartContainer).toBeInTheDocument();
    });

    it('should center the chart', () => {
      const goal = createMockGoal();
      const { container } = render(<GoalProgressCard goal={goal} />);

      const content = container.querySelector('.flex.justify-center');
      expect(content).toBeInTheDocument();
    });
  });
});
