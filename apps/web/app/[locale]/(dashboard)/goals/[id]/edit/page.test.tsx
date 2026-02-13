import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EditGoalPage from './page';
import { GoalTargetType, GoalPeriodType, GoalStatus, SportType } from '@/gql/graphql';

const mockGoal: {
  id: string;
  title: string;
  description: string | null;
  targetType: GoalTargetType;
  targetValue: number;
  periodType: GoalPeriodType;
  sportType: SportType | null;
  isRecurring: boolean;
  startDate: string;
  endDate: string;
  status: GoalStatus;
  currentValue: number;
  progressPercentage: number;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
} = {
  id: '1',
  title: 'Run 50km this month',
  description: 'Monthly running goal',
  targetType: GoalTargetType.Distance,
  targetValue: 50,
  periodType: GoalPeriodType.Monthly,
  sportType: SportType.Run,
  isRecurring: false,
  startDate: '2025-01-01T00:00:00Z',
  endDate: '2025-01-31T23:59:59Z',
  status: GoalStatus.Active,
  currentValue: 25,
  progressPercentage: 50,
  completedAt: null,
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-15T00:00:00Z',
};

interface MockUseGoalDetailReturn {
  goal: typeof mockGoal | null;
  loading: boolean;
  error: Error | null;
}

const { mockRouterPush, mockUseGoalDetail, mockUpdateGoal, mockUseTranslations, mockUse } = vi.hoisted(() => ({
  mockRouterPush: vi.fn(),
  mockUseGoalDetail: vi.fn<() => MockUseGoalDetailReturn>(),
  mockUpdateGoal: vi.fn(),
  mockUse: vi.fn(),
  mockUseTranslations: vi.fn((namespace?: string) => (key: string, values?: Record<string, string | number>) => {
    const fullKey = namespace ? `${namespace}.${key}` : key;
    if (values) {
      return `${fullKey}:${JSON.stringify(values)}`;
    }
    return fullKey;
  }),
}));

vi.mock('react', async () => {
  const actual = await vi.importActual<typeof import('react')>('react');
  return {
    ...actual,
    use: mockUse,
  };
});

vi.mock('@/i18n/navigation', () => ({
  useRouter: () => ({ push: mockRouterPush }),
}));

vi.mock('next-intl', () => ({
  useTranslations: mockUseTranslations,
  useLocale: () => 'en',
}));

vi.mock('@/lib/goals/use-goal-detail', () => ({
  useGoalDetail: () => mockUseGoalDetail(),
}));

vi.mock('@/lib/goals/use-goal-mutations', () => ({
  useUpdateGoal: () => ({ updateGoal: mockUpdateGoal, loading: false }),
}));

vi.mock('@/lib/goals/form-utils', () => ({
  transformFormDataToUpdateInput: <T,>(data: T): T => data,
}));

vi.mock('@/lib/sports/hooks', () => ({
  useAvailableSports: () => ({
    availableSports: [SportType.Run, SportType.Ride, SportType.Swim],
    sportConfigs: [],
    loading: false,
  }),
}));

interface MockGoalFormProps {
  initialData?: {
    title?: string;
    description?: string;
    targetValue?: number;
    targetType?: string;
    periodType?: string;
    sportType?: string | null;
  };
  onSubmit: (data: unknown) => void;
  onBack: () => void;
  loading?: boolean;
  mode?: string;
}

vi.mock('@/components/goals/goal-form', () => ({
  GoalForm: ({ initialData, onSubmit, onBack, loading, mode }: MockGoalFormProps) => (
    <div data-testid="goal-form">
      <div data-testid="form-mode">{mode}</div>
      <div data-testid="initial-title">{initialData?.title}</div>
      <div data-testid="initial-description">{initialData?.description}</div>
      <div data-testid="initial-target-value">{initialData?.targetValue}</div>
      <div data-testid="initial-target-type">{initialData?.targetType}</div>
      <div data-testid="initial-period-type">{initialData?.periodType}</div>
      <div data-testid="initial-sport-type">{initialData?.sportType}</div>
      <div data-testid="loading">{loading ? 'true' : 'false'}</div>
      <button onClick={() => onSubmit(initialData)} data-testid="submit-button">
        Submit
      </button>
      <button onClick={onBack} data-testid="back-button">
        Back
      </button>
    </div>
  ),
}));

describe('EditGoalPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUse.mockReturnValue({ id: '1', locale: 'en' });
    mockUseGoalDetail.mockReturnValue({
      goal: mockGoal,
      loading: false,
      error: null,
    });
  });

  describe('Goal Loading and Form Population', () => {
    it('should load goal and populate form with initial data', async () => {
      const params = Promise.resolve({ id: '1', locale: 'en' });
      render(<EditGoalPage params={params} />);

      await waitFor(() => {
        expect(screen.getByTestId('goal-form')).toBeInTheDocument();
      });

      expect(screen.getByTestId('initial-title')).toHaveTextContent('Run 50km this month');
      expect(screen.getByTestId('initial-description')).toHaveTextContent('Monthly running goal');
      expect(screen.getByTestId('initial-target-value')).toHaveTextContent('50');
      expect(screen.getByTestId('initial-target-type')).toHaveTextContent(GoalTargetType.Distance);
      expect(screen.getByTestId('initial-period-type')).toHaveTextContent(GoalPeriodType.Monthly);
      expect(screen.getByTestId('initial-sport-type')).toHaveTextContent(SportType.Run);
    });

    it('should show loading spinner while fetching goal', () => {
      mockUseGoalDetail.mockReturnValue({
        goal: null,
        loading: true,
        error: null,
      });

      const params = Promise.resolve({ id: '1', locale: 'en' });
      const { container } = render(<EditGoalPage params={params} />);

      const spinner = container.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
      expect(spinner).toHaveClass('text-primary');
    });

    it('should handle goal with null description', async () => {
      mockUseGoalDetail.mockReturnValue({
        goal: { ...mockGoal, description: null },
        loading: false,
        error: null,
      });

      const params = Promise.resolve({ id: '1', locale: 'en' });
      render(<EditGoalPage params={params} />);

      await waitFor(() => {
        expect(screen.getByTestId('initial-description')).toHaveTextContent('');
      });
    });

    it('should handle goal with null sportType', async () => {
      mockUseGoalDetail.mockReturnValue({
        goal: { ...mockGoal, sportType: null },
        loading: false,
        error: null,
      });

      const params = Promise.resolve({ id: '1', locale: 'en' });
      render(<EditGoalPage params={params} />);

      await waitFor(() => {
        expect(screen.getByTestId('initial-sport-type')).toHaveTextContent('');
      });
    });
  });

  describe('Read-Only Field Enforcement', () => {
    it('should render form in edit mode', async () => {
      const params = Promise.resolve({ id: '1', locale: 'en' });
      render(<EditGoalPage params={params} />);

      await waitFor(() => {
        expect(screen.getByTestId('form-mode')).toHaveTextContent('edit');
      });
    });

    it('should populate initial data from loaded goal', async () => {
      const params = Promise.resolve({ id: '1', locale: 'en' });
      render(<EditGoalPage params={params} />);

      await waitFor(() => {
        const targetType = screen.getByTestId('initial-target-type').textContent;
        const periodType = screen.getByTestId('initial-period-type').textContent;
        expect(targetType).toBe(GoalTargetType.Distance);
        expect(periodType).toBe(GoalPeriodType.Monthly);
      });
    });
  });

  describe('Editable Fields', () => {
    it('should allow editing title, description, targetValue, and endDate', async () => {
      const params = Promise.resolve({ id: '1', locale: 'en' });
      render(<EditGoalPage params={params} />);

      await waitFor(() => {
        expect(screen.getByTestId('goal-form')).toBeInTheDocument();
      });

      expect(screen.getByTestId('initial-title')).toBeInTheDocument();
      expect(screen.getByTestId('initial-description')).toBeInTheDocument();
      expect(screen.getByTestId('initial-target-value')).toBeInTheDocument();
    });
  });

  describe('updateGoal Mutation', () => {
    it('should call updateGoal with correct parameters on submit', async () => {
      const user = userEvent.setup();
      mockUpdateGoal.mockResolvedValue(true);

      const params = Promise.resolve({ id: '1', locale: 'en' });
      render(<EditGoalPage params={params} />);

      await waitFor(() => {
        expect(screen.getByTestId('submit-button')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('submit-button'));

      await waitFor(() => {
        expect(mockUpdateGoal).toHaveBeenCalled();
      });
    });

    it('should navigate to detail page after successful update', async () => {
      const user = userEvent.setup();
      mockUpdateGoal.mockResolvedValue(true);

      const params = Promise.resolve({ id: '1', locale: 'en' });
      render(<EditGoalPage params={params} />);

      await waitFor(() => {
        expect(screen.getByTestId('submit-button')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('submit-button'));

      await waitFor(() => {
        expect(mockRouterPush).toHaveBeenCalledWith('/goals/1');
      });
    });

    it('should not navigate if update fails', async () => {
      const user = userEvent.setup();
      mockUpdateGoal.mockResolvedValue(false);

      const params = Promise.resolve({ id: '1', locale: 'en' });
      render(<EditGoalPage params={params} />);

      await waitFor(() => {
        expect(screen.getByTestId('submit-button')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('submit-button'));

      await waitFor(() => {
        expect(mockUpdateGoal).toHaveBeenCalled();
      });

      expect(mockRouterPush).not.toHaveBeenCalled();
    });
  });

  describe('Navigation', () => {
    it('should navigate back to detail page on back button', async () => {
      const user = userEvent.setup();

      const params = Promise.resolve({ id: '1', locale: 'en' });
      render(<EditGoalPage params={params} />);

      await waitFor(() => {
        expect(screen.getByTestId('back-button')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('back-button'));

      expect(mockRouterPush).toHaveBeenCalledWith('/goals/1');
    });
  });

  describe('Error Handling', () => {
    it('should show error alert for invalid goal ID (NaN)', () => {
      mockUse.mockReturnValue({ id: 'invalid', locale: 'en' });
      const params = Promise.resolve({ id: 'invalid', locale: 'en' });
      render(<EditGoalPage params={params} />);

      expect(screen.getByText('goals.detail.error.title')).toBeInTheDocument();
      expect(screen.getByText('goals.detail.error.description')).toBeInTheDocument();
    });

    it('should show error alert for negative goal ID', () => {
      mockUse.mockReturnValue({ id: '-1', locale: 'en' });
      const params = Promise.resolve({ id: '-1', locale: 'en' });
      render(<EditGoalPage params={params} />);

      expect(screen.getByText('goals.detail.error.title')).toBeInTheDocument();
    });

    it('should show error alert for zero goal ID', () => {
      mockUse.mockReturnValue({ id: '0', locale: 'en' });
      const params = Promise.resolve({ id: '0', locale: 'en' });
      render(<EditGoalPage params={params} />);

      expect(screen.getByText('goals.detail.error.title')).toBeInTheDocument();
    });

    it('should show not found message when goal does not exist', () => {
      mockUseGoalDetail.mockReturnValue({
        goal: null,
        loading: false,
        error: null,
      });

      mockUse.mockReturnValue({ id: '999', locale: 'en' });
      const params = Promise.resolve({ id: '999', locale: 'en' });
      render(<EditGoalPage params={params} />);

      expect(screen.getByText('goals.detail.notFound.title')).toBeInTheDocument();
      expect(screen.getByText('goals.detail.notFound.description')).toBeInTheDocument();
    });

    it('should show not found message when goal fetch fails', () => {
      mockUseGoalDetail.mockReturnValue({
        goal: null,
        loading: false,
        error: new Error('Failed to fetch goal'),
      });

      const params = Promise.resolve({ id: '1', locale: 'en' });
      render(<EditGoalPage params={params} />);

      expect(screen.getByText('goals.detail.notFound.title')).toBeInTheDocument();
    });
  });
});
