import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HeroSection } from './hero-section';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const messages: Record<string, string> = {
      badge: '✦ For Strava athletes who want more',
      headline1: 'Stop logging workouts.',
      headline2: 'Start tracking progress.',
      subtitle:
        'Set meaningful goals, follow your journey across every sport, and celebrate each milestone on your personal path.',
      cta: 'Start your path',
      ctaAuthenticated: 'Open Dashboard',
      ctaSecondary: 'See how it works ↓',
      sports: '🏃 Running · 🚴 Cycling · 🏊 Swimming',
    };
    return messages[key] ?? key;
  },
}));

vi.mock('@/i18n/navigation', () => ({
  Link: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}));

vi.mock('motion/react', () => ({
  motion: {
    div: ({ children, className }: { children?: React.ReactNode; className?: string }) => (
      <div className={className}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@/components/ui/animated-gradient-text', () => ({
  AnimatedGradientText: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}));

describe('HeroSection', () => {
  it('renders the headline', () => {
    render(<HeroSection isAuthenticated={false} />);
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    expect(screen.getByText(/stop logging workouts/i)).toBeInTheDocument();
    expect(screen.getByText(/tracking progress/i)).toBeInTheDocument();
  });

  it('renders the subtitle', () => {
    render(<HeroSection isAuthenticated={false} />);
    expect(screen.getByText(/set meaningful goals/i)).toBeInTheDocument();
  });

  it('renders the badge text', () => {
    render(<HeroSection isAuthenticated={false} />);
    expect(screen.getByText(/for strava athletes who want more/i)).toBeInTheDocument();
  });

  it('renders "Start your path" CTA linking to /login when not authenticated', () => {
    render(<HeroSection isAuthenticated={false} />);
    const cta = screen.getByRole('link', { name: /start your path/i });
    expect(cta).toHaveAttribute('href', '/login');
  });

  it('renders "Open Dashboard" CTA linking to /dashboard when authenticated', () => {
    render(<HeroSection isAuthenticated={true} />);
    const cta = screen.getByRole('link', { name: /open dashboard/i });
    expect(cta).toHaveAttribute('href', '/dashboard');
  });

  it('renders the "See how it works" secondary CTA linking to #how-it-works', () => {
    render(<HeroSection isAuthenticated={false} />);
    const cta = screen.getByRole('link', { name: /see how it works/i });
    expect(cta).toHaveAttribute('href', '#how-it-works');
  });

  it('renders the supported sports', () => {
    render(<HeroSection isAuthenticated={false} />);
    const sports = screen.getByLabelText('Supported sports');
    expect(sports).toHaveTextContent('Running');
    expect(sports).toHaveTextContent('Cycling');
    expect(sports).toHaveTextContent('Swimming');
  });
});
