import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LoginCard } from './login-card';

vi.mock('next/image', () => ({
  // eslint-disable-next-line @next/next/no-img-element
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}));

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const messages: Record<string, string> = {
      title: 'Welcome to StrivPath',
      description: 'Connect your Strava account to start tracking your progress',
      connectButton: 'Connect with Strava',
      oauthNote: 'Secure OAuth connection · Read-only access to your activities',
      'errors.auth_failed': 'Authentication failed. Please try again.',
      'errors.unauthorized': 'You must be logged in to access this page.',
    };
    return messages[key] ?? key;
  },
}));

vi.mock('@/components/ui/blur-fade', () => ({
  BlurFade: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@/components/ui/border-beam', () => ({
  BorderBeam: () => null,
}));

describe('LoginCard', () => {
  it('renders the title and description', () => {
    render(<LoginCard stravaAuthUrl="https://strava.com/oauth/authorize" />);
    expect(screen.getByText('Welcome to StrivPath')).toBeInTheDocument();
    expect(screen.getByText('Connect your Strava account to start tracking your progress')).toBeInTheDocument();
  });

  it('renders the Strava button link with the correct href', () => {
    render(<LoginCard stravaAuthUrl="https://strava.com/oauth/authorize?client_id=123" />);
    const link = screen.getByRole('link', { name: 'Connect with Strava' });
    expect(link).toHaveAttribute('href', 'https://strava.com/oauth/authorize?client_id=123');
  });

  it('displays the Alert when an error is provided', () => {
    render(<LoginCard stravaAuthUrl="#" error="auth_failed" />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Authentication failed. Please try again.')).toBeInTheDocument();
  });

  it('does not display an Alert when no error is provided', () => {
    render(<LoginCard stravaAuthUrl="#" />);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('renders the oauth note', () => {
    render(<LoginCard stravaAuthUrl="#" />);
    expect(screen.getByText('Secure OAuth connection · Read-only access to your activities')).toBeInTheDocument();
  });

  it('uses "#" as href when stravaAuthUrl is "#"', () => {
    render(<LoginCard stravaAuthUrl="#" />);
    const link = screen.getByRole('link', { name: 'Connect with Strava' });
    expect(link).toHaveAttribute('href', '#');
  });

  it('renders the correct aria-label on the Strava link', () => {
    render(<LoginCard stravaAuthUrl="https://strava.com/oauth/authorize" />);
    expect(screen.getByRole('link', { name: 'Connect with Strava' })).toBeInTheDocument();
  });
});
