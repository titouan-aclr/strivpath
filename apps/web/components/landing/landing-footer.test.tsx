import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LandingFooter } from './landing-footer';
import type { LegalLinks } from '@/lib/legal/legal-links';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const messages: Record<string, string> = {
      tagline: 'Built for athletes who want to grow, not compete.',
      github: 'GitHub',
      legalNotice: 'Legal Notice',
      privacy: 'Privacy Policy',
      terms: 'Terms',
      disclaimer: 'Not affiliated with Strava, Inc.',
      nonCommercial: 'Non-commercial open source project. Your Strava data is never sold or shared.',
      copyright: '© 2026 StrivPath',
    };
    return messages[key] ?? key;
  },
  useLocale: () => 'en',
}));

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

const mockGetLegalLinks = vi.fn<() => LegalLinks>();
vi.mock('@/lib/legal/legal-links', () => ({
  getLegalLinks: () => mockGetLegalLinks(),
}));

describe('LandingFooter', () => {
  beforeEach(() => {
    mockGetLegalLinks.mockReset();
  });

  it('renders the logo link, tagline and GitHub link', () => {
    mockGetLegalLinks.mockReturnValue({ privacy: '/privacy', terms: '/terms', legalNotice: '/legal' });
    render(<LandingFooter />);
    expect(screen.getByAltText('StrivPath logo')).toBeInTheDocument();
    expect(screen.getByText('Built for athletes who want to grow, not compete.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'GitHub' })).toBeInTheDocument();
  });

  it('renders all three legal links when getLegalLinks succeeds', () => {
    mockGetLegalLinks.mockReturnValue({
      legalNotice: 'https://example.com/legal',
      privacy: 'https://example.com/privacy',
      terms: 'https://example.com/terms',
    });
    render(<LandingFooter />);
    expect(screen.getByRole('link', { name: 'Legal Notice' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Privacy Policy' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Terms' })).toBeInTheDocument();
  });

  it('renders without crash and hides legal links when getLegalLinks throws', () => {
    mockGetLegalLinks.mockImplementation(() => {
      throw new Error('NEXT_PUBLIC_LEGAL_BASE_URL is not set');
    });
    expect(() => render(<LandingFooter />)).not.toThrow();
    expect(screen.queryByRole('link', { name: 'Privacy Policy' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Terms' })).not.toBeInTheDocument();
  });

  it('renders disclaimer and copyright', () => {
    mockGetLegalLinks.mockImplementation(() => {
      throw new Error();
    });
    render(<LandingFooter />);
    expect(screen.getByText('Not affiliated with Strava, Inc.')).toBeInTheDocument();
    expect(screen.getByText('© 2026 StrivPath')).toBeInTheDocument();
  });
});
