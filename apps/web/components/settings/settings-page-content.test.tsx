import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SettingsPageContent } from './settings-page-content';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('./profile-section', () => ({
  ProfileSection: () => <div data-testid="profile-section">ProfileSection</div>,
}));

vi.mock('./sports-section', () => ({
  SportsSection: () => <div data-testid="sports-section">SportsSection</div>,
}));

vi.mock('./sync-section', () => ({
  SyncSection: () => <div data-testid="sync-section">SyncSection</div>,
}));

vi.mock('./appearance-section', () => ({
  AppearanceSection: () => <div data-testid="appearance-section">AppearanceSection</div>,
}));

vi.mock('./session-section', () => ({
  SessionSection: () => <div data-testid="session-section">SessionSection</div>,
}));

vi.mock('./danger-zone-section', () => ({
  DangerZoneSection: () => <div data-testid="danger-zone-section">DangerZoneSection</div>,
}));

describe('SettingsPageContent', () => {
  it('should render page title', () => {
    render(<SettingsPageContent />);

    expect(screen.getByText('title')).toBeInTheDocument();
  });

  it('should render page description', () => {
    render(<SettingsPageContent />);

    expect(screen.getByText('description')).toBeInTheDocument();
  });

  it('should render all settings sections', () => {
    render(<SettingsPageContent />);

    expect(screen.getByTestId('profile-section')).toBeInTheDocument();
    expect(screen.getByTestId('sports-section')).toBeInTheDocument();
    expect(screen.getByTestId('sync-section')).toBeInTheDocument();
    expect(screen.getByTestId('appearance-section')).toBeInTheDocument();
    expect(screen.getByTestId('session-section')).toBeInTheDocument();
    expect(screen.getByTestId('danger-zone-section')).toBeInTheDocument();
  });

  it('should render sections in correct order', () => {
    const { container } = render(<SettingsPageContent />);

    const sections = container.querySelectorAll('[data-testid]');
    const sectionOrder = Array.from(sections).map(s => s.getAttribute('data-testid'));

    expect(sectionOrder).toEqual([
      'profile-section',
      'sports-section',
      'sync-section',
      'appearance-section',
      'session-section',
      'danger-zone-section',
    ]);
  });
});
