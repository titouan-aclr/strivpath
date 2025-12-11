import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import { ActivityFilters } from './activity-filters';
import { ActivityType } from '@/gql/graphql';
import { OrderBy, OrderDirection } from '@/lib/activities/constants';
import type { ActivityFilter } from '@/lib/activities/types';

const messages = {
  activities: {
    filters: {
      title: 'Filters',
      showFilters: 'Show filters',
      apply: 'Apply',
      clear: 'Clear filters',
      sportType: {
        label: 'Sport Type',
        all: 'All Sports',
      },
      dateRange: {
        label: 'Date Range',
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
      sort: {
        label: 'Sort by',
      },
    },
    sportTypes: {
      run: 'Running',
      ride: 'Cycling',
      swim: 'Swimming',
    },
    sort: {
      dateDesc: 'Newest first',
      dateAsc: 'Oldest first',
      distanceDesc: 'Longest distance',
      distanceAsc: 'Shortest distance',
      durationDesc: 'Longest duration',
      durationAsc: 'Shortest duration',
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

const defaultFilter: ActivityFilter = {};

describe('ActivityFilters', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });
  });

  describe('Desktop View', () => {
    describe('Sport Badges', () => {
      it('should render all sport type badges', () => {
        const onFilterChange = vi.fn();
        renderWithIntl(<ActivityFilters filter={defaultFilter} onFilterChange={onFilterChange} />);

        expect(screen.getByText('All Sports')).toBeInTheDocument();
        expect(screen.getByText('Running')).toBeInTheDocument();
        expect(screen.getByText('Cycling')).toBeInTheDocument();
        expect(screen.getByText('Swimming')).toBeInTheDocument();
      });

      it('should mark "All Sports" as selected when no type filter', () => {
        const onFilterChange = vi.fn();
        renderWithIntl(<ActivityFilters filter={defaultFilter} onFilterChange={onFilterChange} />);

        const allSportsBadge = screen.getByText('All Sports');
        expect(allSportsBadge).toHaveAttribute('aria-checked', 'true');
      });

      it('should mark selected sport as checked', () => {
        const onFilterChange = vi.fn();
        const filter: ActivityFilter = { type: ActivityType.Run };
        renderWithIntl(<ActivityFilters filter={filter} onFilterChange={onFilterChange} />);

        const runningBadge = screen.getByText('Running');
        expect(runningBadge).toHaveAttribute('aria-checked', 'true');
      });

      it('should call onFilterChange when sport badge is clicked', async () => {
        const user = userEvent.setup();
        const onFilterChange = vi.fn();
        renderWithIntl(<ActivityFilters filter={defaultFilter} onFilterChange={onFilterChange} />);

        const runningBadge = screen.getByText('Running');
        await user.click(runningBadge);

        expect(onFilterChange).toHaveBeenCalledWith({ type: ActivityType.Run });
      });

      it('should support keyboard navigation for sport badges', async () => {
        const user = userEvent.setup();
        const onFilterChange = vi.fn();
        renderWithIntl(<ActivityFilters filter={defaultFilter} onFilterChange={onFilterChange} />);

        const runningBadge = screen.getByText('Running');
        runningBadge.focus();
        await user.keyboard('{Enter}');

        expect(onFilterChange).toHaveBeenCalledWith({ type: ActivityType.Run });
      });

      it('should support space key for sport badges', async () => {
        const user = userEvent.setup();
        const onFilterChange = vi.fn();
        renderWithIntl(<ActivityFilters filter={defaultFilter} onFilterChange={onFilterChange} />);

        const runningBadge = screen.getByText('Running');
        runningBadge.focus();
        await user.keyboard(' ');

        expect(onFilterChange).toHaveBeenCalledWith({ type: ActivityType.Run });
      });

      it('should support space key for "All Sports" badge', async () => {
        const user = userEvent.setup();
        const onFilterChange = vi.fn();
        const filter: ActivityFilter = { type: ActivityType.Run };
        renderWithIntl(<ActivityFilters filter={filter} onFilterChange={onFilterChange} />);

        const allSportsBadge = screen.getByText('All Sports');
        allSportsBadge.focus();
        await user.keyboard(' ');

        expect(onFilterChange).toHaveBeenCalledWith({ type: undefined });
      });

      it('should deselect sport when "All Sports" is clicked', async () => {
        const user = userEvent.setup();
        const onFilterChange = vi.fn();
        const filter: ActivityFilter = { type: ActivityType.Run };
        renderWithIntl(<ActivityFilters filter={filter} onFilterChange={onFilterChange} />);

        const allSportsBadge = screen.getByText('All Sports');
        await user.click(allSportsBadge);

        expect(onFilterChange).toHaveBeenCalledWith({ type: undefined });
      });
    });

    describe('Date Range', () => {
      it('should render date range filter', () => {
        const onFilterChange = vi.fn();
        renderWithIntl(<ActivityFilters filter={defaultFilter} onFilterChange={onFilterChange} />);

        expect(screen.getByText('Date Range')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /All time/i })).toBeInTheDocument();
      });

      it('should call onFilterChange when date range changes', async () => {
        const user = userEvent.setup();
        const onFilterChange = vi.fn();
        renderWithIntl(<ActivityFilters filter={defaultFilter} onFilterChange={onFilterChange} />);

        const dateButton = screen.getByRole('button', { name: /All time/i });
        await user.click(dateButton);

        await waitFor(
          () => {
            expect(screen.getByText('Quick Select')).toBeInTheDocument();
          },
          { timeout: 10000 },
        );

        const preset = screen.getByRole('button', { name: 'Last 7 days' });
        await user.click(preset);

        await waitFor(
          () => {
            expect(onFilterChange).toHaveBeenCalled();
          },
          { timeout: 10000 },
        );
      }, 20000);
    });

    describe('Sort Select', () => {
      it('should render sort select', () => {
        const onFilterChange = vi.fn();
        renderWithIntl(<ActivityFilters filter={defaultFilter} onFilterChange={onFilterChange} />);

        expect(screen.getByText('Sort by')).toBeInTheDocument();
      });

      it('should display default sort value', () => {
        const onFilterChange = vi.fn();
        renderWithIntl(<ActivityFilters filter={defaultFilter} onFilterChange={onFilterChange} />);

        expect(screen.getByText('Newest first')).toBeInTheDocument();
      });

      it('should display selected sort value', () => {
        const onFilterChange = vi.fn();
        const filter: ActivityFilter = {
          orderBy: OrderBy.Distance,
          orderDirection: OrderDirection.Desc,
        };
        renderWithIntl(<ActivityFilters filter={filter} onFilterChange={onFilterChange} />);

        expect(screen.getByText('Longest distance')).toBeInTheDocument();
      });
    });

    describe('Clear Filters', () => {
      it('should render clear button', () => {
        const onFilterChange = vi.fn();
        renderWithIntl(<ActivityFilters filter={defaultFilter} onFilterChange={onFilterChange} />);

        expect(screen.getByRole('button', { name: 'Clear filters' })).toBeInTheDocument();
      });

      it('should call onFilterChange with empty filter when clear is clicked', async () => {
        const user = userEvent.setup();
        const onFilterChange = vi.fn();
        const filter: ActivityFilter = {
          type: ActivityType.Run,
          orderBy: OrderBy.Distance,
          orderDirection: OrderDirection.Desc,
        };
        renderWithIntl(<ActivityFilters filter={filter} onFilterChange={onFilterChange} />);

        const clearButton = screen.getByRole('button', { name: 'Clear filters' });
        await user.click(clearButton);

        expect(onFilterChange).toHaveBeenCalledWith({});
      });
    });
  });

  describe('Mobile View', () => {
    beforeEach(() => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 500,
      });
    });

    it('should render show filters button on mobile', () => {
      const onFilterChange = vi.fn();
      renderWithIntl(<ActivityFilters filter={defaultFilter} onFilterChange={onFilterChange} />);

      expect(screen.getByRole('button', { name: 'Show filters' })).toBeInTheDocument();
    });

    it('should open sheet when show filters is clicked', async () => {
      const user = userEvent.setup();
      const onFilterChange = vi.fn();
      renderWithIntl(<ActivityFilters filter={defaultFilter} onFilterChange={onFilterChange} />);

      const showFiltersButton = screen.getByRole('button', { name: 'Show filters' });
      await user.click(showFiltersButton);

      await waitFor(() => {
        expect(screen.getByText('Filters')).toBeInTheDocument();
      });
    });

    it('should display all filter options in sheet', async () => {
      const user = userEvent.setup();
      const onFilterChange = vi.fn();
      renderWithIntl(<ActivityFilters filter={defaultFilter} onFilterChange={onFilterChange} />);

      const showFiltersButton = screen.getByRole('button', { name: 'Show filters' });
      await user.click(showFiltersButton);

      await waitFor(() => {
        expect(screen.getByText('Sport Type')).toBeInTheDocument();
        expect(screen.getByText('Date Range')).toBeInTheDocument();
        expect(screen.getByText('Sort by')).toBeInTheDocument();
      });
    });

    it('should apply filters when apply button is clicked', async () => {
      const user = userEvent.setup();
      const onFilterChange = vi.fn();
      renderWithIntl(<ActivityFilters filter={defaultFilter} onFilterChange={onFilterChange} />);

      const showFiltersButton = screen.getByRole('button', { name: 'Show filters' });
      await user.click(showFiltersButton);

      await waitFor(() => {
        expect(screen.getByText('Running')).toBeInTheDocument();
      });

      const runningBadge = screen.getByText('Running');
      await user.click(runningBadge);

      const applyButton = screen.getByRole('button', { name: 'Apply' });
      await user.click(applyButton);

      await waitFor(() => {
        expect(onFilterChange).toHaveBeenCalledWith({ type: ActivityType.Run });
      });
    });

    it('should clear filters when clear button is clicked', async () => {
      const user = userEvent.setup();
      const onFilterChange = vi.fn();
      const filter: ActivityFilter = { type: ActivityType.Run };
      renderWithIntl(<ActivityFilters filter={filter} onFilterChange={onFilterChange} />);

      const showFiltersButton = screen.getByRole('button', { name: 'Show filters' });
      await user.click(showFiltersButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Clear filters' })).toBeInTheDocument();
      });

      const clearButton = screen.getByRole('button', { name: 'Clear filters' });
      await user.click(clearButton);

      await waitFor(() => {
        expect(onFilterChange).toHaveBeenCalledWith({});
      });
    });

    it('should select "All Sports" badge in mobile sheet', async () => {
      const user = userEvent.setup();
      const onFilterChange = vi.fn();
      const filter: ActivityFilter = { type: ActivityType.Run };
      renderWithIntl(<ActivityFilters filter={filter} onFilterChange={onFilterChange} />);

      const showFiltersButton = screen.getByRole('button', { name: 'Show filters' });
      await user.click(showFiltersButton);

      await waitFor(() => {
        expect(screen.getByText('All Sports')).toBeInTheDocument();
      });

      const allSportsBadge = screen.getByText('All Sports');
      await user.click(allSportsBadge);

      const applyButton = screen.getByRole('button', { name: 'Apply' });
      await user.click(applyButton);

      await waitFor(() => {
        expect(onFilterChange).toHaveBeenCalledWith({ type: undefined });
      });
    });

    it('should update date range in mobile sheet', async () => {
      const user = userEvent.setup();
      const onFilterChange = vi.fn();
      renderWithIntl(<ActivityFilters filter={defaultFilter} onFilterChange={onFilterChange} />);

      const showFiltersButton = screen.getByRole('button', { name: 'Show filters' });
      await user.click(showFiltersButton);

      await waitFor(() => {
        expect(screen.getByText('Date Range')).toBeInTheDocument();
      });

      const dateButton = screen.getByRole('button', { name: /All time/i });
      await user.click(dateButton);

      await waitFor(
        () => {
          expect(screen.getByText('Quick Select')).toBeInTheDocument();
        },
        { timeout: 10000 },
      );

      const preset = screen.getByRole('button', { name: 'Last 7 days' });
      await user.click(preset);

      await waitFor(
        () => {
          const applyButton = screen.getByRole('button', { name: 'Apply' });
          expect(applyButton).toBeInTheDocument();
        },
        { timeout: 10000 },
      );

      const applyButton = screen.getByRole('button', { name: 'Apply' });
      await user.click(applyButton);

      await waitFor(
        () => {
          expect(onFilterChange).toHaveBeenCalled();
          const lastCall = onFilterChange.mock.calls[onFilterChange.mock.calls.length - 1][0];
          expect(lastCall.startDate).toBeDefined();
          expect(lastCall.endDate).toBeDefined();
        },
        { timeout: 10000 },
      );
    }, 30000);
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      const onFilterChange = vi.fn();
      renderWithIntl(<ActivityFilters filter={defaultFilter} onFilterChange={onFilterChange} />);

      const sportTypeGroup = screen.getByRole('radiogroup', { name: 'Sport Type' });
      expect(sportTypeGroup).toBeInTheDocument();

      const sortSelect = screen.getByRole('combobox', { name: 'Sort by' });
      expect(sortSelect).toBeInTheDocument();
    });

    it('should have aria-checked on sport badges', () => {
      const onFilterChange = vi.fn();
      renderWithIntl(<ActivityFilters filter={defaultFilter} onFilterChange={onFilterChange} />);

      const allSportsBadge = screen.getByText('All Sports');
      expect(allSportsBadge).toHaveAttribute('aria-checked');
    });
  });
});
