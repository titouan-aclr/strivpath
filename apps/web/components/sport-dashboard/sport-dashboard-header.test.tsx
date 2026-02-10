import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SportDashboardHeader } from './sport-dashboard-header';
import { SportType } from '@/gql/graphql';

vi.mock('next-intl', () => ({
  useTranslations: (namespace: string) => {
    const translations: Record<string, Record<string, string>> = {
      'sportDashboard.header': {
        title: '{sport} Dashboard',
        lastSync: 'Last sync {time}',
        neverSynced: 'Never synced',
      },
      'navigation.sports': {
        running: 'Running',
        cycling: 'Cycling',
        swimming: 'Swimming',
      },
    };

    return (key: string, params?: Record<string, string>) => {
      const map = translations[namespace];
      let value = map?.[key] ?? key;
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          value = value.replace(`{${k}}`, v);
        });
      }
      return value;
    };
  },
  useLocale: () => 'en',
}));

vi.mock('@/lib/dashboard/utils', () => ({
  formatTimeAgo: vi.fn((date: Date | string) => {
    if (!date) return null;
    return '5 minutes ago';
  }),
}));

describe('SportDashboardHeader', () => {
  it('should render sport icon with sport color classes', () => {
    const { container } = render(<SportDashboardHeader sportType={SportType.Run} />);

    expect(container.querySelector('.bg-lime-300\\/10')).toBeInTheDocument();
    expect(container.querySelector('.text-lime-500')).toBeInTheDocument();
  });

  it('should render title with sport name for Running', () => {
    render(<SportDashboardHeader sportType={SportType.Run} />);

    expect(screen.getByText('Running Dashboard')).toBeInTheDocument();
  });

  it('should render title with sport name for Cycling', () => {
    render(<SportDashboardHeader sportType={SportType.Ride} />);

    expect(screen.getByText('Cycling Dashboard')).toBeInTheDocument();
  });

  it('should render title with sport name for Swimming', () => {
    render(<SportDashboardHeader sportType={SportType.Swim} />);

    expect(screen.getByText('Swimming Dashboard')).toBeInTheDocument();
  });

  it('should render sync time when provided', () => {
    render(<SportDashboardHeader sportType={SportType.Run} lastSyncTime={new Date('2024-01-01')} />);

    expect(screen.getByText('Last sync 5 minutes ago')).toBeInTheDocument();
  });

  it('should render "Never synced" when lastSyncTime is null', () => {
    render(<SportDashboardHeader sportType={SportType.Run} lastSyncTime={null} />);

    expect(screen.getByText('Never synced')).toBeInTheDocument();
  });

  it('should render "Never synced" when lastSyncTime is undefined', () => {
    render(<SportDashboardHeader sportType={SportType.Run} />);

    expect(screen.getByText('Never synced')).toBeInTheDocument();
  });

  it('should render skeleton when loading', () => {
    const { container } = render(<SportDashboardHeader sportType={SportType.Run} loading />);

    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('should not render content when loading', () => {
    render(<SportDashboardHeader sportType={SportType.Run} loading />);

    expect(screen.queryByText('Running Dashboard')).not.toBeInTheDocument();
  });

  it('should render icon with aria-hidden', () => {
    const { container } = render(<SportDashboardHeader sportType={SportType.Run} />);

    const icon = container.querySelector('[aria-hidden="true"]');
    expect(icon).toBeInTheDocument();
  });

  it('should render Ride sport icon with correct colors', () => {
    const { container } = render(<SportDashboardHeader sportType={SportType.Ride} />);

    expect(container.querySelector('.bg-purple-400\\/10')).toBeInTheDocument();
    expect(container.querySelector('.text-purple-500')).toBeInTheDocument();
  });

  it('should render Swim sport icon with correct colors', () => {
    const { container } = render(<SportDashboardHeader sportType={SportType.Swim} />);

    expect(container.querySelector('.bg-cyan-300\\/10')).toBeInTheDocument();
    expect(container.querySelector('.text-cyan-500')).toBeInTheDocument();
  });
});
