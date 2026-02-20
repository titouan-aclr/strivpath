import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PoweredByStrava } from './powered-by-strava';

let mockResolvedTheme = 'light';

vi.mock('next-themes', () => ({
  useTheme: () => ({ resolvedTheme: mockResolvedTheme }),
}));

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

/* eslint-disable @next/next/no-img-element */
vi.mock('next/image', () => ({
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => <img {...props} />,
}));

describe('PoweredByStrava', () => {
  beforeEach(() => {
    mockResolvedTheme = 'light';
  });

  it('should render a link to strava.com', () => {
    render(<PoweredByStrava />);

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', 'https://www.strava.com');
  });

  it('should open link in new tab', () => {
    render(<PoweredByStrava />);

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('should have aria-label', () => {
    render(<PoweredByStrava />);

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('aria-label', 'alt');
  });

  it('should render orange logo in light mode', () => {
    mockResolvedTheme = 'light';
    render(<PoweredByStrava />);

    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', '/strava/api_logo_pwrdBy_strava_horiz_orange.svg');
  });

  it('should render white logo in dark mode', () => {
    mockResolvedTheme = 'dark';
    render(<PoweredByStrava />);

    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', '/strava/api_logo_pwrdBy_strava_horiz_white.svg');
  });

  it('should render image with correct dimensions', () => {
    render(<PoweredByStrava />);

    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('width', '146');
    expect(img).toHaveAttribute('height', '15');
  });

  it('should have alt text', () => {
    render(<PoweredByStrava />);

    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('alt', 'alt');
  });

  it('should have opacity hover effect on link', () => {
    render(<PoweredByStrava />);

    const link = screen.getByRole('link');
    expect(link).toHaveClass('opacity-70');
    expect(link.className).toContain('hover:opacity-100');
  });
});
