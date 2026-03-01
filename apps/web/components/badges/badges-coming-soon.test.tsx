import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BadgesComingSoon } from './badges-coming-soon';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      title: 'Badges',
      subtitle: 'Your achievements and rewards',
      'comingSoon.badge': 'Coming soon',
      'comingSoon.heading': 'Achievements are on the way',
      'comingSoon.description': 'Earn badges for distance milestones, training consistency, and personal records.',
      'comingSoon.categories.distance': 'Distance milestones',
      'comingSoon.categories.consistency': 'Consistency streaks',
      'comingSoon.categories.records': 'Personal records',
      'comingSoon.categories.elevation': 'Elevation challenges',
      'comingSoon.cta': 'Set a goal in the meantime',
    };
    return translations[key] ?? key;
  },
}));

vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}));

describe('BadgesComingSoon', () => {
  describe('page structure', () => {
    it('should render the page title as h1', () => {
      render(<BadgesComingSoon />);

      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Badges');
    });

    it('should render the page subtitle', () => {
      render(<BadgesComingSoon />);

      expect(screen.getByText('Your achievements and rewards')).toBeInTheDocument();
    });

    it('should render the coming soon heading as h2', () => {
      render(<BadgesComingSoon />);

      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Achievements are on the way');
    });

    it('should render the description', () => {
      render(<BadgesComingSoon />);

      expect(screen.getByText(/Earn badges for distance milestones/i)).toBeInTheDocument();
    });
  });

  describe('coming soon badge', () => {
    it('should render the coming soon label', () => {
      render(<BadgesComingSoon />);

      expect(screen.getByText('Coming soon')).toBeInTheDocument();
    });

    it('should apply emerald color styling consistent with the landing page', () => {
      const { container } = render(<BadgesComingSoon />);

      const badge = container.querySelector('.bg-emerald-500\\/10');
      expect(badge).toBeInTheDocument();
    });
  });

  describe('badge categories', () => {
    it('should render all four planned badge categories', () => {
      render(<BadgesComingSoon />);

      expect(screen.getByText('Distance milestones')).toBeInTheDocument();
      expect(screen.getByText('Consistency streaks')).toBeInTheDocument();
      expect(screen.getByText('Personal records')).toBeInTheDocument();
      expect(screen.getByText('Elevation challenges')).toBeInTheDocument();
    });

    it('should render categories in a 2-column grid on mobile', () => {
      const { container } = render(<BadgesComingSoon />);

      const grid = container.querySelector('.grid-cols-2');
      expect(grid).toBeInTheDocument();
    });
  });

  describe('call to action', () => {
    it('should render the CTA link pointing to /goals', () => {
      render(<BadgesComingSoon />);

      const cta = screen.getByRole('link', { name: /Set a goal in the meantime/i });
      expect(cta).toHaveAttribute('href', '/goals');
    });
  });

  describe('accessibility', () => {
    it('should have all decorative icons marked as aria-hidden', () => {
      const { container } = render(<BadgesComingSoon />);

      const hiddenIcons = container.querySelectorAll('[aria-hidden="true"]');
      expect(hiddenIcons.length).toBeGreaterThan(0);
    });
  });
});
