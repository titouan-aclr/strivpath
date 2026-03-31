'use client';

import { useEffect } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import './globals.css';

const errorMessages = {
  title: 'Failed to load application',
  description: 'An unexpected error occurred. Please try again.',
  networkDescription: 'Unable to connect to the server. Please check your connection and try again.',
  retry: 'Retry',
  home: 'Home',
};

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('Global error:', error);
  }, [error]);

  const isNetworkError = error.message.includes('fetch failed') || error.message.includes('ECONNREFUSED');

  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background antialiased">
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="border-destructive max-w-md w-full">
            <CardContent className="py-8">
              <div className="flex flex-col items-center gap-4 text-center">
                <AlertCircle className="h-12 w-12 text-destructive" aria-hidden="true" />
                <div>
                  <p className="font-medium text-destructive mb-1">{errorMessages.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {isNetworkError ? errorMessages.networkDescription : errorMessages.description}
                  </p>
                  {error.digest && (
                    <p className="mt-2 text-xs text-muted-foreground opacity-70">Error ID: {error.digest}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => reset()} variant="outline" size="lg">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    {errorMessages.retry}
                  </Button>
                  <Button onClick={() => (window.location.href = '/')} variant="ghost" size="lg">
                    <Home className="mr-2 h-4 w-4" />
                    {errorMessages.home}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </body>
    </html>
  );
}
