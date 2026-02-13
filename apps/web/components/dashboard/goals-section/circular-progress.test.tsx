import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CircularProgress } from './circular-progress';
import { GoalStatus } from '@/gql/graphql';
import type { SportColorConfig } from '@/lib/sports/config';

const rideSportColor: SportColorConfig = {
  bg: 'bg-purple-400',
  bgMuted: 'bg-purple-400/10',
  text: 'text-purple-500',
  textMuted: 'text-purple-500/10',
  border: 'border-purple-400',
  ring: 'ring-purple-400',
  chart: 'oklch(0.65 0.25 300)',
};

describe('CircularProgress', () => {
  it('should render percentage value', () => {
    render(<CircularProgress percentage={50} />);

    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('should render 0% for zero percentage', () => {
    render(<CircularProgress percentage={0} />);

    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  it('should render 100% for full completion', () => {
    render(<CircularProgress percentage={100} />);

    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('should cap percentage at 100', () => {
    render(<CircularProgress percentage={150} />);

    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('should not go below 0', () => {
    render(<CircularProgress percentage={-10} />);

    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  it('should round percentage to nearest integer', () => {
    render(<CircularProgress percentage={75.7} />);

    expect(screen.getByText('76%')).toBeInTheDocument();
  });

  it('should render SVG with default size', () => {
    const { container } = render(<CircularProgress percentage={50} />);

    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('width', '80');
    expect(svg).toHaveAttribute('height', '80');
  });

  it('should render SVG with custom size', () => {
    const { container } = render(<CircularProgress percentage={50} size={120} />);

    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('width', '120');
    expect(svg).toHaveAttribute('height', '120');
  });

  it('should render two circles for background and progress', () => {
    const { container } = render(<CircularProgress percentage={50} />);

    const circles = container.querySelectorAll('circle');
    expect(circles).toHaveLength(2);
  });

  it('should apply custom className', () => {
    const { container } = render(<CircularProgress percentage={50} className="custom-progress" />);

    expect(container.querySelector('.custom-progress')).toBeInTheDocument();
  });

  it('should have primary styling on progress circle by default (Active status)', () => {
    const { container } = render(<CircularProgress percentage={50} />);

    const progressCircle = container.querySelector('.text-primary');
    expect(progressCircle).toBeInTheDocument();
  });

  it('should have primary/10 styling on background circle by default (Active status)', () => {
    const { container } = render(<CircularProgress percentage={50} />);

    const backgroundCircle = container.querySelector('.text-primary\\/10');
    expect(backgroundCircle).toBeInTheDocument();
  });

  it('should have primary styling for Active status', () => {
    const { container } = render(<CircularProgress percentage={50} status={GoalStatus.Active} />);

    const progressCircle = container.querySelector('.text-primary');
    const backgroundCircle = container.querySelector('.text-primary\\/10');
    expect(progressCircle).toBeInTheDocument();
    expect(backgroundCircle).toBeInTheDocument();
  });

  it('should have green styling for Completed status', () => {
    const { container } = render(<CircularProgress percentage={100} status={GoalStatus.Completed} />);

    const progressCircle = container.querySelector('.text-green-500');
    const backgroundCircle = container.querySelector('.text-green-500\\/10');
    expect(progressCircle).toBeInTheDocument();
    expect(backgroundCircle).toBeInTheDocument();
  });

  it('should have destructive styling for Failed status', () => {
    const { container } = render(<CircularProgress percentage={30} status={GoalStatus.Failed} />);

    const progressCircle = container.querySelector('.text-destructive');
    const backgroundCircle = container.querySelector('.text-destructive\\/10');
    expect(progressCircle).toBeInTheDocument();
    expect(backgroundCircle).toBeInTheDocument();
  });

  it('should have muted styling for Archived status', () => {
    const { container } = render(<CircularProgress percentage={50} status={GoalStatus.Archived} />);

    const progressCircle = container.querySelector('.text-muted-foreground');
    const backgroundCircle = container.querySelector('.text-muted-foreground\\/10');
    expect(progressCircle).toBeInTheDocument();
    expect(backgroundCircle).toBeInTheDocument();
  });

  it('should use sport colors on circles when sportColor is provided', () => {
    const { container } = render(<CircularProgress percentage={50} sportColor={rideSportColor} />);

    const progressCircle = container.querySelector('.text-purple-500');
    const backgroundCircle = container.querySelector('.text-purple-500\\/10');
    expect(progressCircle).toBeInTheDocument();
    expect(backgroundCircle).toBeInTheDocument();
  });

  it('should use sport colors over status colors when sportColor is provided', () => {
    const { container } = render(
      <CircularProgress percentage={50} status={GoalStatus.Active} sportColor={rideSportColor} />,
    );

    const progressCircle = container.querySelector('.text-purple-500');
    const backgroundCircle = container.querySelector('.text-purple-500\\/10');
    expect(progressCircle).toBeInTheDocument();
    expect(backgroundCircle).toBeInTheDocument();
    expect(container.querySelector('.text-primary')).not.toBeInTheDocument();
  });
});
