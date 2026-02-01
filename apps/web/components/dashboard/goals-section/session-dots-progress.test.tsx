import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SessionDotsProgress } from './session-dots-progress';
import { GoalStatus } from '@/gql/graphql';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string, values?: Record<string, number>) => {
    const translations: Record<string, string> = {
      completed: 'Completed!',
      oneMore: 'One more to go!',
      remaining: `${values?.count} remaining`,
    };
    return translations[key] || key;
  },
}));

describe('SessionDotsProgress', () => {
  it('should render correct number of dots', () => {
    const { container } = render(<SessionDotsProgress current={3} target={5} />);

    const dots = container.querySelectorAll('.rounded-full.w-3.h-3');
    expect(dots).toHaveLength(5);
  });

  it('should fill dots based on current progress', () => {
    const { container } = render(<SessionDotsProgress current={3} target={5} />);

    const filledDots = container.querySelectorAll('.bg-strava-orange:not(.bg-strava-orange\\/10)');
    const emptyDots = container.querySelectorAll('.bg-strava-orange\\/10');

    expect(filledDots).toHaveLength(3);
    expect(emptyDots).toHaveLength(2);
  });

  it('should show remaining message when multiple sessions left', () => {
    render(<SessionDotsProgress current={2} target={5} />);

    expect(screen.getByText('3 remaining')).toBeInTheDocument();
  });

  it('should show one more message when one session left', () => {
    render(<SessionDotsProgress current={4} target={5} />);

    expect(screen.getByText('One more to go!')).toBeInTheDocument();
  });

  it('should show completed message when goal reached', () => {
    render(<SessionDotsProgress current={5} target={5} />);

    expect(screen.getByText('Completed!')).toBeInTheDocument();
  });

  it('should handle current exceeding target', () => {
    const { container } = render(<SessionDotsProgress current={7} target={5} />);

    const filledDots = container.querySelectorAll('.bg-strava-orange:not(.bg-strava-orange\\/10)');
    expect(filledDots).toHaveLength(5);
    expect(screen.getByText('Completed!')).toBeInTheDocument();
  });

  it('should handle zero current', () => {
    const { container } = render(<SessionDotsProgress current={0} target={5} />);

    const filledDots = container.querySelectorAll('.bg-strava-orange:not(.bg-strava-orange\\/10)');
    const emptyDots = container.querySelectorAll('.bg-strava-orange\\/10');

    expect(filledDots).toHaveLength(0);
    expect(emptyDots).toHaveLength(5);
    expect(screen.getByText('5 remaining')).toBeInTheDocument();
  });

  it('should have accessible role on dot container', () => {
    render(<SessionDotsProgress current={3} target={5} />);

    const dotContainer = screen.getByRole('img');
    expect(dotContainer).toHaveAttribute('aria-label', '3 of 5 sessions');
  });

  it('should apply custom className', () => {
    const { container } = render(<SessionDotsProgress current={2} target={5} className="custom-dots-class" />);

    expect(container.querySelector('.custom-dots-class')).toBeInTheDocument();
  });

  it('should use strava-orange colors by default (Active status)', () => {
    const { container } = render(<SessionDotsProgress current={3} target={5} />);

    const filledDots = container.querySelectorAll('.bg-strava-orange:not(.bg-strava-orange\\/10)');
    const emptyDots = container.querySelectorAll('.bg-strava-orange\\/10');

    expect(filledDots).toHaveLength(3);
    expect(emptyDots).toHaveLength(2);
  });

  it('should use strava-orange colors for Active status', () => {
    const { container } = render(<SessionDotsProgress current={3} target={5} status={GoalStatus.Active} />);

    const filledDots = container.querySelectorAll('.bg-strava-orange:not(.bg-strava-orange\\/10)');
    const emptyDots = container.querySelectorAll('.bg-strava-orange\\/10');

    expect(filledDots).toHaveLength(3);
    expect(emptyDots).toHaveLength(2);
  });

  it('should use green colors for Completed status', () => {
    const { container } = render(<SessionDotsProgress current={5} target={5} status={GoalStatus.Completed} />);

    const filledDots = container.querySelectorAll('.bg-green-500:not(.bg-green-500\\/10)');
    expect(filledDots).toHaveLength(5);
  });

  it('should use destructive colors for Failed status', () => {
    const { container } = render(<SessionDotsProgress current={2} target={5} status={GoalStatus.Failed} />);

    const filledDots = container.querySelectorAll('.bg-destructive:not(.bg-destructive\\/10)');
    const emptyDots = container.querySelectorAll('.bg-destructive\\/10');

    expect(filledDots).toHaveLength(2);
    expect(emptyDots).toHaveLength(3);
  });

  it('should use muted colors for Archived status', () => {
    const { container } = render(<SessionDotsProgress current={3} target={5} status={GoalStatus.Archived} />);

    const filledDots = container.querySelectorAll('.bg-muted-foreground:not(.bg-muted-foreground\\/10)');
    const emptyDots = container.querySelectorAll('.bg-muted-foreground\\/10');

    expect(filledDots).toHaveLength(3);
    expect(emptyDots).toHaveLength(2);
  });
});
