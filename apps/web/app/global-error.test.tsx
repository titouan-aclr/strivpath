import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import GlobalError from './global-error';

vi.mock('./globals.css', () => ({}));

describe('GlobalError', () => {
  const mockReset = vi.fn();
  const mockError = new Error('Test error');

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('renders error title and description', () => {
    render(<GlobalError error={mockError} reset={mockReset} />);

    expect(screen.getByText('Failed to load application')).toBeInTheDocument();
    expect(screen.getByText('An unexpected error occurred. Please try again.')).toBeInTheDocument();
  });

  it('renders network error message when fetch fails', () => {
    const networkError = new Error('fetch failed');
    render(<GlobalError error={networkError} reset={mockReset} />);

    expect(
      screen.getByText('Unable to connect to the server. Please check your connection and try again.'),
    ).toBeInTheDocument();
  });

  it('renders network error message for ECONNREFUSED', () => {
    const networkError = new Error('ECONNREFUSED');
    render(<GlobalError error={networkError} reset={mockReset} />);

    expect(
      screen.getByText('Unable to connect to the server. Please check your connection and try again.'),
    ).toBeInTheDocument();
  });

  it('displays error digest when provided', () => {
    const errorWithDigest = Object.assign(new Error('Test error'), { digest: 'abc123' });
    render(<GlobalError error={errorWithDigest} reset={mockReset} />);

    expect(screen.getByText('Error ID: abc123')).toBeInTheDocument();
  });

  it('does not display error digest when not provided', () => {
    render(<GlobalError error={mockError} reset={mockReset} />);

    expect(screen.queryByText(/Error ID:/)).not.toBeInTheDocument();
  });

  it('calls reset when retry button is clicked', () => {
    render(<GlobalError error={mockError} reset={mockReset} />);

    fireEvent.click(screen.getByRole('button', { name: /retry/i }));

    expect(mockReset).toHaveBeenCalledTimes(1);
  });

  it('navigates to home when home button is clicked', () => {
    const originalLocation = window.location;
    const mockLocation = { href: '' };
    Object.defineProperty(window, 'location', {
      value: mockLocation,
      writable: true,
    });

    render(<GlobalError error={mockError} reset={mockReset} />);
    fireEvent.click(screen.getByRole('button', { name: /home/i }));

    expect(mockLocation.href).toBe('/');

    Object.defineProperty(window, 'location', {
      value: originalLocation,
      writable: true,
    });
  });

  it('logs error to console', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(<GlobalError error={mockError} reset={mockReset} />);

    expect(consoleSpy).toHaveBeenCalledWith('Global error:', mockError);
  });

  it('renders with proper accessibility attributes', () => {
    const { container } = render(<GlobalError error={mockError} reset={mockReset} />);

    const icon = container.querySelector('[aria-hidden="true"]');
    expect(icon).toBeInTheDocument();
  });

  it('has destructive border styling on card', () => {
    const { container } = render(<GlobalError error={mockError} reset={mockReset} />);

    const card = container.querySelector('.border-destructive');
    expect(card).toBeInTheDocument();
  });
});
