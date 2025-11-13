'use client';

import React, { Component, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

export interface AuthErrorBoundaryTranslations {
  title?: string;
  description?: string;
  tryAgain?: string;
  goToLogin?: string;
}

interface AuthErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  translations?: AuthErrorBoundaryTranslations;
}

interface AuthErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

const DEFAULT_TRANSLATIONS: Required<AuthErrorBoundaryTranslations> = {
  title: 'Authentication Error',
  description: 'An error occurred while processing your authentication. This might be temporary.',
  tryAgain: 'Try Again',
  goToLogin: 'Go to Login',
};

export class AuthErrorBoundary extends Component<AuthErrorBoundaryProps, AuthErrorBoundaryState> {
  private errorCount = 0;
  private resetTimestamp = 0;
  private readonly MAX_ERRORS = 5;
  private readonly RESET_INTERVAL = 10000;

  constructor(props: AuthErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): AuthErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const now = Date.now();
    if (now - this.resetTimestamp < this.RESET_INTERVAL) {
      this.errorCount++;
    } else {
      this.errorCount = 1;
      this.resetTimestamp = now;
    }

    if (this.errorCount >= this.MAX_ERRORS) {
      console.error('[AuthErrorBoundary] Error loop detected - stopping retries', {
        errorCount: this.errorCount,
        error: error.message,
      });
      return;
    }

    console.error('[AuthErrorBoundary] Error caught', {
      error: {
        message: error.message,
        name: error.name,
        stack: error.stack,
      },
      errorInfo: {
        componentStack: errorInfo.componentStack,
      },
      timestamp: new Date().toISOString(),
      errorCount: this.errorCount,
    });

    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  handleGoToLogin = () => {
    window.location.href = '/login';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const t = { ...DEFAULT_TRANSLATIONS, ...this.props.translations };

      return (
        <div className="flex min-h-screen items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-destructive" />
                <CardTitle>{t.title}</CardTitle>
              </div>
              <CardDescription>{t.description}</CardDescription>
            </CardHeader>

            <CardContent>
              <div className="rounded-md bg-muted p-3">
                <code className="text-sm text-muted-foreground">{this.state.error?.message || 'Unknown error'}</code>
              </div>
            </CardContent>

            <CardFooter className="flex gap-2">
              <Button onClick={this.handleRetry} variant="outline" className="flex-1">
                {t.tryAgain}
              </Button>
              <Button onClick={this.handleGoToLogin} className="flex-1">
                {t.goToLogin}
              </Button>
            </CardFooter>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
