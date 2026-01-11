import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ApolloClient, InMemoryCache, HttpLink, from } from '@apollo/client';
import { ApolloProvider } from '@apollo/client/react';
import { ErrorLink } from '@apollo/client/link/error';
import NewGoalPage from './page';
import { GoalTargetType, GoalPeriodType, SportType } from '@/gql/graphql';

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
  () =>
  ({ children }: { children: React.ReactNode }) => {
    return <ApolloProvider client={testClient}>{children}</ApolloProvider>;
  };

const { mockRouterPush, mockToast, mockUseTranslations, mockCreateGoal } = vi.hoisted(() => ({
  mockRouterPush: vi.fn(),
  mockToast: {
    success: vi.fn(),
    error: vi.fn(),
  },
  mockUseTranslations: vi.fn((namespace?: string) => (key: string, values?: Record<string, string | number>) => {
    const fullKey = namespace ? `${namespace}.${key}` : key;
    if (values) {
      return `${fullKey}:${JSON.stringify(values)}`;
    }
    return fullKey;
  }),
  mockCreateGoal: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockRouterPush }),
}));

vi.mock('sonner', () => ({
  toast: mockToast,
}));

vi.mock('next-intl', () => ({
  useTranslations: mockUseTranslations,
  useLocale: () => 'en',
}));

const mockTemplates = [
  {
    id: '1',
    title: 'Run 50km this month',
    description: 'Classic goal for regular runners',
    category: 'intermediate',
    targetType: GoalTargetType.Distance,
    targetValue: 50,
    periodType: GoalPeriodType.Monthly,
    sportType: SportType.Run,
    isPreset: true,
    createdAt: '2025-12-29T11:21:37.045Z',
  },
  {
    id: '2',
    title: '3 workouts per week',
    description: 'Sustained pace for regular athletes',
    category: 'intermediate',
    targetType: GoalTargetType.Frequency,
    targetValue: 3,
    periodType: GoalPeriodType.Weekly,
    sportType: null,
    isPreset: true,
    createdAt: '2025-12-29T11:21:37.054Z',
  },
];

vi.mock('@/lib/goals/use-goal-templates', () => ({
  useGoalTemplates: () => ({
    templates: mockTemplates,
    loading: false,
    error: null,
  }),
}));

vi.mock('@/lib/goals/use-goal-mutations', () => ({
  useCreateGoal: () => ({
    createGoal: mockCreateGoal,
    loading: false,
    error: null,
  }),
}));

describe('NewGoalPage - Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    testClient = createTestApolloClient();

    // Configure mockCreateGoal to simulate the real hook behavior
    mockCreateGoal.mockImplementation(input => {
      // Simulate success: call toast.success and router.push like the real hook does
      mockToast.success('goals.create.success');
      mockRouterPush('/goals');
      return Promise.resolve({
        id: '1',
        title: input.title || 'Test Goal',
      });
    });
  });

  describe('Step 1: Template Selection', () => {
    it('should render template selector on initial load', () => {
      render(<NewGoalPage />, { wrapper: createWrapper() });

      expect(screen.getByText('goals.create.templateSelector.title')).toBeInTheDocument();
      expect(screen.getByText('goals.create.templateSelector.description')).toBeInTheDocument();
    });

    it('should display custom goal option', () => {
      render(<NewGoalPage />, { wrapper: createWrapper() });

      expect(screen.getByText('goals.create.templateSelector.custom.title')).toBeInTheDocument();
    });

    it('should display all available templates', () => {
      render(<NewGoalPage />, { wrapper: createWrapper() });

      expect(screen.getByText('Run 50km this month')).toBeInTheDocument();
      expect(screen.getByText('3 workouts per week')).toBeInTheDocument();
    });

    it('should show progress indicator with step 1 active', () => {
      render(<NewGoalPage />, { wrapper: createWrapper() });

      expect(screen.getByText('goals.create.steps.template')).toBeInTheDocument();
    });
  });

  describe('Step 2: Template to Form Navigation', () => {
    it('should navigate to form when template is selected', async () => {
      const user = userEvent.setup();
      render(<NewGoalPage />, { wrapper: createWrapper() });

      const templateCard = screen.getByText('Run 50km this month').closest('div[role="button"]');
      expect(templateCard).toBeInTheDocument();

      await user.click(templateCard!);

      await waitFor(() => {
        expect(screen.getByText('goals.create.form.title')).toBeInTheDocument();
        expect(screen.getByText('goals.create.steps.details')).toBeInTheDocument();
      });
    });

    it('should pre-fill form with template data', async () => {
      const user = userEvent.setup();
      render(<NewGoalPage />, { wrapper: createWrapper() });

      const templateCard = screen.getByText('Run 50km this month').closest('div[role="button"]');
      await user.click(templateCard!);

      await waitFor(() => {
        expect(screen.getByDisplayValue('Run 50km this month')).toBeInTheDocument();
        expect(screen.getByDisplayValue('50')).toBeInTheDocument();
      });
    });

    it('should navigate to form with empty data when custom goal is selected', async () => {
      const user = userEvent.setup();
      render(<NewGoalPage />, { wrapper: createWrapper() });

      const customGoalCard = screen.getByText('goals.create.templateSelector.custom.title').closest('div');
      await user.click(customGoalCard!);

      await waitFor(() => {
        expect(screen.getByText('goals.create.form.title')).toBeInTheDocument();
        const titleInput = screen.getByLabelText<HTMLInputElement>(/goals.create.form.fields.title.label/i);
        expect(titleInput.value).toBe('');
      });
    });
  });

  describe('Step 2: Form Interaction', () => {
    it('should allow filling out the form', async () => {
      const user = userEvent.setup();
      render(<NewGoalPage />, { wrapper: createWrapper() });

      const customGoalCard = screen.getByText('goals.create.templateSelector.custom.title').closest('div');
      await user.click(customGoalCard!);

      await waitFor(() => {
        expect(screen.getByText('goals.create.form.title')).toBeInTheDocument();
      });

      const titleInput = screen.getByLabelText(/goals.create.form.fields.title.label/i);
      await user.type(titleInput, 'My Custom Goal');

      expect(screen.getByDisplayValue('My Custom Goal')).toBeInTheDocument();
    });

    it('should show validation errors on submit with invalid data', async () => {
      const user = userEvent.setup();
      render(<NewGoalPage />, { wrapper: createWrapper() });

      const customGoalCard = screen.getByText('goals.create.templateSelector.custom.title').closest('div');
      await user.click(customGoalCard!);

      await waitFor(() => {
        expect(screen.getByText('goals.create.form.title')).toBeInTheDocument();
      });

      const submitButton = screen.getByText('goals.create.form.actions.create');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('goals.create.form.validationError');
      });
    });

    it('should navigate back to template selection when back button is clicked', async () => {
      const user = userEvent.setup();
      render(<NewGoalPage />, { wrapper: createWrapper() });

      const customGoalCard = screen.getByText('goals.create.templateSelector.custom.title').closest('div');
      await user.click(customGoalCard!);

      await waitFor(() => {
        expect(screen.getByText('goals.create.form.title')).toBeInTheDocument();
      });

      const backButton = screen.getByText('goals.create.form.actions.back');
      await user.click(backButton);

      await waitFor(() => {
        expect(screen.getByText('goals.create.templateSelector.title')).toBeInTheDocument();
      });
    });
  });

  describe('Complete Flow: Template to Submission', () => {
    it('should complete full flow from template selection to submission', async () => {
      const user = userEvent.setup();
      render(<NewGoalPage />, { wrapper: createWrapper() });

      const templateCard = screen.getByText('Run 50km this month').closest('div[role="button"]');
      await user.click(templateCard!);

      await waitFor(() => {
        expect(screen.getByText('goals.create.form.title')).toBeInTheDocument();
      });

      const titleInput = screen.getByLabelText(/goals.create.form.fields.title.label/i);
      await user.clear(titleInput);
      await user.type(titleInput, 'My Running Goal');

      const submitButton = screen.getByText('goals.create.form.actions.create');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockToast.success).toHaveBeenCalled();
      });
    }, 10000);

    it('should redirect to goals page after successful submission', async () => {
      const user = userEvent.setup();
      render(<NewGoalPage />, { wrapper: createWrapper() });

      const templateCard = screen.getByText('Run 50km this month').closest('div[role="button"]');
      await user.click(templateCard!);

      await waitFor(() => {
        expect(screen.getByText('goals.create.form.title')).toBeInTheDocument();
      });

      const submitButton = screen.getByText('goals.create.form.actions.create');
      await user.click(submitButton);

      await waitFor(
        () => {
          expect(mockRouterPush).toHaveBeenCalledWith('/goals');
        },
        { timeout: 1000 },
      );
    });
  });

  describe('Complete Flow: Custom Goal', () => {
    it('should complete full flow for custom goal creation', async () => {
      const user = userEvent.setup();
      render(<NewGoalPage />, { wrapper: createWrapper() });

      const customGoalCard = screen.getByText('goals.create.templateSelector.custom.title').closest('div');
      await user.click(customGoalCard!);

      await waitFor(() => {
        expect(screen.getByText('goals.create.form.title')).toBeInTheDocument();
      });

      const titleInput = screen.getByLabelText(/goals.create.form.fields.title.label/i);
      await user.type(titleInput, 'Custom Goal Title');

      const targetValueInput = screen.getByLabelText(/goals.create.form.fields.targetValue.label/i);
      await user.clear(targetValueInput);
      await user.type(targetValueInput, '100');

      const submitButton = screen.getByText('goals.create.form.actions.create');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockToast.success).toHaveBeenCalled();
      });
    }, 10000);
  });

  describe('Progress Indicator', () => {
    it('should update progress indicator when navigating between steps', async () => {
      const user = userEvent.setup();
      render(<NewGoalPage />, { wrapper: createWrapper() });

      expect(screen.getByText('goals.create.steps.template')).toBeInTheDocument();

      const templateCard = screen.getByText('Run 50km this month').closest('div[role="button"]');
      await user.click(templateCard!);

      await waitFor(() => {
        expect(screen.getByText('goals.create.steps.details')).toBeInTheDocument();
      });
    });
  });
});
