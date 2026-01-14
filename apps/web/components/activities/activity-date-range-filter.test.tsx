import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import { ActivityDateRangeFilter } from './activity-date-range-filter';

const messages = {
  activities: {
    filters: {
      dateRange: {
        quickSelect: 'Quick Select',
        customRange: 'Custom Range',
        apply: 'Apply',
        cancel: 'Cancel',
        last7Days: 'Last 7 days',
        last30Days: 'Last 30 days',
        last90Days: 'Last 90 days',
        thisYear: 'This year',
        allTime: 'All time',
      },
    },
  },
};

const renderWithIntl = (component: React.ReactElement) => {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      {component}
    </NextIntlClientProvider>,
  );
};

describe('ActivityDateRangeFilter', () => {
  describe('Rendering', () => {
    it('should render button with "All time" label when no dates selected', () => {
      const onChange = vi.fn();
      renderWithIntl(<ActivityDateRangeFilter onChange={onChange} />);

      expect(screen.getByRole('button', { name: /All time/i })).toBeInTheDocument();
    });

    it('should render button with preset label when dates match a preset', () => {
      const onChange = vi.fn();
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 7);

      renderWithIntl(<ActivityDateRangeFilter startDate={start} endDate={end} onChange={onChange} />);

      expect(screen.getByRole('button', { name: /Last 7 days/i })).toBeInTheDocument();
    });

    it('should render button with custom range label when dates do not match presets', () => {
      const onChange = vi.fn();
      const start = new Date('2024-01-01');
      const end = new Date('2024-01-15');

      renderWithIntl(<ActivityDateRangeFilter startDate={start} endDate={end} onChange={onChange} />);

      const button = screen.getByRole('button');
      expect(button.textContent).toContain('1/1/24');
      expect(button.textContent).toContain('1/15/24');
    });

    it('should render calendar icon', () => {
      const onChange = vi.fn();
      const { container } = renderWithIntl(<ActivityDateRangeFilter onChange={onChange} />);

      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('Popover', () => {
    it('should open popover when button is clicked', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();

      renderWithIntl(<ActivityDateRangeFilter onChange={onChange} />);

      const button = screen.getByRole('button', { name: /All time/i });
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByText('Quick Select')).toBeInTheDocument();
      });
    });

    it('should close popover when cancel button is clicked', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();

      renderWithIntl(<ActivityDateRangeFilter onChange={onChange} />);

      const button = screen.getByRole('button', { name: /All time/i });
      await user.click(button);

      await waitFor(
        () => {
          expect(screen.getByText('Quick Select')).toBeInTheDocument();
        },
        { timeout: 10000 },
      );

      const cancelButton = screen.getByRole('button', { name: 'Cancel' });
      await user.click(cancelButton);

      await waitFor(
        () => {
          expect(screen.queryByText('Quick Select')).not.toBeInTheDocument();
        },
        { timeout: 10000 },
      );
    });

    it('should display preset options in popover', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();

      renderWithIntl(<ActivityDateRangeFilter onChange={onChange} />);

      const button = screen.getByRole('button', { name: /All time/i });
      await user.click(button);

      await waitFor(
        () => {
          expect(screen.getByText('Quick Select')).toBeInTheDocument();
        },
        { timeout: 10000 },
      );

      expect(screen.getByRole('button', { name: 'Last 7 days' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Last 30 days' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Last 90 days' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'This year' })).toBeInTheDocument();

      const allTimeButtons = screen.getAllByRole('button', { name: 'All time' });
      expect(allTimeButtons.length).toBeGreaterThanOrEqual(2);
    }, 15000);

    it('should display custom range section in popover', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();

      renderWithIntl(<ActivityDateRangeFilter onChange={onChange} />);

      const button = screen.getByRole('button', { name: /All time/i });
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByText('Custom Range')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Apply' })).toBeInTheDocument();
      });
    });
  });

  describe('Presets', () => {
    it('should call onChange with correct dates when preset is selected', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();

      renderWithIntl(<ActivityDateRangeFilter onChange={onChange} />);

      const button = screen.getByRole('button', { name: /All time/i });
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Last 7 days' })).toBeInTheDocument();
      });

      const presetButton = screen.getByRole('button', { name: 'Last 7 days' });
      await user.click(presetButton);

      await waitFor(() => {
        expect(onChange).toHaveBeenCalledWith(expect.any(Date), expect.any(Date));
      });
    }, 10000);

    it('should close popover after preset selection', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();

      renderWithIntl(<ActivityDateRangeFilter onChange={onChange} />);

      const button = screen.getByRole('button', { name: /All time/i });
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Last 30 days' })).toBeInTheDocument();
      });

      const presetButton = screen.getByRole('button', { name: 'Last 30 days' });
      await user.click(presetButton);

      await waitFor(() => {
        expect(screen.queryByText('Quick Select')).not.toBeInTheDocument();
      });
    }, 10000);

    it('should call onChange with undefined dates for "All time" preset', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      const start = new Date('2024-01-01');
      const end = new Date('2024-01-15');

      renderWithIntl(<ActivityDateRangeFilter startDate={start} endDate={end} onChange={onChange} />);

      const triggerButton = screen.getByRole('button');
      await user.click(triggerButton);

      await waitFor(() => {
        expect(screen.getByText('Quick Select')).toBeInTheDocument();
      });

      const allTimePreset = screen.getByRole('button', { name: 'All time' });
      await user.click(allTimePreset);

      await waitFor(() => {
        expect(onChange).toHaveBeenCalledWith(undefined, undefined);
      });
    });
  });

  describe('Custom Range', () => {
    it('should call onChange when apply button is clicked', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();

      renderWithIntl(<ActivityDateRangeFilter onChange={onChange} />);

      const button = screen.getByRole('button', { name: /All time/i });
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Apply' })).toBeInTheDocument();
      });

      const applyButton = screen.getByRole('button', { name: 'Apply' });
      await user.click(applyButton);

      await waitFor(() => {
        expect(onChange).toHaveBeenCalled();
      });
    });

    it('should close popover when apply button is clicked', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();

      renderWithIntl(<ActivityDateRangeFilter onChange={onChange} />);

      const button = screen.getByRole('button', { name: /All time/i });
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Apply' })).toBeInTheDocument();
      });

      const applyButton = screen.getByRole('button', { name: 'Apply' });
      await user.click(applyButton);

      await waitFor(() => {
        expect(screen.queryByText('Custom Range')).not.toBeInTheDocument();
      });
    });
  });

  describe('useMemo Optimization', () => {
    it('should update label when dates change', () => {
      const onChange = vi.fn();
      const { rerender } = renderWithIntl(<ActivityDateRangeFilter onChange={onChange} />);

      expect(screen.getByRole('button', { name: /All time/i })).toBeInTheDocument();

      const start = new Date('2024-01-01');
      const end = new Date('2024-01-15');

      rerender(
        <NextIntlClientProvider locale="en" messages={messages}>
          <ActivityDateRangeFilter startDate={start} endDate={end} onChange={onChange} />
        </NextIntlClientProvider>,
      );

      const button = screen.getByRole('button');
      expect(button.textContent).toContain('1/1/24');
    });

    it('should not recompute label when unrelated props change', () => {
      const onChange1 = vi.fn();
      const start = new Date('2024-01-01');
      const end = new Date('2024-01-15');

      const { rerender } = renderWithIntl(
        <ActivityDateRangeFilter startDate={start} endDate={end} onChange={onChange1} />,
      );

      const button1 = screen.getByRole('button');
      const label1 = button1.textContent;

      const onChange2 = vi.fn();
      rerender(
        <NextIntlClientProvider locale="en" messages={messages}>
          <ActivityDateRangeFilter startDate={start} endDate={end} onChange={onChange2} />
        </NextIntlClientProvider>,
      );

      const button2 = screen.getByRole('button');
      const label2 = button2.textContent;

      expect(label1).toBe(label2);
    });
  });
});
