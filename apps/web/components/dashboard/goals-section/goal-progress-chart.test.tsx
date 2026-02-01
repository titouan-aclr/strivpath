import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { GoalProgressChart } from './goal-progress-chart';
import { GoalStatus } from '@/gql/graphql';

vi.mock('next-intl', () => ({
  useLocale: () => 'en',
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      progress: 'Progress',
      target: 'Target',
    };
    return translations[key] || key;
  },
}));

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  AreaChart: ({ children, data }: { children: React.ReactNode; data: unknown[] }) => (
    <div data-testid="area-chart" data-points={data.length}>
      {children}
    </div>
  ),
  Area: ({ stroke, fill }: { stroke: string; fill: string }) => (
    <div data-testid="area" data-stroke={stroke} data-fill={fill} />
  ),
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  ReferenceLine: ({ y, label }: { y: number; label: { value: string } }) => (
    <div data-testid="reference-line" data-y={y} data-label={label.value} />
  ),
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
}));

describe('GoalProgressChart', () => {
  const defaultProps = {
    progressHistory: [
      { date: new Date('2024-01-01'), value: 10 },
      { date: new Date('2024-01-05'), value: 25 },
      { date: new Date('2024-01-10'), value: 40 },
    ],
    targetValue: 100,
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-01-31'),
    unit: 'km',
  };

  it('should render chart container', () => {
    const { container } = render(<GoalProgressChart {...defaultProps} />);

    expect(container.querySelector('[data-chart]')).toBeInTheDocument();
  });

  it('should render area chart', () => {
    const { getByTestId } = render(<GoalProgressChart {...defaultProps} />);

    expect(getByTestId('area-chart')).toBeInTheDocument();
  });

  it('should render reference line with target value', () => {
    const { getByTestId } = render(<GoalProgressChart {...defaultProps} />);

    const referenceLine = getByTestId('reference-line');
    expect(referenceLine).toHaveAttribute('data-y', '100');
    expect(referenceLine).toHaveAttribute('data-label', '100');
  });

  it('should render cartesian grid', () => {
    const { getByTestId } = render(<GoalProgressChart {...defaultProps} />);

    expect(getByTestId('cartesian-grid')).toBeInTheDocument();
  });

  it('should render x and y axes', () => {
    const { getByTestId } = render(<GoalProgressChart {...defaultProps} />);

    expect(getByTestId('x-axis')).toBeInTheDocument();
    expect(getByTestId('y-axis')).toBeInTheDocument();
  });

  it('should render area for progress data', () => {
    const { getByTestId } = render(<GoalProgressChart {...defaultProps} />);

    expect(getByTestId('area')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const { container } = render(<GoalProgressChart {...defaultProps} className="custom-chart-class" />);

    expect(container.querySelector('.custom-chart-class')).toBeInTheDocument();
  });

  it('should handle empty progress history', () => {
    const { getByTestId } = render(<GoalProgressChart {...defaultProps} progressHistory={[]} />);

    expect(getByTestId('area-chart')).toBeInTheDocument();
  });

  it('should handle string dates', () => {
    const { getByTestId } = render(
      <GoalProgressChart
        {...defaultProps}
        startDate="2024-01-01"
        endDate="2024-01-31"
        progressHistory={[{ date: new Date('2024-01-05'), value: 25 }]}
      />,
    );

    expect(getByTestId('area-chart')).toBeInTheDocument();
  });

  it('should format target value for hours unit', () => {
    const { getByTestId } = render(<GoalProgressChart {...defaultProps} unit="hours" targetValue={10} />);

    const referenceLine = getByTestId('reference-line');
    expect(referenceLine).toHaveAttribute('data-label', '10h');
  });

  it('should format target value for meters unit', () => {
    const { getByTestId } = render(<GoalProgressChart {...defaultProps} unit="meters" targetValue={500} />);

    const referenceLine = getByTestId('reference-line');
    expect(referenceLine).toHaveAttribute('data-label', '500');
  });

  it('should use strava-orange color by default (Active status)', () => {
    const { getByTestId } = render(<GoalProgressChart {...defaultProps} />);

    const area = getByTestId('area');
    expect(area).toHaveAttribute('data-stroke', '#fc4c02');
  });

  it('should use strava-orange color for Active status', () => {
    const { getByTestId } = render(<GoalProgressChart {...defaultProps} status={GoalStatus.Active} />);

    const area = getByTestId('area');
    expect(area).toHaveAttribute('data-stroke', '#fc4c02');
  });

  it('should use green color for Completed status', () => {
    const { getByTestId } = render(<GoalProgressChart {...defaultProps} status={GoalStatus.Completed} />);

    const area = getByTestId('area');
    expect(area).toHaveAttribute('data-stroke', '#22c55e');
  });

  it('should use red color for Failed status', () => {
    const { getByTestId } = render(<GoalProgressChart {...defaultProps} status={GoalStatus.Failed} />);

    const area = getByTestId('area');
    expect(area).toHaveAttribute('data-stroke', '#ef4444');
  });

  it('should use muted color for Archived status', () => {
    const { getByTestId } = render(<GoalProgressChart {...defaultProps} status={GoalStatus.Archived} />);

    const area = getByTestId('area');
    expect(area).toHaveAttribute('data-stroke', '#64748b');
  });
});
