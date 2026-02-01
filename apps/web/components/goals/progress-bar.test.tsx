import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProgressBar } from './progress-bar';
import { GoalStatus } from '@/gql/graphql';

const mockUseTranslations = () => (key: string, values?: Record<string, string | number | undefined>) => {
  if (key === 'progress.label') {
    return `${values?.current} of ${values?.target} ${values?.unit}`;
  }
  return key;
};

vi.mock('next-intl', () => ({
  useTranslations: () => mockUseTranslations(),
}));

describe('ProgressBar', () => {
  it('renders progress correctly', () => {
    render(<ProgressBar current={35.5} target={50} unit="km" status={GoalStatus.Active} percentage={71} />);

    expect(screen.getByText(/35\.5.*\/.*50\.0/)).toBeInTheDocument();
    expect(screen.getByText('71.0%')).toBeInTheDocument();
  });

  it('applies correct color for active status', () => {
    const { container } = render(
      <ProgressBar current={35.5} target={50} unit="km" status={GoalStatus.Active} percentage={71} />,
    );

    const progressBar = container.querySelector('[role="progressbar"]');
    expect(progressBar).toHaveClass('bg-strava-orange');
  });

  it('applies correct color for completed status', () => {
    const { container } = render(
      <ProgressBar current={50} target={50} unit="km" status={GoalStatus.Completed} percentage={100} />,
    );

    const progressBar = container.querySelector('[role="progressbar"]');
    expect(progressBar).toHaveClass('bg-green-500');
  });

  it('applies correct color for failed status', () => {
    const { container } = render(
      <ProgressBar current={20} target={50} unit="km" status={GoalStatus.Failed} percentage={40} />,
    );

    const progressBar = container.querySelector('[role="progressbar"]');
    expect(progressBar).toHaveClass('bg-destructive');
  });

  it('limits display to 100% even if over-achieved', () => {
    const { container } = render(
      <ProgressBar current={60} target={50} unit="km" status={GoalStatus.Completed} percentage={120} />,
    );

    const progressBar = container.querySelector('[role="progressbar"]');
    expect(progressBar).toHaveStyle({ width: '100%' });
  });

  it('formats km and hours values with one decimal', () => {
    render(<ProgressBar current={35.567} target={50.234} unit="km" status={GoalStatus.Active} percentage={71} />);

    expect(screen.getByText(/35\.6.*\/.*50\.2/)).toBeInTheDocument();
  });

  it('formats integer values without decimals', () => {
    render(<ProgressBar current={25} target={50} unit="sessions" status={GoalStatus.Active} percentage={50} />);

    expect(screen.getByText(/25.*\/.*50/)).toBeInTheDocument();
  });

  it('has proper ARIA attributes', () => {
    render(<ProgressBar current={35.5} target={50} unit="km" status={GoalStatus.Active} percentage={71} />);

    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '35.5');
    expect(progressBar).toHaveAttribute('aria-valuemin', '0');
    expect(progressBar).toHaveAttribute('aria-valuemax', '50');
    expect(progressBar).toHaveAttribute('aria-label');
  });

  it('displays 0% correctly', () => {
    render(<ProgressBar current={0} target={50} unit="km" status={GoalStatus.Active} percentage={0} />);

    expect(screen.getByText('0.0%')).toBeInTheDocument();
  });

  it('displays 100% correctly', () => {
    render(<ProgressBar current={50} target={50} unit="km" status={GoalStatus.Completed} percentage={100} />);

    expect(screen.getByText('100.0%')).toBeInTheDocument();
  });
});
