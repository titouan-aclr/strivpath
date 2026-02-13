import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Route } from 'lucide-react';
import { StatCard } from './stat-card';

describe('StatCard', () => {
  it('should render label and value', () => {
    render(<StatCard label="Distance" value="10.5 km" />);

    expect(screen.getByText('Distance')).toBeInTheDocument();
    expect(screen.getByText('10.5 km')).toBeInTheDocument();
  });

  it('should render icon when provided', () => {
    const { container } = render(<StatCard label="Distance" value="10.5 km" icon={Route} />);

    const iconContainer = container.querySelector('.icon-container-sm');
    expect(iconContainer).toBeInTheDocument();
  });

  it('should not render icon when not provided', () => {
    const { container } = render(<StatCard label="Distance" value="10.5 km" />);

    const iconContainer = container.querySelector('.icon-container-sm');
    expect(iconContainer).not.toBeInTheDocument();
  });

  it('should render subValue when provided', () => {
    render(<StatCard label="Duration" value="45m 30s" subValue="Elapsed: 50m" />);

    expect(screen.getByText('Duration')).toBeInTheDocument();
    expect(screen.getByText('45m 30s')).toBeInTheDocument();
    expect(screen.getByText('Elapsed: 50m')).toBeInTheDocument();
  });

  it('should not render subValue when not provided', () => {
    render(<StatCard label="Duration" value="45m 30s" />);

    expect(screen.getByText('Duration')).toBeInTheDocument();
    expect(screen.getByText('45m 30s')).toBeInTheDocument();
    expect(screen.queryByText(/Elapsed/)).not.toBeInTheDocument();
  });

  it('should apply highlight class when highlight is true', () => {
    const { container } = render(<StatCard label="Distance" value="10.5 km" highlight />);

    const card = container.querySelector('.border-primary\\/50');
    expect(card).toBeInTheDocument();
  });

  it('should not apply highlight class when highlight is false', () => {
    const { container } = render(<StatCard label="Distance" value="10.5 km" highlight={false} />);

    const card = container.querySelector('.border-primary\\/50');
    expect(card).not.toBeInTheDocument();
  });

  it('should render numeric value', () => {
    render(<StatCard label="Count" value={42} />);

    expect(screen.getByText('Count')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('should render with all props', () => {
    render(<StatCard label="Distance" value="10.5 km" icon={Route} subValue="Max: 15 km" highlight />);

    expect(screen.getByText('Distance')).toBeInTheDocument();
    expect(screen.getByText('10.5 km')).toBeInTheDocument();
    expect(screen.getByText('Max: 15 km')).toBeInTheDocument();
  });
});
