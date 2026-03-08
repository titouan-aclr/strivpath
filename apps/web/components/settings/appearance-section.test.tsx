import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppearanceSection } from './appearance-section';

const mockSetTheme = vi.fn();
const mockPush = vi.fn();
const mockRefresh = vi.fn();

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => 'en',
}));

vi.mock('next-themes', () => ({
  useTheme: () => ({
    theme: 'system',
    setTheme: mockSetTheme,
  }),
}));

vi.mock('@/i18n/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
  usePathname: () => '/settings',
}));

describe('AppearanceSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render section title and description', () => {
    render(<AppearanceSection />);

    expect(screen.getByText('title')).toBeInTheDocument();
    expect(screen.getByText('description')).toBeInTheDocument();
  });

  it('should render theme buttons after mount', async () => {
    render(<AppearanceSection />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /theme.light/i })).toBeInTheDocument();
    });
  });

  it('should render theme selector after mount', async () => {
    render(<AppearanceSection />);

    await waitFor(() => {
      expect(screen.getByText('theme.light')).toBeInTheDocument();
      expect(screen.getByText('theme.dark')).toBeInTheDocument();
      expect(screen.getByText('theme.system')).toBeInTheDocument();
    });
  });

  it('should render language selector', () => {
    render(<AppearanceSection />);

    expect(screen.getByText('English')).toBeInTheDocument();
  });

  it('should render all locale options', () => {
    render(<AppearanceSection />);

    expect(screen.getByText('English')).toBeInTheDocument();
  });

  it('should highlight current locale', () => {
    render(<AppearanceSection />);

    const englishButton = screen.getByRole('button', { name: /English/i });
    expect(englishButton).toHaveClass('bg-primary');
  });

  it('should render all theme options after mount', async () => {
    render(<AppearanceSection />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /theme.light/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /theme.dark/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /theme.system/i })).toBeInTheDocument();
    });
  });

  it('should highlight current theme with primary', async () => {
    render(<AppearanceSection />);

    await waitFor(() => {
      const systemButton = screen.getByRole('button', { name: /theme.system/i });
      expect(systemButton).toHaveClass('bg-primary');
    });
  });

  it('should call setTheme when theme button clicked', async () => {
    const user = userEvent.setup();
    render(<AppearanceSection />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /theme.dark/i })).toBeInTheDocument();
    });

    const darkButton = screen.getByRole('button', { name: /theme.dark/i });
    await user.click(darkButton);

    expect(mockSetTheme).toHaveBeenCalledWith('dark');
  });

  it('should call router.push with new locale when changed', async () => {
    const user = userEvent.setup();
    render(<AppearanceSection />);

    const englishButton = screen.getByRole('button', { name: /English/i });
    await user.click(englishButton);

    expect(mockPush).toHaveBeenCalledWith('/settings', { locale: 'en' });
  });

  it('should call router.refresh after locale change', async () => {
    const user = userEvent.setup();
    render(<AppearanceSection />);

    const englishButton = screen.getByRole('button', { name: /English/i });
    await user.click(englishButton);

    expect(mockRefresh).toHaveBeenCalled();
  });

  it('should render language label', () => {
    render(<AppearanceSection />);

    expect(screen.getByText('language.label')).toBeInTheDocument();
  });

  it('should render theme label after mount', async () => {
    render(<AppearanceSection />);

    await waitFor(() => {
      expect(screen.getByText('theme.label')).toBeInTheDocument();
    });
  });

  it('should render flag emoji for locale', () => {
    render(<AppearanceSection />);

    const englishButton = screen.getByRole('button', { name: /English/i });
    expect(englishButton).toHaveTextContent('🇬🇧');
  });

  it('should call setTheme with light when light button clicked', async () => {
    const user = userEvent.setup();
    render(<AppearanceSection />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /theme.light/i })).toBeInTheDocument();
    });

    const lightButton = screen.getByRole('button', { name: /theme.light/i });
    await user.click(lightButton);

    expect(mockSetTheme).toHaveBeenCalledWith('light');
  });

  it('should call setTheme with system when system button clicked', async () => {
    const user = userEvent.setup();
    render(<AppearanceSection />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /theme.system/i })).toBeInTheDocument();
    });

    const systemButton = screen.getByRole('button', { name: /theme.system/i });
    await user.click(systemButton);

    expect(mockSetTheme).toHaveBeenCalledWith('system');
  });
});
