import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProgressStatusBadge } from './progress-status-badge';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      ahead: 'Ahead',
      behind: 'Behind',
      onTrack: 'On Track',
    };
    return translations[key] || key;
  },
}));

describe('ProgressStatusBadge', () => {
  it('should render ahead status with correct text', () => {
    render(<ProgressStatusBadge status="ahead" />);

    expect(screen.getByText('Ahead')).toBeInTheDocument();
  });

  it('should render behind status with correct text', () => {
    render(<ProgressStatusBadge status="behind" />);

    expect(screen.getByText('Behind')).toBeInTheDocument();
  });

  it('should render onTrack status with correct text', () => {
    render(<ProgressStatusBadge status="onTrack" />);

    expect(screen.getByText('On Track')).toBeInTheDocument();
  });

  it('should apply green styling for ahead status', () => {
    render(<ProgressStatusBadge status="ahead" />);

    const badge = screen.getByText('Ahead');
    expect(badge).toHaveClass('bg-green-100');
    expect(badge).toHaveClass('text-green-700');
  });

  it('should apply red styling for behind status', () => {
    render(<ProgressStatusBadge status="behind" />);

    const badge = screen.getByText('Behind');
    expect(badge).toHaveClass('bg-red-100');
    expect(badge).toHaveClass('text-red-700');
  });

  it('should apply goal-progress styling for onTrack status', () => {
    render(<ProgressStatusBadge status="onTrack" />);

    const badge = screen.getByText('On Track');
    expect(badge).toHaveClass('bg-goal-progress/10');
    expect(badge).toHaveClass('text-goal-progress');
  });

  it('should render default size by default', () => {
    render(<ProgressStatusBadge status="ahead" />);

    const badge = screen.getByText('Ahead');
    expect(badge).toHaveClass('text-xs');
  });

  it('should render small size when specified', () => {
    render(<ProgressStatusBadge status="ahead" size="sm" />);

    const badge = screen.getByText('Ahead');
    expect(badge).toHaveClass('text-[10px]');
    expect(badge).toHaveClass('h-5');
  });

  it('should apply custom className', () => {
    render(<ProgressStatusBadge status="ahead" className="custom-badge" />);

    const badge = screen.getByText('Ahead');
    expect(badge).toHaveClass('custom-badge');
  });

  it('should have no border', () => {
    render(<ProgressStatusBadge status="ahead" />);

    const badge = screen.getByText('Ahead');
    expect(badge).toHaveClass('border-0');
  });

  it('should have shrink-0 class for flex layout', () => {
    render(<ProgressStatusBadge status="ahead" />);

    const badge = screen.getByText('Ahead');
    expect(badge).toHaveClass('shrink-0');
  });
});
