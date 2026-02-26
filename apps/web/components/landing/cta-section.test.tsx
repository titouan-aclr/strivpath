import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CtaSection } from './cta-section';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const messages: Record<string, string> = {
      heading: 'Your next milestone is waiting.',
      cta: 'Start your path →',
      ctaAuthenticated: 'Open Dashboard →',
      reassurance: 'Free · Open source · Non-commercial · Your data stays yours',
    };
    return messages[key] ?? key;
  },
}));

vi.mock('@/components/ui/blur-fade', () => ({
  BlurFade: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}));

describe('CtaSection', () => {
  it('renders the heading', () => {
    render(<CtaSection isAuthenticated={false} />);
    expect(screen.getByText('Your next milestone is waiting.')).toBeInTheDocument();
  });

  it('renders "Start your path" CTA linking to /login when not authenticated', () => {
    render(<CtaSection isAuthenticated={false} />);
    const link = screen.getByRole('link', { name: 'Start your path →' });
    expect(link).toHaveAttribute('href', '/login');
  });

  it('renders "Open Dashboard" CTA linking to /dashboard when authenticated', () => {
    render(<CtaSection isAuthenticated={true} />);
    const link = screen.getByRole('link', { name: 'Open Dashboard →' });
    expect(link).toHaveAttribute('href', '/dashboard');
  });

  it('renders the reassurance line', () => {
    render(<CtaSection isAuthenticated={false} />);
    expect(screen.getByText('Free · Open source · Non-commercial · Your data stays yours')).toBeInTheDocument();
  });

  it('renders the section with id="cta"', () => {
    const { container } = render(<CtaSection isAuthenticated={false} />);
    expect(container.querySelector('#cta')).toBeInTheDocument();
  });
});
