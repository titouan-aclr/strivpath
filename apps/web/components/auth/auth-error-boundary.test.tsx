import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthErrorBoundary } from './auth-error-boundary';

const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>Success</div>;
};

describe('AuthErrorBoundary', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('should render children when no error', () => {
    render(
      <AuthErrorBoundary>
        <div>Test content</div>
      </AuthErrorBoundary>,
    );

    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('should display fallback when child throws error', () => {
    render(
      <AuthErrorBoundary>
        <ThrowError shouldThrow={true} />
      </AuthErrorBoundary>,
    );

    expect(screen.getByText('Authentication Error')).toBeInTheDocument();
    expect(screen.getByText('Test error')).toBeInTheDocument();
  });

  it('should reset boundary on retry button click', async () => {
    const user = userEvent.setup();

    let shouldThrow = true;
    const ConditionalThrow = () => {
      if (shouldThrow) {
        throw new Error('Test error');
      }
      return <div>Success</div>;
    };

    render(
      <AuthErrorBoundary>
        <ConditionalThrow />
      </AuthErrorBoundary>,
    );

    expect(screen.getByText('Authentication Error')).toBeInTheDocument();

    shouldThrow = false;

    const retryButton = screen.getByRole('button', { name: /try again/i });
    await user.click(retryButton);

    expect(screen.getByText('Success')).toBeInTheDocument();
  });

  it('should use custom fallback if provided', () => {
    const CustomFallback = () => <div>Custom Error</div>;

    render(
      <AuthErrorBoundary fallback={<CustomFallback />}>
        <ThrowError shouldThrow={true} />
      </AuthErrorBoundary>,
    );

    expect(screen.getByText('Custom Error')).toBeInTheDocument();
    expect(screen.queryByText('Authentication Error')).not.toBeInTheDocument();
  });

  it('should use default English translations', () => {
    render(
      <AuthErrorBoundary>
        <ThrowError shouldThrow={true} />
      </AuthErrorBoundary>,
    );

    expect(screen.getByText('Authentication Error')).toBeInTheDocument();
    expect(
      screen.getByText('An error occurred while processing your authentication. This might be temporary.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try Again' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Go to Login' })).toBeInTheDocument();
  });

  it('should use custom translations when provided', () => {
    const customTranslations = {
      title: "Erreur d'authentification",
      description: 'Une erreur est survenue. Ceci peut être temporaire.',
      tryAgain: 'Réessayer',
      goToLogin: 'Aller à la connexion',
    };

    render(
      <AuthErrorBoundary translations={customTranslations}>
        <ThrowError shouldThrow={true} />
      </AuthErrorBoundary>,
    );

    expect(screen.getByText("Erreur d'authentification")).toBeInTheDocument();
    expect(screen.getByText('Une erreur est survenue. Ceci peut être temporaire.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Réessayer' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Aller à la connexion' })).toBeInTheDocument();
  });

  it('should merge custom translations with default fallbacks', () => {
    const partialTranslations = {
      title: 'Custom Title',
    };

    render(
      <AuthErrorBoundary translations={partialTranslations}>
        <ThrowError shouldThrow={true} />
      </AuthErrorBoundary>,
    );

    expect(screen.getByText('Custom Title')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try Again' })).toBeInTheDocument();
  });

  it('should call onError callback with error details', () => {
    const onError = vi.fn();

    render(
      <AuthErrorBoundary onError={onError}>
        <ThrowError shouldThrow={true} />
      </AuthErrorBoundary>,
    );

    expect(onError).toHaveBeenCalled();
    const [[error, errorInfo]] = onError.mock.calls;
    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toBe('Test error');
    expect(errorInfo).toHaveProperty('componentStack');
    expect(typeof (errorInfo as React.ErrorInfo).componentStack).toBe('string');
  });

  it('should not reset when children props change', () => {
    const { rerender } = render(
      <AuthErrorBoundary>
        <ThrowError shouldThrow={true} />
      </AuthErrorBoundary>,
    );

    expect(screen.getByText('Authentication Error')).toBeInTheDocument();

    rerender(
      <AuthErrorBoundary>
        <ThrowError shouldThrow={true} />
      </AuthErrorBoundary>,
    );

    expect(screen.getByText('Authentication Error')).toBeInTheDocument();
  });
});
