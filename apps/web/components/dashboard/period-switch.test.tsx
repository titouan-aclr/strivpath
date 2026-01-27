import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PeriodSwitch, type PeriodOption } from './period-switch';

describe('PeriodSwitch', () => {
  const defaultOptions: PeriodOption[] = [
    { value: 'week', label: 'Week' },
    { value: 'month', label: 'Month' },
    { value: 'year', label: 'Year' },
  ];

  it('should render all options', () => {
    render(<PeriodSwitch options={defaultOptions} value="week" onChange={vi.fn()} />);

    expect(screen.getByRole('radio', { name: 'Week' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Month' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Year' })).toBeInTheDocument();
  });

  it('should mark selected option as checked', () => {
    render(<PeriodSwitch options={defaultOptions} value="month" onChange={vi.fn()} />);

    expect(screen.getByRole('radio', { name: 'Week' })).toHaveAttribute('aria-checked', 'false');
    expect(screen.getByRole('radio', { name: 'Month' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('radio', { name: 'Year' })).toHaveAttribute('aria-checked', 'false');
  });

  it('should call onChange with correct value when option is clicked', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<PeriodSwitch options={defaultOptions} value="week" onChange={handleChange} />);

    await user.click(screen.getByRole('radio', { name: 'Month' }));

    expect(handleChange).toHaveBeenCalledWith('month');
  });

  it('should have radiogroup role', () => {
    render(<PeriodSwitch options={defaultOptions} value="week" onChange={vi.fn()} />);

    expect(screen.getByRole('radiogroup')).toBeInTheDocument();
  });

  it('should disable all options when disabled prop is true', () => {
    render(<PeriodSwitch options={defaultOptions} value="week" onChange={vi.fn()} disabled />);

    const buttons = screen.getAllByRole('radio');
    buttons.forEach(button => {
      expect(button).toBeDisabled();
    });
  });

  it('should not call onChange when disabled', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<PeriodSwitch options={defaultOptions} value="week" onChange={handleChange} disabled />);

    await user.click(screen.getByRole('radio', { name: 'Month' }));

    expect(handleChange).not.toHaveBeenCalled();
  });

  it('should apply custom className', () => {
    const { container } = render(
      <PeriodSwitch options={defaultOptions} value="week" onChange={vi.fn()} className="custom-class" />,
    );

    expect(container.querySelector('.custom-class')).toBeInTheDocument();
  });

  it('should apply selected styles to active option', () => {
    render(<PeriodSwitch options={defaultOptions} value="month" onChange={vi.fn()} />);

    const selectedButton = screen.getByRole('radio', { name: 'Month' });
    expect(selectedButton).toHaveClass('bg-background');
  });

  it('should work with two options', () => {
    const twoOptions: PeriodOption[] = [
      { value: 'a', label: 'Option A' },
      { value: 'b', label: 'Option B' },
    ];
    render(<PeriodSwitch options={twoOptions} value="a" onChange={vi.fn()} />);

    expect(screen.getAllByRole('radio')).toHaveLength(2);
  });
});
