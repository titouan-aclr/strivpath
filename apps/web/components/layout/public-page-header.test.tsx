import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PublicPageHeader } from './public-page-header';

vi.mock('next/image', () => ({
  // eslint-disable-next-line @next/next/no-img-element
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}));

vi.mock('next/link', () => ({
  default: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

vi.mock('@/components/language-switcher', () => ({
  LanguageSwitcher: () => <div data-testid="language-switcher" />,
}));

vi.mock('@/components/mode-toggle', () => ({
  ModeToggle: () => <div data-testid="mode-toggle" />,
}));

describe('PublicPageHeader', () => {
  it('renders the StrivPath logo with correct alt text', () => {
    render(<PublicPageHeader />);
    expect(screen.getByAltText('StrivPath logo')).toBeInTheDocument();
  });

  it('renders the brand name', () => {
    render(<PublicPageHeader />);
    expect(screen.getByText('StrivPath')).toBeInTheDocument();
  });

  it('wraps the brand in a link pointing to /', () => {
    render(<PublicPageHeader />);
    const brandLink = screen.getByRole('link');
    expect(brandLink).toHaveAttribute('href', '/');
  });

  it('renders the LanguageSwitcher', () => {
    render(<PublicPageHeader />);
    expect(screen.getByTestId('language-switcher')).toBeInTheDocument();
  });

  it('renders the ModeToggle', () => {
    render(<PublicPageHeader />);
    expect(screen.getByTestId('mode-toggle')).toBeInTheDocument();
  });
});
