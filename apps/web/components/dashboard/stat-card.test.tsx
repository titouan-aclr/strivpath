import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Clock, Timer } from 'lucide-react';
import { StatCard } from './stat-card';
import type { SportColorConfig } from '@/lib/sports/config';

const runSportColor: SportColorConfig = {
  bg: 'bg-lime-300',
  bgMuted: 'bg-lime-300/10',
  text: 'text-lime-500',
  textMuted: 'text-lime-500/10',
  border: 'border-lime-300',
  ring: 'ring-lime-300',
  chart: 'oklch(0.84 0.18 128)',
};

describe('StatCard', () => {
  it('should render label and value', () => {
    render(<StatCard label="Training Time" value="12h 30m" />);

    expect(screen.getByText('Training Time')).toBeInTheDocument();
    expect(screen.getByText('12h 30m')).toBeInTheDocument();
  });

  it('should render numeric value', () => {
    render(<StatCard label="Activities" value={42} />);

    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('should render icon when provided', () => {
    const { container } = render(<StatCard label="Duration" value="5h" icon={Clock} />);

    const iconContainer = container.querySelector('.bg-primary\\/10');
    expect(iconContainer).toBeInTheDocument();
    expect(container.querySelector('.text-primary')).toBeInTheDocument();
  });

  it('should not render icon container when no icon provided', () => {
    const { container } = render(<StatCard label="Count" value={10} />);

    const iconContainer = container.querySelector('.bg-primary\\/10');
    expect(iconContainer).not.toBeInTheDocument();
  });

  it('should render positive trend', () => {
    render(<StatCard label="Activities" value={15} trend={{ value: 25, isPositive: true }} />);

    expect(screen.getByText('+25%')).toBeInTheDocument();
    expect(screen.getByText('↑')).toBeInTheDocument();
  });

  it('should render negative trend', () => {
    render(<StatCard label="Activities" value={10} trend={{ value: 15, isPositive: false }} />);

    expect(screen.getByText('-15%')).toBeInTheDocument();
    expect(screen.getByText('↓')).toBeInTheDocument();
  });

  it('should apply positive trend color', () => {
    const { container } = render(<StatCard label="Test" value={1} trend={{ value: 10, isPositive: true }} />);

    const trendElement = container.querySelector('.text-green-600');
    expect(trendElement).toBeInTheDocument();
  });

  it('should apply negative trend color', () => {
    const { container } = render(<StatCard label="Test" value={1} trend={{ value: 10, isPositive: false }} />);

    const trendElement = container.querySelector('.text-red-600');
    expect(trendElement).toBeInTheDocument();
  });

  it('should not render trend when not provided', () => {
    render(<StatCard label="Simple" value="value" />);

    expect(screen.queryByText('↑')).not.toBeInTheDocument();
    expect(screen.queryByText('↓')).not.toBeInTheDocument();
    expect(screen.queryByText(/%/)).not.toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const { container } = render(<StatCard label="Test" value="value" className="custom-stat-class" />);

    expect(container.querySelector('.custom-stat-class')).toBeInTheDocument();
  });

  it('should render with all props', () => {
    const { container } = render(
      <StatCard
        label="Total Time"
        value="24h 15m"
        icon={Timer}
        trend={{ value: 12, isPositive: true }}
        className="full-stat"
      />,
    );

    expect(screen.getByText('Total Time')).toBeInTheDocument();
    expect(screen.getByText('24h 15m')).toBeInTheDocument();
    expect(screen.getByText('+12%')).toBeInTheDocument();
    expect(container.querySelector('.bg-primary\\/10')).toBeInTheDocument();
    expect(container.querySelector('.full-stat')).toBeInTheDocument();
  });

  it('should handle zero trend value', () => {
    render(<StatCard label="Test" value={5} trend={{ value: 0, isPositive: true }} />);

    expect(screen.getByText('+0%')).toBeInTheDocument();
  });

  it('should use sport colors for icon when sportColor is provided', () => {
    const { container } = render(<StatCard label="Distance" value="42km" icon={Clock} sportColor={runSportColor} />);

    expect(container.querySelector('.bg-lime-300\\/10')).toBeInTheDocument();
    expect(container.querySelector('.text-lime-500')).toBeInTheDocument();
    expect(container.querySelector('.bg-primary\\/10')).not.toBeInTheDocument();
  });

  it('should use primary when sportColor is not provided', () => {
    const { container } = render(<StatCard label="Distance" value="42km" icon={Clock} />);

    expect(container.querySelector('.bg-primary\\/10')).toBeInTheDocument();
    expect(container.querySelector('.text-primary')).toBeInTheDocument();
  });

  it('should render with sportColor and all other props', () => {
    const { container } = render(
      <StatCard
        label="Total Distance"
        value="150km"
        icon={Timer}
        trend={{ value: 10, isPositive: true }}
        className="sport-stat"
        sportColor={runSportColor}
      />,
    );

    expect(screen.getByText('Total Distance')).toBeInTheDocument();
    expect(screen.getByText('150km')).toBeInTheDocument();
    expect(screen.getByText('+10%')).toBeInTheDocument();
    expect(container.querySelector('.bg-lime-300\\/10')).toBeInTheDocument();
    expect(container.querySelector('.text-lime-500')).toBeInTheDocument();
    expect(container.querySelector('.sport-stat')).toBeInTheDocument();
  });
});
