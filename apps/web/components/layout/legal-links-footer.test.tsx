import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LegalLinksFooter } from './legal-links-footer';
import type { LegalLinks } from '@/lib/legal/legal-links';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const messages: Record<string, string> = {
      legalNotice: 'Legal Notice',
      privacy: 'Privacy Policy',
      terms: 'Terms of Use',
    };
    return messages[key] ?? key;
  },
  useLocale: () => 'en',
}));

const mockGetLegalLinks = vi.fn<() => LegalLinks>();
vi.mock('@/lib/legal/legal-links', () => ({
  getLegalLinks: () => mockGetLegalLinks(),
}));

describe('LegalLinksFooter', () => {
  beforeEach(() => {
    mockGetLegalLinks.mockReset();
  });

  it('renders a <footer> landmark with all three legal links', () => {
    mockGetLegalLinks.mockReturnValue({
      legalNotice: 'https://example.com/legal-notice',
      privacy: 'https://example.com/strivpath/privacy',
      terms: 'https://example.com/strivpath/terms',
    });
    render(<LegalLinksFooter />);

    expect(screen.getByRole('contentinfo')).toBeInTheDocument();

    const legalNoticeLink = screen.getByRole('link', { name: 'Legal Notice' });
    expect(legalNoticeLink).toHaveAttribute('href', 'https://example.com/legal-notice');
    expect(legalNoticeLink).toHaveAttribute('target', '_blank');

    const privacyLink = screen.getByRole('link', { name: 'Privacy Policy' });
    expect(privacyLink).toHaveAttribute('href', 'https://example.com/strivpath/privacy');
    expect(privacyLink).toHaveAttribute('target', '_blank');

    const termsLink = screen.getByRole('link', { name: 'Terms of Use' });
    expect(termsLink).toHaveAttribute('href', 'https://example.com/strivpath/terms');
    expect(termsLink).toHaveAttribute('target', '_blank');
  });

  it('renders null when getLegalLinks throws', () => {
    mockGetLegalLinks.mockImplementation(() => {
      throw new Error('NEXT_PUBLIC_LEGAL_BASE_URL is not set');
    });
    const { container } = render(<LegalLinksFooter />);
    expect(container).toBeEmptyDOMElement();
  });

  it('does not render any links when getLegalLinks throws', () => {
    mockGetLegalLinks.mockImplementation(() => {
      throw new Error();
    });
    render(<LegalLinksFooter />);
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });
});
