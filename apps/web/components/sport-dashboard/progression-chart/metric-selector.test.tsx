import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MetricSelector } from './metric-selector';
import { ProgressionMetric, SportType } from '@/gql/graphql';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      distance: 'Distance',
      duration: 'Duration',
      pace: 'Pace',
      speed: 'Speed',
      sessions: 'Sessions',
      elevation: 'Elevation',
    };
    return translations[key] || key;
  },
}));

const runMetrics = [
  ProgressionMetric.Distance,
  ProgressionMetric.Duration,
  ProgressionMetric.Pace,
  ProgressionMetric.Sessions,
  ProgressionMetric.Elevation,
];

describe('MetricSelector', () => {
  const mockOnMetricChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render correct number of radio buttons', () => {
    render(
      <MetricSelector
        metrics={runMetrics}
        activeMetric={ProgressionMetric.Distance}
        onMetricChange={mockOnMetricChange}
        sportType={SportType.Run}
      />,
    );

    const radios = screen.getAllByRole('radio');
    expect(radios).toHaveLength(5);
  });

  it('should mark active metric with aria-checked true', () => {
    render(
      <MetricSelector
        metrics={runMetrics}
        activeMetric={ProgressionMetric.Duration}
        onMetricChange={mockOnMetricChange}
        sportType={SportType.Run}
      />,
    );

    expect(screen.getByRole('radio', { name: 'Duration' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('radio', { name: 'Distance' })).toHaveAttribute('aria-checked', 'false');
  });

  it('should call onMetricChange when a button is clicked', async () => {
    const user = userEvent.setup();

    render(
      <MetricSelector
        metrics={runMetrics}
        activeMetric={ProgressionMetric.Distance}
        onMetricChange={mockOnMetricChange}
        sportType={SportType.Run}
      />,
    );

    await user.click(screen.getByRole('radio', { name: 'Pace' }));

    expect(mockOnMetricChange).toHaveBeenCalledWith(ProgressionMetric.Pace);
  });

  it('should apply sport color classes on active button for Run', () => {
    const { container } = render(
      <MetricSelector
        metrics={runMetrics}
        activeMetric={ProgressionMetric.Distance}
        onMetricChange={mockOnMetricChange}
        sportType={SportType.Run}
      />,
    );

    expect(container.querySelector('.bg-lime-300\\/10')).toBeInTheDocument();
    expect(container.querySelector('.text-lime-500')).toBeInTheDocument();
  });

  it('should apply sport color classes on active button for Ride', () => {
    const { container } = render(
      <MetricSelector
        metrics={[ProgressionMetric.Distance, ProgressionMetric.Speed]}
        activeMetric={ProgressionMetric.Distance}
        onMetricChange={mockOnMetricChange}
        sportType={SportType.Ride}
      />,
    );

    expect(container.querySelector('.bg-purple-400\\/10')).toBeInTheDocument();
    expect(container.querySelector('.text-purple-500')).toBeInTheDocument();
  });

  it('should have radiogroup role', () => {
    render(
      <MetricSelector
        metrics={runMetrics}
        activeMetric={ProgressionMetric.Distance}
        onMetricChange={mockOnMetricChange}
        sportType={SportType.Run}
      />,
    );

    expect(screen.getByRole('radiogroup')).toBeInTheDocument();
  });

  it('should disable interactions when disabled', async () => {
    const user = userEvent.setup();

    render(
      <MetricSelector
        metrics={runMetrics}
        activeMetric={ProgressionMetric.Distance}
        onMetricChange={mockOnMetricChange}
        sportType={SportType.Run}
        disabled
      />,
    );

    const button = screen.getByRole('radio', { name: 'Pace' });
    expect(button).toBeDisabled();

    await user.click(button);

    expect(mockOnMetricChange).not.toHaveBeenCalled();
  });
});
