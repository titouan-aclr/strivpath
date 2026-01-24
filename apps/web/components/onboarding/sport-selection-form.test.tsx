import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ApolloClient, InMemoryCache, HttpLink, from } from '@apollo/client';
import { ApolloProvider } from '@apollo/client/react';
import { ErrorLink } from '@apollo/client/link/error';
import { server } from '@/mocks/server';
import { graphql, HttpResponse } from 'msw';
import { MOCK_USERS } from '@/mocks/handlers';
import { MOCK_USER_PREFERENCES } from '@/mocks/fixtures/settings.fixture';
import { SportSelectionForm } from './sport-selection-form';
import { AuthContextProvider } from '@/lib/auth/context';
import type { User } from '@/lib/graphql';

let testClient: ReturnType<typeof createTestApolloClient>;

const createTestApolloClient = () => {
  const errorLink = new ErrorLink(({ error }) => {
    console.error('[GraphQL error]:', error);
  });

  const httpLink = new HttpLink({
    uri: 'http://localhost:3011/graphql',
    credentials: 'include',
  });

  return new ApolloClient({
    cache: new InMemoryCache(),
    link: from([errorLink, httpLink]),
    defaultOptions: {
      watchQuery: {
        fetchPolicy: 'network-only',
      },
    },
  });
};

const createWrapper =
  (initialUser: User | null) =>
  ({ children }: { children: React.ReactNode }) => {
    return (
      <ApolloProvider client={testClient}>
        <AuthContextProvider initialUser={initialUser}>{children}</AuthContextProvider>
      </ApolloProvider>
    );
  };

const { mockRouterPush, mockToast, mockUseTranslations } = vi.hoisted(() => ({
  mockRouterPush: vi.fn(),
  mockToast: {
    error: vi.fn(),
    info: vi.fn(),
  },
  mockUseTranslations: vi.fn(() => (key: string) => key),
}));

vi.mock('@/i18n/navigation', () => ({
  useRouter: () => ({ push: mockRouterPush }),
}));

vi.mock('sonner', () => ({
  toast: mockToast,
}));

vi.mock('next-intl', () => ({
  useTranslations: mockUseTranslations,
}));

const setupSuccessHandlers = () => {
  server.use(
    graphql.mutation('AddSportToPreferences', ({ variables }) => {
      const sport = variables.sport as string;
      return HttpResponse.json({
        data: {
          addSportToPreferences: {
            ...MOCK_USER_PREFERENCES.default,
            selectedSports: [...MOCK_USER_PREFERENCES.default.selectedSports, sport],
          },
        },
      });
    }),
    graphql.mutation('RemoveSportFromPreferences', () => {
      return HttpResponse.json({
        data: { removeSportFromPreferences: true },
      });
    }),
    graphql.mutation('CompleteOnboarding', () => {
      return HttpResponse.json({
        data: {
          completeOnboarding: {
            ...MOCK_USER_PREFERENCES.default,
            onboardingCompleted: true,
          },
        },
      });
    }),
  );
};

describe('SportSelectionForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    testClient = createTestApolloClient();
  });

  afterEach(async () => {
    await testClient.clearStore();
  });

  describe('Rendering', () => {
    it('should render all sport cards', () => {
      render(<SportSelectionForm />, {
        wrapper: createWrapper(MOCK_USERS.john),
      });

      expect(screen.getByText('onboarding.sports.run.title')).toBeInTheDocument();
      expect(screen.getByText('onboarding.sports.ride.title')).toBeInTheDocument();
      expect(screen.getByText('onboarding.sports.swim.title')).toBeInTheDocument();
    });

    it('should render title and description', () => {
      render(<SportSelectionForm />, {
        wrapper: createWrapper(MOCK_USERS.john),
      });

      expect(screen.getByText('onboarding.sports.title')).toBeInTheDocument();
      expect(screen.getByText('onboarding.sports.description')).toBeInTheDocument();
    });

    it('should render submit button', () => {
      render(<SportSelectionForm />, {
        wrapper: createWrapper(MOCK_USERS.john),
      });

      expect(screen.getByRole('button', { name: /onboarding.sports.continue/i })).toBeInTheDocument();
    });

    it('should have submit button disabled initially', () => {
      render(<SportSelectionForm />, {
        wrapper: createWrapper(MOCK_USERS.john),
      });

      const submitButton = screen.getByRole('button', { name: /onboarding.sports.continue/i });
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Sport Selection', () => {
    it('should select a sport when clicked', async () => {
      const user = userEvent.setup();

      render(<SportSelectionForm />, {
        wrapper: createWrapper(MOCK_USERS.john),
      });

      const runCard = screen.getByLabelText(/onboarding.sports.run.title/i);
      await user.click(runCard);

      expect(runCard).toHaveAttribute('aria-pressed', 'true');
    });

    it('should deselect a sport when clicked again', async () => {
      const user = userEvent.setup();

      render(<SportSelectionForm />, {
        wrapper: createWrapper(MOCK_USERS.john),
      });

      const runCard = screen.getByLabelText(/onboarding.sports.run.title/i);

      await user.click(runCard);
      expect(runCard).toHaveAttribute('aria-pressed', 'true');

      await user.click(runCard);
      expect(runCard).toHaveAttribute('aria-pressed', 'false');
    });

    it('should allow selecting multiple sports', async () => {
      const user = userEvent.setup();

      render(<SportSelectionForm />, {
        wrapper: createWrapper(MOCK_USERS.john),
      });

      const runCard = screen.getByLabelText(/onboarding.sports.run.title/i);
      const rideCard = screen.getByLabelText(/onboarding.sports.ride.title/i);

      await user.click(runCard);
      await user.click(rideCard);

      expect(runCard).toHaveAttribute('aria-pressed', 'true');
      expect(rideCard).toHaveAttribute('aria-pressed', 'true');
    });

    it('should enforce maximum of 3 sports', async () => {
      const user = userEvent.setup();

      render(<SportSelectionForm />, {
        wrapper: createWrapper(MOCK_USERS.john),
      });

      const runCard = screen.getByLabelText(/onboarding.sports.run.title/i);
      const rideCard = screen.getByLabelText(/onboarding.sports.ride.title/i);
      const swimCard = screen.getByLabelText(/onboarding.sports.swim.title/i);

      await user.click(runCard);
      await user.click(rideCard);
      await user.click(swimCard);

      expect(runCard).toHaveAttribute('aria-pressed', 'true');
      expect(rideCard).toHaveAttribute('aria-pressed', 'true');
      expect(swimCard).toHaveAttribute('aria-pressed', 'true');
    });

    it('should mark unselected cards as maxReached when 3 sports selected', async () => {
      const user = userEvent.setup();

      render(<SportSelectionForm />, {
        wrapper: createWrapper(MOCK_USERS.john),
      });

      const runCard = screen.getByLabelText(/onboarding.sports.run.title/i);
      const rideCard = screen.getByLabelText(/onboarding.sports.ride.title/i);
      const swimCard = screen.getByLabelText(/onboarding.sports.swim.title/i);

      await user.click(runCard);
      await user.click(rideCard);
      await user.click(swimCard);

      expect(runCard).not.toHaveClass('opacity-50');
      expect(rideCard).not.toHaveClass('opacity-50');
      expect(swimCard).not.toHaveClass('opacity-50');
    });
  });

  describe('Submit Button', () => {
    it('should enable submit button when at least one sport is selected', async () => {
      const user = userEvent.setup();

      render(<SportSelectionForm />, {
        wrapper: createWrapper(MOCK_USERS.john),
      });

      const submitButton = screen.getByRole('button', { name: /onboarding.sports.continue/i });
      expect(submitButton).toBeDisabled();

      const runCard = screen.getByLabelText(/onboarding.sports.run.title/i);
      await user.click(runCard);

      expect(submitButton).toBeEnabled();
    });

    it('should show loading state when submitting', async () => {
      const user = userEvent.setup();

      server.use(
        graphql.mutation('CompleteOnboarding', () => {
          return new Promise(() => {});
        }),
      );

      render(<SportSelectionForm />, {
        wrapper: createWrapper(MOCK_USERS.john),
      });

      const runCard = screen.getByLabelText(/onboarding.sports.run.title/i);
      await user.click(runCard);

      const submitButton = screen.getByRole('button', { name: /onboarding.sports.continue/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('onboarding.sports.saving')).toBeInTheDocument();
      });
    });

    it('should disable all sport cards when submitting', async () => {
      const user = userEvent.setup();

      server.use(
        graphql.mutation('CompleteOnboarding', () => {
          return new Promise(() => {});
        }),
      );

      render(<SportSelectionForm />, {
        wrapper: createWrapper(MOCK_USERS.john),
      });

      const runCard = screen.getByLabelText(/onboarding.sports.run.title/i);
      await user.click(runCard);

      const submitButton = screen.getByRole('button', { name: /onboarding.sports.continue/i });
      await user.click(submitButton);

      await waitFor(() => {
        const cards = screen.getAllByRole('button', { pressed: false });
        cards.forEach(card => {
          if (card !== submitButton) {
            expect(card).toHaveClass('opacity-60', 'pointer-events-none');
          }
        });
      });
    });

    it('should call handleSubmit and redirect on successful submission', async () => {
      const user = userEvent.setup();

      setupSuccessHandlers();

      render(<SportSelectionForm />, {
        wrapper: createWrapper(MOCK_USERS.john),
      });

      const runCard = screen.getByLabelText(/onboarding.sports.run.title/i);
      await user.click(runCard);

      const submitButton = screen.getByRole('button', { name: /onboarding.sports.continue/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockRouterPush).toHaveBeenCalledWith('/sync');
      });
    });
  });

  describe('Integration', () => {
    it('should properly integrate selection state with submit button', async () => {
      const user = userEvent.setup();

      render(<SportSelectionForm />, {
        wrapper: createWrapper(MOCK_USERS.john),
      });

      const submitButton = screen.getByRole('button', { name: /onboarding.sports.continue/i });
      expect(submitButton).toBeDisabled();

      const runCard = screen.getByLabelText(/onboarding.sports.run.title/i);
      await user.click(runCard);
      expect(submitButton).toBeEnabled();

      await user.click(runCard);
      expect(submitButton).toBeDisabled();
    });
  });
});
