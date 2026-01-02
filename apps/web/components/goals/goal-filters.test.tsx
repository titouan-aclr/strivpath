import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GoalFilters } from './goal-filters';
import { DEFAULT_FILTER } from '@/lib/goals/types';
import { SportType, GoalStatus, GoalPeriodType } from '@/gql/graphql';

const mockUseTranslations = () => (key: string) => {
  const translations: Record<string, string> = {
    'filters.sport.label': 'Sport Type',
    'filters.sport.all': 'All Sports',
    'filters.sport.run': 'Running',
    'filters.sport.ride': 'Cycling',
    'filters.sport.swim': 'Swimming',
    'filters.status.label': 'Status',
    'filters.status.all': 'All',
    'filters.status.active': 'Active',
    'filters.status.completed': 'Completed',
    'filters.status.failed': 'Failed',
    'filters.status.archived': 'Archived',
    'filters.period.label': 'Period',
    'filters.period.all': 'All Periods',
    'filters.target.label': 'Type',
    'filters.target.all': 'All Types',
    'filters.sort.label': 'Sort by',
    'filters.clear': 'Clear',
    'filters.moreFilters': 'More Filters',
  };
  return translations[key] || key;
};

vi.mock('next-intl', () => ({
  useTranslations: () => mockUseTranslations(),
}));

Object.defineProperty(window, 'innerWidth', {
  writable: true,
  configurable: true,
  value: 1024,
});

Object.defineProperty(window, 'addEventListener', {
  writable: true,
  value: vi.fn(),
});

Object.defineProperty(window, 'removeEventListener', {
  writable: true,
  value: vi.fn(),
});

describe('GoalFilters', () => {
  const mockOnFilterChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    window.innerWidth = 1024;
  });

  const openAdvancedFilters = () => {
    const moreFiltersButton = screen.getByText('More Filters');
    fireEvent.click(moreFiltersButton);
  };

  it('renders desktop filters on large screen with primary filters visible', () => {
    window.innerWidth = 1024;

    render(<GoalFilters filter={DEFAULT_FILTER} onFilterChange={mockOnFilterChange} />);

    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Sort by')).toBeInTheDocument();
    expect(screen.getByText('More Filters')).toBeInTheDocument();

    expect(screen.queryByText('Sport Type')).not.toBeInTheDocument();
    expect(screen.queryByText('Period')).not.toBeInTheDocument();
  });

  it('shows advanced filters when More Filters button is clicked', () => {
    render(<GoalFilters filter={DEFAULT_FILTER} onFilterChange={mockOnFilterChange} />);

    expect(screen.queryByText('Sport Type')).not.toBeInTheDocument();

    openAdvancedFilters();

    expect(screen.getByText('Sport Type')).toBeInTheDocument();
    expect(screen.getByText('Period')).toBeInTheDocument();
    expect(screen.getByText('Type')).toBeInTheDocument();
  });

  it('calls onFilterChange when sport filter is clicked', () => {
    render(<GoalFilters filter={DEFAULT_FILTER} onFilterChange={mockOnFilterChange} />);

    openAdvancedFilters();

    const runningBadge = screen.getByText('Running');
    fireEvent.click(runningBadge);

    expect(mockOnFilterChange).toHaveBeenCalledWith(expect.objectContaining({ sportType: SportType.Run }));
  });

  it('calls onFilterChange when status filter is clicked', () => {
    render(<GoalFilters filter={DEFAULT_FILTER} onFilterChange={mockOnFilterChange} />);

    const completedBadge = screen.getByText('Completed');
    fireEvent.click(completedBadge);

    expect(mockOnFilterChange).toHaveBeenCalledWith(expect.objectContaining({ status: GoalStatus.Completed }));
  });

  it('resets filters when clear button is clicked', () => {
    const customFilter = {
      ...DEFAULT_FILTER,
      sportType: SportType.Run,
    };

    render(<GoalFilters filter={customFilter} onFilterChange={mockOnFilterChange} />);

    const clearButton = screen.getByText('Clear');
    fireEvent.click(clearButton);

    expect(mockOnFilterChange).toHaveBeenCalledWith(DEFAULT_FILTER);
  });

  it('highlights selected sport filter', () => {
    const filterWithSport = {
      ...DEFAULT_FILTER,
      sportType: SportType.Run,
    };

    render(<GoalFilters filter={filterWithSport} onFilterChange={mockOnFilterChange} />);

    openAdvancedFilters();

    const runningBadge = screen.getByText('Running');
    expect(runningBadge.closest('[role="radio"]')).toHaveAttribute('aria-checked', 'true');
  });

  it('shows active filter count on More Filters button', () => {
    const filterWithMultiple = {
      ...DEFAULT_FILTER,
      sportType: SportType.Run,
      periodType: GoalPeriodType.Monthly,
    };

    render(<GoalFilters filter={filterWithMultiple} onFilterChange={mockOnFilterChange} />);

    expect(screen.getByText('(2)')).toBeInTheDocument();
  });

  it('has proper accessibility attributes on filter groups', () => {
    render(<GoalFilters filter={DEFAULT_FILTER} onFilterChange={mockOnFilterChange} />);

    const statusFilterGroup = screen.getByRole('radiogroup', { name: /status/i });
    expect(statusFilterGroup).toBeInTheDocument();

    openAdvancedFilters();

    const sportFilterGroup = screen.getByRole('radiogroup', { name: /sport type/i });
    expect(sportFilterGroup).toBeInTheDocument();
  });

  it('supports keyboard navigation on badges', () => {
    render(<GoalFilters filter={DEFAULT_FILTER} onFilterChange={mockOnFilterChange} />);

    openAdvancedFilters();

    const runningBadge = screen.getByText('Running');
    fireEvent.keyDown(runningBadge, { key: 'Enter' });

    expect(mockOnFilterChange).toHaveBeenCalledWith(expect.objectContaining({ sportType: SportType.Run }));
  });

  it('supports space key for badge selection', () => {
    render(<GoalFilters filter={DEFAULT_FILTER} onFilterChange={mockOnFilterChange} />);

    openAdvancedFilters();

    const runningBadge = screen.getByText('Running');
    fireEvent.keyDown(runningBadge, { key: ' ' });

    expect(mockOnFilterChange).toHaveBeenCalledWith(expect.objectContaining({ sportType: SportType.Run }));
  });
});
