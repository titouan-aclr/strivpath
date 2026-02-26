import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Header } from './header';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('next/navigation', () => ({
  usePathname: vi.fn(),
}));

vi.mock('@/components/language-switcher', () => ({
  LanguageSwitcher: () => <div data-testid="language-switcher" />,
}));

vi.mock('@/components/mode-toggle', () => ({
  ModeToggle: () => <div data-testid="mode-toggle" />,
}));

import * as navigation from 'next/navigation';

describe('Header', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(navigation.usePathname).mockReturnValue('/en/dashboard');
  });

  it('should render a header landmark', () => {
    render(<Header onMenuOpen={vi.fn()} />);

    expect(screen.getByRole('banner')).toBeInTheDocument();
  });

  it('should render a burger button with aria-label navigation.openMenu', () => {
    render(<Header onMenuOpen={vi.fn()} />);

    const burgerButton = screen.getByRole('button', { name: 'navigation.openMenu' });
    expect(burgerButton).toBeInTheDocument();
  });

  it('should apply md:hidden class to the burger button', () => {
    render(<Header onMenuOpen={vi.fn()} />);

    const burgerButton = screen.getByRole('button', { name: 'navigation.openMenu' });
    expect(burgerButton).toHaveClass('md:hidden');
  });

  it('should call onMenuOpen when the burger button is clicked', async () => {
    const onMenuOpen = vi.fn();
    const user = userEvent.setup();
    render(<Header onMenuOpen={onMenuOpen} />);

    const burgerButton = screen.getByRole('button', { name: 'navigation.openMenu' });
    await user.click(burgerButton);

    expect(onMenuOpen).toHaveBeenCalledOnce();
  });

  it('should render LanguageSwitcher', () => {
    render(<Header onMenuOpen={vi.fn()} />);

    expect(screen.getByTestId('language-switcher')).toBeInTheDocument();
  });

  it('should render ModeToggle', () => {
    render(<Header onMenuOpen={vi.fn()} />);

    expect(screen.getByTestId('mode-toggle')).toBeInTheDocument();
  });

  it('should render a breadcrumb text element', () => {
    vi.mocked(navigation.usePathname).mockReturnValue('/en/dashboard');
    render(<Header onMenuOpen={vi.fn()} />);

    expect(screen.getByText('dashboard')).toBeInTheDocument();
  });

  it('should render Dashboard breadcrumb for root path', () => {
    vi.mocked(navigation.usePathname).mockReturnValue('/');
    render(<Header onMenuOpen={vi.fn()} />);

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('should render singular label and id for detail routes', () => {
    vi.mocked(navigation.usePathname).mockReturnValue('/en/activities/42');
    render(<Header onMenuOpen={vi.fn()} />);

    expect(screen.getByText('Activity 42')).toBeInTheDocument();
  });

  it('should join segments with slash for nested routes without numeric id', () => {
    vi.mocked(navigation.usePathname).mockReturnValue('/en/sports/running');
    render(<Header onMenuOpen={vi.fn()} />);

    expect(screen.getByText('sports / running')).toBeInTheDocument();
  });
});
