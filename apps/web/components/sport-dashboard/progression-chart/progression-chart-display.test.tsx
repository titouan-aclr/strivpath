import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { ProgressionChartDisplay } from './progression-chart-display';
import { IntervalType, ProgressionMetric, SportType } from '@/gql/graphql';
import type { ProgressionDataPoint } from '@/gql/graphql';

vi.mock('next-intl', () => ({
  useLocale: () => 'en',
}));

vi.mock('recharts', () => {
  const MockBarChart = ({ children, data, ...props }: Record<string, unknown>) => (
    <div data-testid="bar-chart" data-points={Array.isArray(data) ? data.length : 0} {...props}>
      {children as React.ReactNode}
    </div>
  );
  const MockBar = (props: Record<string, unknown>) => <div data-testid="bar" data-fill={props.fill as string} />;
  const MockXAxis = (props: Record<string, unknown>) => (
    <div
      data-testid="x-axis"
      data-datakey={props.dataKey as string}
      data-interval={props.interval as string | undefined}
    />
  );
  const MockYAxis = () => <div data-testid="y-axis" />;
  const MockCartesianGrid = () => <div data-testid="cartesian-grid" />;

  return {
    BarChart: MockBarChart,
    Bar: MockBar,
    XAxis: MockXAxis,
    YAxis: MockYAxis,
    CartesianGrid: MockCartesianGrid,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  };
});

vi.mock('@/components/ui/chart', () => ({
  ChartContainer: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => (
    <div data-testid="chart-container" {...props}>
      {typeof children === 'function' ? null : children}
    </div>
  ),
  ChartTooltip: () => <div data-testid="chart-tooltip" />,
  ChartTooltipContent: () => <div data-testid="chart-tooltip-content" />,
}));

const weeklyData: ProgressionDataPoint[] = Array.from({ length: 52 }, (_, i) => ({
  __typename: 'ProgressionDataPoint' as const,
  index: i + 1,
  intervalType: IntervalType.Week,
  value: 15000 + i * 500,
}));

const monthlyData: ProgressionDataPoint[] = Array.from({ length: 12 }, (_, i) => ({
  __typename: 'ProgressionDataPoint' as const,
  index: i,
  intervalType: IntervalType.Month,
  value: 90000 + i * 5000,
}));

describe('ProgressionChartDisplay', () => {
  it('should always render BarChart', () => {
    const { getByTestId } = render(
      <ProgressionChartDisplay data={weeklyData} metric={ProgressionMetric.Distance} sportType={SportType.Run} />,
    );

    expect(getByTestId('bar-chart')).toBeInTheDocument();
  });

  it('should pass correct number of data points for weekly data', () => {
    const { getByTestId } = render(
      <ProgressionChartDisplay data={weeklyData} metric={ProgressionMetric.Distance} sportType={SportType.Run} />,
    );

    expect(getByTestId('bar-chart')).toHaveAttribute('data-points', '52');
  });

  it('should pass correct number of data points for monthly data', () => {
    const { getByTestId } = render(
      <ProgressionChartDisplay data={monthlyData} metric={ProgressionMetric.Distance} sportType={SportType.Run} />,
    );

    expect(getByTestId('bar-chart')).toHaveAttribute('data-points', '12');
  });

  it('should use preserveStartEnd interval for weekly data', () => {
    const { getByTestId } = render(
      <ProgressionChartDisplay data={weeklyData} metric={ProgressionMetric.Distance} sportType={SportType.Run} />,
    );

    expect(getByTestId('x-axis')).toHaveAttribute('data-interval', 'preserveStartEnd');
  });

  it('should not set interval for monthly data', () => {
    const { getByTestId } = render(
      <ProgressionChartDisplay data={monthlyData} metric={ProgressionMetric.Distance} sportType={SportType.Run} />,
    );

    expect(getByTestId('x-axis')).not.toHaveAttribute('data-interval', 'preserveStartEnd');
  });

  it('should use Run sport color (lime)', () => {
    const { getByTestId } = render(
      <ProgressionChartDisplay data={weeklyData} metric={ProgressionMetric.Distance} sportType={SportType.Run} />,
    );

    expect(getByTestId('bar')).toHaveAttribute('data-fill', 'oklch(0.84 0.18 128)');
  });

  it('should use Ride sport color (purple)', () => {
    const { getByTestId } = render(
      <ProgressionChartDisplay data={monthlyData} metric={ProgressionMetric.Distance} sportType={SportType.Ride} />,
    );

    expect(getByTestId('bar')).toHaveAttribute('data-fill', 'oklch(0.65 0.25 300)');
  });
});
