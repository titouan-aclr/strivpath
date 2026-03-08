import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MobileNav } from './mobile-nav';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('next/image', () => ({
  // eslint-disable-next-line @next/next/no-img-element
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}));

vi.mock('@/i18n/navigation', () => ({
  Link: ({
    href,
    children,
    onClick,
    className,
  }: {
    href: string;
    children: React.ReactNode;
    onClick?: () => void;
    className?: string;
  }) => (
    <a href={href} className={className} onClick={onClick}>
      {children}
    </a>
  ),
}));

vi.mock('./user-menu', () => ({
  UserMenu: () => <div data-testid="user-menu" />,
}));

vi.mock('./sidebar-nav-content', () => ({
  SidebarNavContent: ({ onNavigate }: { onNavigate?: () => void }) => (
    <div data-testid="sidebar-nav-content" onClick={onNavigate} />
  ),
}));

describe('MobileNav', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not render nav content when open is false', () => {
    render(<MobileNav open={false} onOpenChange={vi.fn()} />);

    expect(screen.queryByTestId('sidebar-nav-content')).not.toBeInTheDocument();
    expect(screen.queryByTestId('user-menu')).not.toBeInTheDocument();
  });

  it('should show the logo image with correct alt text when open is true', () => {
    render(<MobileNav open={true} onOpenChange={vi.fn()} />);

    expect(screen.getByAltText('StrivPath logo')).toBeInTheDocument();
  });

  it('should show the app name when open is true', () => {
    render(<MobileNav open={true} onOpenChange={vi.fn()} />);

    expect(screen.getByText('common.appName')).toBeInTheDocument();
  });

  it('should have the logo link pointing to /dashboard', () => {
    render(<MobileNav open={true} onOpenChange={vi.fn()} />);

    const logoLink = screen.getByRole('link', { name: /strivpath logo/i });
    expect(logoLink).toHaveAttribute('href', '/dashboard');
  });

  it('should render SidebarNavContent when open is true', () => {
    render(<MobileNav open={true} onOpenChange={vi.fn()} />);

    expect(screen.getByTestId('sidebar-nav-content')).toBeInTheDocument();
  });

  it('should render UserMenu when open is true', () => {
    render(<MobileNav open={true} onOpenChange={vi.fn()} />);

    expect(screen.getByTestId('user-menu')).toBeInTheDocument();
  });

  it('should call onOpenChange(false) when SidebarNavContent fires onNavigate', async () => {
    const onOpenChange = vi.fn();
    const user = userEvent.setup();
    render(<MobileNav open={true} onOpenChange={onOpenChange} />);

    await user.click(screen.getByTestId('sidebar-nav-content'));

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('should call onOpenChange(false) when the logo link is clicked', async () => {
    const onOpenChange = vi.fn();
    const user = userEvent.setup();
    render(<MobileNav open={true} onOpenChange={onOpenChange} />);

    const logoLink = screen.getByRole('link', { name: /strivpath logo/i });
    await user.click(logoLink);

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('should render the sheet title with sr-only class', () => {
    render(<MobileNav open={true} onOpenChange={vi.fn()} />);

    const title = screen.getByText('navigation.mobileNavTitle');
    expect(title).toHaveClass('sr-only');
  });
});
