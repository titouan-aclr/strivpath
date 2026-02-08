import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PersonalRecordsSection } from './personal-records-section';
import { SportType } from '@/gql/graphql';
import type { PersonalRecord } from '@/gql/graphql';

const mockUsePersonalRecords = vi.fn();

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string, params?: Record<string, string>) => {
    const translations: Record<string, string> = {
      title: 'Personal Records',
      empty: 'No records yet. Keep training to set your first records!',
      'types.longest_distance': 'Longest Distance',
      'types.longest_duration': 'Longest Duration',
      'types.most_elevation': 'Most Elevation',
      'types.best_pace': 'Best Pace',
      'types.best_speed': 'Best Speed',
    };
    if (key === 'achievedOn' && params?.date) return `Achieved on ${params.date}`;
    return translations[key] || key;
  },
  useLocale: () => 'en',
}));

vi.mock('@/lib/sport-dashboard/hooks/use-personal-records', () => ({
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  usePersonalRecords: (...args: unknown[]) => mockUsePersonalRecords(...args),
}));

const mockRunRecords: PersonalRecord[] = [
  {
    __typename: 'PersonalRecord',
    type: 'longest_distance',
    value: 21097,
    achievedAt: new Date('2025-01-15T08:30:00Z'),
    activityId: '12345678901',
  },
  {
    __typename: 'PersonalRecord',
    type: 'best_pace_5k',
    value: 285,
    achievedAt: new Date('2025-01-10T07:00:00Z'),
    activityId: '12345678902',
  },
  {
    __typename: 'PersonalRecord',
    type: 'longest_duration',
    value: 7200,
    achievedAt: new Date('2025-01-15T08:30:00Z'),
    activityId: '12345678901',
  },
];

const mockRideRecords: PersonalRecord[] = [
  {
    __typename: 'PersonalRecord',
    type: 'longest_distance',
    value: 102500,
    achievedAt: new Date('2024-12-20T06:00:00Z'),
    activityId: '12345678903',
  },
  {
    __typename: 'PersonalRecord',
    type: 'highest_elevation',
    value: 1850,
    achievedAt: new Date('2024-11-15T07:30:00Z'),
    activityId: '12345678904',
  },
  {
    __typename: 'PersonalRecord',
    type: 'best_average_speed',
    value: 12.5,
    achievedAt: new Date('2025-01-05T09:00:00Z'),
    activityId: '12345678905',
  },
];

describe('PersonalRecordsSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the section title', () => {
    mockUsePersonalRecords.mockReturnValue({
      records: mockRunRecords,
      loading: false,
      error: undefined,
      refetch: vi.fn(),
    });

    render(<PersonalRecordsSection sportType={SportType.Run} />);

    expect(screen.getByText('Personal Records')).toBeInTheDocument();
  });

  it('should render record values formatted for running', () => {
    mockUsePersonalRecords.mockReturnValue({
      records: mockRunRecords,
      loading: false,
      error: undefined,
      refetch: vi.fn(),
    });

    render(<PersonalRecordsSection sportType={SportType.Run} />);

    expect(screen.getByText('21.10 km')).toBeInTheDocument();
    expect(screen.getByText('2h')).toBeInTheDocument();
    expect(screen.getByText('Longest Distance')).toBeInTheDocument();
    expect(screen.getByText('Best Pace')).toBeInTheDocument();
    expect(screen.getByText('Longest Duration')).toBeInTheDocument();
  });

  it('should render record values formatted for cycling', () => {
    mockUsePersonalRecords.mockReturnValue({
      records: mockRideRecords,
      loading: false,
      error: undefined,
      refetch: vi.fn(),
    });

    render(<PersonalRecordsSection sportType={SportType.Ride} />);

    expect(screen.getByText('102.50 km')).toBeInTheDocument();
    expect(screen.getByText('Most Elevation')).toBeInTheDocument();
    expect(screen.getByText('Best Speed')).toBeInTheDocument();
  });

  it('should render achievement dates', () => {
    mockUsePersonalRecords.mockReturnValue({
      records: [mockRunRecords[0]],
      loading: false,
      error: undefined,
      refetch: vi.fn(),
    });

    render(<PersonalRecordsSection sportType={SportType.Run} />);

    expect(screen.getByText(/Achieved on/)).toBeInTheDocument();
  });

  it('should link each record to its activity', () => {
    mockUsePersonalRecords.mockReturnValue({
      records: mockRunRecords,
      loading: false,
      error: undefined,
      refetch: vi.fn(),
    });

    render(<PersonalRecordsSection sportType={SportType.Run} />);

    const links = screen.getAllByRole('link');
    expect(links[0]).toHaveAttribute('href', '/activities/12345678901');
    expect(links[1]).toHaveAttribute('href', '/activities/12345678902');
  });

  it('should render empty state when no records', () => {
    mockUsePersonalRecords.mockReturnValue({
      records: [],
      loading: false,
      error: undefined,
      refetch: vi.fn(),
    });

    render(<PersonalRecordsSection sportType={SportType.Run} />);

    expect(screen.getByText('No records yet. Keep training to set your first records!')).toBeInTheDocument();
  });

  it('should render skeleton when loading', () => {
    mockUsePersonalRecords.mockReturnValue({
      records: [],
      loading: true,
      error: undefined,
      refetch: vi.fn(),
    });

    const { container } = render(<PersonalRecordsSection sportType={SportType.Run} />);

    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('should not render records when loading', () => {
    mockUsePersonalRecords.mockReturnValue({
      records: [],
      loading: true,
      error: undefined,
      refetch: vi.fn(),
    });

    render(<PersonalRecordsSection sportType={SportType.Run} />);

    expect(screen.queryByText('Longest Distance')).not.toBeInTheDocument();
  });

  it('should not render section landmark when loading', () => {
    mockUsePersonalRecords.mockReturnValue({
      records: [],
      loading: true,
      error: undefined,
      refetch: vi.fn(),
    });

    render(<PersonalRecordsSection sportType={SportType.Run} />);

    expect(screen.queryByRole('region')).not.toBeInTheDocument();
  });

  it('should apply sport colors for running', () => {
    mockUsePersonalRecords.mockReturnValue({
      records: mockRunRecords,
      loading: false,
      error: undefined,
      refetch: vi.fn(),
    });

    const { container } = render(<PersonalRecordsSection sportType={SportType.Run} />);

    expect(container.querySelector('.bg-lime-300\\/10')).toBeInTheDocument();
    expect(container.querySelector('.text-lime-500')).toBeInTheDocument();
  });

  it('should apply sport colors for cycling', () => {
    mockUsePersonalRecords.mockReturnValue({
      records: mockRideRecords,
      loading: false,
      error: undefined,
      refetch: vi.fn(),
    });

    const { container } = render(<PersonalRecordsSection sportType={SportType.Ride} />);

    expect(container.querySelector('.bg-purple-400\\/10')).toBeInTheDocument();
    expect(container.querySelector('.text-purple-500')).toBeInTheDocument();
  });

  it('should have an accessible section landmark', () => {
    mockUsePersonalRecords.mockReturnValue({
      records: mockRunRecords,
      loading: false,
      error: undefined,
      refetch: vi.fn(),
    });

    render(<PersonalRecordsSection sportType={SportType.Run} />);

    expect(screen.getByRole('region', { name: /personal records/i })).toBeInTheDocument();
  });
});
