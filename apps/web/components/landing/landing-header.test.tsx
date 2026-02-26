import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LandingHeader } from './landing-header';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const messages: Record<string, string> = {
      features: 'Features',
      howItWorks: 'How it works',
      openSource: 'Open Source',
      getStarted: 'Get Started',
      openDashboard: 'Open Dashboard',
      openMenu: 'Open navigation menu',
      mobileNavTitle: 'Navigation',
    };
    return messages[key] ?? key;
  },
}));

vi.mock('next/image', () => ({
  default: ({ alt, ...props }: React.ImgHTMLAttributes<HTMLImageElement> & { alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={alt} {...props} />
  ),
}));

vi.mock('motion/react', () => ({
  useScroll: () => ({ scrollY: { on: vi.fn() } }),
  useMotionValueEvent: vi.fn(),
}));

vi.mock('@/components/mode-toggle', () => ({
  ModeToggle: () => <button aria-label="Toggle theme" />,
}));

vi.mock('@/components/language-switcher', () => ({
  LanguageSwitcher: () => <button aria-label="Change language" />,
}));

vi.mock('@/components/ui/sheet', () => ({
  Sheet: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SheetTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SheetContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SheetTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe('LandingHeader', () => {
  it('shows "Get Started" CTA when not authenticated', () => {
    render(<LandingHeader isAuthenticated={false} />);
    const ctaLinks = screen.getAllByRole('link', { name: 'Get Started' });
    expect(ctaLinks.length).toBeGreaterThan(0);
    ctaLinks.forEach(link => expect(link).toHaveAttribute('href', '/login'));
  });

  it('shows "Open Dashboard" CTA when authenticated', () => {
    render(<LandingHeader isAuthenticated={true} />);
    const ctaLinks = screen.getAllByRole('link', { name: 'Open Dashboard' });
    expect(ctaLinks.length).toBeGreaterThan(0);
    ctaLinks.forEach(link => expect(link).toHaveAttribute('href', '/dashboard'));
  });

  it('renders navigation links', () => {
    render(<LandingHeader isAuthenticated={false} />);
    expect(screen.getAllByRole('link', { name: 'Features' }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('link', { name: 'How it works' }).length).toBeGreaterThan(0);
  });

  it('renders the logo', () => {
    render(<LandingHeader isAuthenticated={false} />);
    expect(screen.getByRole('link', { name: /strivpath/i })).toBeInTheDocument();
  });

  it('renders the logo image', () => {
    render(<LandingHeader isAuthenticated={false} />);
    expect(screen.getByAltText('StrivPath logo')).toBeInTheDocument();
  });

  it('renders the Open Source link', () => {
    render(<LandingHeader isAuthenticated={false} />);
    const links = screen.getAllByRole('link', { name: /open source/i });
    expect(links.length).toBeGreaterThan(0);
  });

  it('renders the language switcher', () => {
    render(<LandingHeader isAuthenticated={false} />);
    const langButtons = screen.getAllByRole('button', { name: 'Change language' });
    expect(langButtons.length).toBeGreaterThan(0);
  });
});
