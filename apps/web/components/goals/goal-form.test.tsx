import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GoalForm } from './goal-form';
import { GoalTargetType, GoalPeriodType, SportType } from '@/gql/graphql';
import type { GoalFormData } from '@/lib/goals/validation';

const { mockToast, mockUseTranslations } = vi.hoisted(() => ({
  mockToast: {
    error: vi.fn(),
  },
  mockUseTranslations: vi.fn((namespace?: string) => (key: string, values?: Record<string, string | number>) => {
    const fullKey = namespace ? `${namespace}.${key}` : key;
    if (values) {
      return `${fullKey}:${JSON.stringify(values)}`;
    }
    return fullKey;
  }),
}));

vi.mock('sonner', () => ({
  toast: mockToast,
}));

vi.mock('next-intl', () => ({
  useTranslations: mockUseTranslations,
  useLocale: () => 'en',
}));

const defaultInitialData: GoalFormData = {
  title: '',
  description: '',
  targetType: GoalTargetType.Distance,
  targetValue: 0,
  periodType: GoalPeriodType.Weekly,
  sportType: null,
  isRecurring: false,
  startDate: new Date('2026-06-01'),
  endDate: null,
};

describe('GoalForm', () => {
  const mockOnSubmit = vi.fn();
  const mockOnBack = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render all form sections', () => {
      render(
        <GoalForm
          mode="create"
          initialData={defaultInitialData}
          onSubmit={mockOnSubmit}
          onBack={mockOnBack}
          loading={false}
        />,
      );

      expect(screen.getByText('goals.create.form.sections.basic')).toBeInTheDocument();
      expect(screen.getByText('goals.create.form.sections.target')).toBeInTheDocument();
      expect(screen.getByText('goals.create.form.sections.period')).toBeInTheDocument();
    });

    it('should render all basic info fields', () => {
      render(
        <GoalForm
          mode="create"
          initialData={defaultInitialData}
          onSubmit={mockOnSubmit}
          onBack={mockOnBack}
          loading={false}
        />,
      );

      expect(screen.getByLabelText(/goals.create.form.fields.title.label/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/goals.create.form.fields.description.label/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/goals.create.form.fields.sportType.label/i)).toBeInTheDocument();
    });

    it('should render all target fields', () => {
      render(
        <GoalForm
          mode="create"
          initialData={defaultInitialData}
          onSubmit={mockOnSubmit}
          onBack={mockOnBack}
          loading={false}
        />,
      );

      expect(screen.getByLabelText(/goals.create.form.fields.targetType.label/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/goals.create.form.fields.targetValue.label/i)).toBeInTheDocument();
    });

    it('should render all period fields', () => {
      render(
        <GoalForm
          mode="create"
          initialData={defaultInitialData}
          onSubmit={mockOnSubmit}
          onBack={mockOnBack}
          loading={false}
        />,
      );

      expect(screen.getByLabelText(/goals.create.form.fields.periodType.label/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/goals.create.form.fields.startDate.label/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/goals.create.form.fields.isRecurring.label/i)).toBeInTheDocument();
    });

    it('should display unit based on target type', () => {
      render(
        <GoalForm
          mode="create"
          initialData={{ ...defaultInitialData, targetType: GoalTargetType.Distance }}
          onSubmit={mockOnSubmit}
          onBack={mockOnBack}
          loading={false}
        />,
      );

      expect(screen.getByText('km')).toBeInTheDocument();
    });

    it('should display hint based on target type', () => {
      render(
        <GoalForm
          mode="create"
          initialData={{ ...defaultInitialData, targetType: GoalTargetType.Distance }}
          onSubmit={mockOnSubmit}
          onBack={mockOnBack}
          loading={false}
        />,
      );

      expect(screen.getByText('goals.create.form.hints.distance')).toBeInTheDocument();
    });
  });

  describe('Initial Values', () => {
    it('should populate form with initial data', () => {
      const initialData: GoalFormData = {
        title: 'Test Goal',
        description: 'Test Description',
        targetType: GoalTargetType.Duration,
        targetValue: 10,
        periodType: GoalPeriodType.Monthly,
        sportType: SportType.Run,
        isRecurring: true,
        startDate: new Date('2026-06-01'),
        endDate: null,
      };

      render(
        <GoalForm
          mode="create"
          initialData={initialData}
          onSubmit={mockOnSubmit}
          onBack={mockOnBack}
          loading={false}
        />,
      );

      expect(screen.getByDisplayValue('Test Goal')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Test Description')).toBeInTheDocument();
      expect(screen.getByDisplayValue('10')).toBeInTheDocument();
    });
  });

  describe('Dynamic Fields', () => {
    it('should not show endDate field for non-CUSTOM period', () => {
      render(
        <GoalForm
          mode="create"
          initialData={{ ...defaultInitialData, periodType: GoalPeriodType.Weekly }}
          onSubmit={mockOnSubmit}
          onBack={mockOnBack}
          loading={false}
        />,
      );

      expect(screen.queryByLabelText(/goals.create.form.fields.endDate.label/i)).not.toBeInTheDocument();
    });

    it('should show endDate field for CUSTOM period', () => {
      render(
        <GoalForm
          mode="create"
          initialData={{ ...defaultInitialData, periodType: GoalPeriodType.Custom }}
          onSubmit={mockOnSubmit}
          onBack={mockOnBack}
          loading={false}
        />,
      );

      expect(screen.getByLabelText(/goals.create.form.fields.endDate.label/i)).toBeInTheDocument();
    });

    it('should update unit when target type changes', async () => {
      const user = userEvent.setup();

      render(
        <GoalForm
          mode="create"
          initialData={{ ...defaultInitialData, targetType: GoalTargetType.Distance }}
          onSubmit={mockOnSubmit}
          onBack={mockOnBack}
          loading={false}
        />,
      );

      expect(screen.getByText('km')).toBeInTheDocument();

      const targetTypeSelect = screen.getByLabelText(/goals.create.form.fields.targetType.label/i);
      await user.click(targetTypeSelect);

      // Radix UI Select creates multiple elements with the same text (hidden option + visible span)
      // We need to get all elements and click the visible one (last in the array)
      const durationOptions = screen.getAllByText('goals.targetTypes.duration');
      await user.click(durationOptions[durationOptions.length - 1]);

      await waitFor(() => {
        expect(screen.getByText('h')).toBeInTheDocument();
      });
    });
  });

  describe('Validation', () => {
    it('should show error for empty title on blur', async () => {
      render(
        <GoalForm
          mode="create"
          initialData={defaultInitialData}
          onSubmit={mockOnSubmit}
          onBack={mockOnBack}
          loading={false}
        />,
      );

      const titleInput = screen.getByLabelText(/goals.create.form.fields.title.label/i);
      fireEvent.focus(titleInput);
      fireEvent.blur(titleInput);

      await waitFor(() => {
        expect(screen.getByText('goals.create.form.errors.titleRequired')).toBeInTheDocument();
      });
    });

    it('should show error for zero target value', async () => {
      render(
        <GoalForm
          mode="create"
          initialData={{ ...defaultInitialData, targetValue: 0 }}
          onSubmit={mockOnSubmit}
          onBack={mockOnBack}
          loading={false}
        />,
      );

      const targetValueInput = screen.getByLabelText(/goals.create.form.fields.targetValue.label/i);
      fireEvent.focus(targetValueInput);
      fireEvent.blur(targetValueInput);

      await waitFor(() => {
        expect(screen.getByText('goals.create.form.errors.targetValuePositive')).toBeInTheDocument();
      });
    });

    it('should clear error when field becomes valid', async () => {
      const user = userEvent.setup();

      render(
        <GoalForm
          mode="create"
          initialData={defaultInitialData}
          onSubmit={mockOnSubmit}
          onBack={mockOnBack}
          loading={false}
        />,
      );

      const titleInput = screen.getByLabelText(/goals.create.form.fields.title.label/i);
      fireEvent.focus(titleInput);
      fireEvent.blur(titleInput);

      await waitFor(() => {
        expect(screen.getByText('goals.create.form.errors.titleRequired')).toBeInTheDocument();
      });

      await user.type(titleInput, 'Valid Title');

      await waitFor(() => {
        expect(screen.queryByText('goals.create.form.errors.titleRequired')).not.toBeInTheDocument();
      });
    });

    it('should not submit form with validation errors', async () => {
      const user = userEvent.setup();

      render(
        <GoalForm
          mode="create"
          initialData={{ ...defaultInitialData, title: '', targetValue: 0 }}
          onSubmit={mockOnSubmit}
          onBack={mockOnBack}
          loading={false}
        />,
      );

      const submitButton = screen.getByText('goals.create.form.actions.create');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('goals.create.form.validationError');
        expect(mockOnSubmit).not.toHaveBeenCalled();
      });
    });
  });

  describe('Form Submission', () => {
    it('should call onSubmit with form data when valid', async () => {
      const user = userEvent.setup();

      const validData: GoalFormData = {
        title: 'Run 50km',
        description: 'Monthly running goal',
        targetType: GoalTargetType.Distance,
        targetValue: 50,
        periodType: GoalPeriodType.Monthly,
        sportType: SportType.Run,
        isRecurring: false,
        startDate: new Date('2026-06-01'),
        endDate: null,
      };

      render(
        <GoalForm mode="create" initialData={validData} onSubmit={mockOnSubmit} onBack={mockOnBack} loading={false} />,
      );

      const submitButton = screen.getByText('goals.create.form.actions.create');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Run 50km',
            targetType: GoalTargetType.Distance,
            targetValue: 50,
          }),
        );
      });
    });

    it('should call onBack when back button is clicked', async () => {
      const user = userEvent.setup();

      render(
        <GoalForm
          mode="create"
          initialData={defaultInitialData}
          onSubmit={mockOnSubmit}
          onBack={mockOnBack}
          loading={false}
        />,
      );

      const backButton = screen.getByText('goals.create.form.actions.back');
      await user.click(backButton);

      expect(mockOnBack).toHaveBeenCalled();
    });
  });

  describe('Loading State', () => {
    it('should disable all inputs when loading', () => {
      render(
        <GoalForm
          mode="create"
          initialData={defaultInitialData}
          onSubmit={mockOnSubmit}
          onBack={mockOnBack}
          loading={true}
        />,
      );

      const titleInput = screen.getByLabelText(/goals.create.form.fields.title.label/i);
      const submitButton = screen.getByText('goals.create.form.actions.create');
      const backButton = screen.getByText('goals.create.form.actions.back');

      expect(titleInput).toBeDisabled();
      expect(submitButton).toBeDisabled();
      expect(backButton).toBeDisabled();
    });

    it('should show loading indicator on submit button when loading', () => {
      const { container } = render(
        <GoalForm
          mode="create"
          initialData={defaultInitialData}
          onSubmit={mockOnSubmit}
          onBack={mockOnBack}
          loading={true}
        />,
      );

      // Loader2 from lucide-react renders an SVG with animate-spin class
      const loader = container.querySelector('.animate-spin');
      expect(loader).toBeInTheDocument();
    });
  });

  describe('Sport Type Selection', () => {
    it('should allow selecting all sports', async () => {
      const user = userEvent.setup();

      render(
        <GoalForm
          mode="create"
          initialData={{ ...defaultInitialData, sportType: SportType.Run }}
          onSubmit={mockOnSubmit}
          onBack={mockOnBack}
          loading={false}
        />,
      );

      const sportTypeSelect = screen.getByLabelText(/goals.create.form.fields.sportType.label/i);
      await user.click(sportTypeSelect);

      // Wait for dropdown to open and click the option using role-based query
      const allSportsOption = await screen.findByRole('option', {
        name: /goals.create.form.fields.sportType.allSports/i,
      });
      await user.click(allSportsOption);

      // Verify the select button now shows the selected value
      await waitFor(() => {
        expect(sportTypeSelect).toHaveTextContent('goals.create.form.fields.sportType.allSports');
      });
    });

    it('should allow selecting specific sport', async () => {
      const user = userEvent.setup();

      render(
        <GoalForm
          mode="create"
          initialData={defaultInitialData}
          onSubmit={mockOnSubmit}
          onBack={mockOnBack}
          loading={false}
        />,
      );

      const sportTypeSelect = screen.getByLabelText(/goals.create.form.fields.sportType.label/i);
      await user.click(sportTypeSelect);

      // Wait for dropdown to open and click the option using role-based query
      const runOption = await screen.findByRole('option', { name: /goals.sportTypes.run/i });
      await user.click(runOption);

      // Verify the select button now shows the selected value
      await waitFor(() => {
        expect(sportTypeSelect).toHaveTextContent('goals.sportTypes.run');
      });
    });
  });

  describe('Recurring Goal Toggle', () => {
    it('should toggle recurring goal checkbox', async () => {
      const user = userEvent.setup();

      render(
        <GoalForm
          mode="create"
          initialData={defaultInitialData}
          onSubmit={mockOnSubmit}
          onBack={mockOnBack}
          loading={false}
        />,
      );

      const recurringSwitch = screen.getByLabelText(/goals.create.form.fields.isRecurring.label/i);
      expect(recurringSwitch).not.toBeChecked();

      await user.click(recurringSwitch);

      await waitFor(() => {
        expect(recurringSwitch).toBeChecked();
      });
    });
  });

  describe('Edit Mode', () => {
    const editModeData: GoalFormData = {
      title: 'Run 50km',
      description: 'Monthly running goal',
      targetType: GoalTargetType.Distance,
      targetValue: 50,
      periodType: GoalPeriodType.Monthly,
      sportType: SportType.Run,
      isRecurring: false,
      startDate: new Date('2025-02-01'),
      endDate: null,
    };

    it('should display edit mode title', () => {
      render(
        <GoalForm mode="edit" initialData={editModeData} onSubmit={mockOnSubmit} onBack={mockOnBack} loading={false} />,
      );

      expect(screen.getByText('goals.edit.form.title')).toBeInTheDocument();
      expect(screen.getByText('goals.edit.form.description')).toBeInTheDocument();
    });

    it('should display save button text', () => {
      render(
        <GoalForm mode="edit" initialData={editModeData} onSubmit={mockOnSubmit} onBack={mockOnBack} loading={false} />,
      );

      expect(screen.getByText('goals.edit.form.actions.save')).toBeInTheDocument();
    });

    it('should disable sportType in edit mode', () => {
      render(
        <GoalForm mode="edit" initialData={editModeData} onSubmit={mockOnSubmit} onBack={mockOnBack} loading={false} />,
      );

      const sportTypeSelect = screen.getByLabelText(/goals.create.form.fields.sportType.label/i);
      expect(sportTypeSelect).toBeDisabled();
    });

    it('should disable targetType in edit mode', () => {
      render(
        <GoalForm mode="edit" initialData={editModeData} onSubmit={mockOnSubmit} onBack={mockOnBack} loading={false} />,
      );

      const targetTypeSelect = screen.getByLabelText(/goals.create.form.fields.targetType.label/i);
      expect(targetTypeSelect).toBeDisabled();
    });

    it('should disable periodType in edit mode', () => {
      render(
        <GoalForm mode="edit" initialData={editModeData} onSubmit={mockOnSubmit} onBack={mockOnBack} loading={false} />,
      );

      const periodTypeSelect = screen.getByLabelText(/goals.create.form.fields.periodType.label/i);
      expect(periodTypeSelect).toBeDisabled();
    });

    it('should disable startDate in edit mode', () => {
      render(
        <GoalForm mode="edit" initialData={editModeData} onSubmit={mockOnSubmit} onBack={mockOnBack} loading={false} />,
      );

      const startDateButton = screen.getByRole('button', { name: /goals.create.form.fields.startDate.label/i });
      expect(startDateButton).toBeDisabled();
    });

    it('should disable isRecurring switch in edit mode', () => {
      render(
        <GoalForm mode="edit" initialData={editModeData} onSubmit={mockOnSubmit} onBack={mockOnBack} loading={false} />,
      );

      const recurringSwitch = screen.getByLabelText(/goals.create.form.fields.isRecurring.label/i);
      expect(recurringSwitch).toBeDisabled();
    });

    it('should show read-only indicators', () => {
      render(
        <GoalForm mode="edit" initialData={editModeData} onSubmit={mockOnSubmit} onBack={mockOnBack} loading={false} />,
      );

      const readOnlyLabels = screen.getAllByText('goals.edit.form.fields.readOnly');
      expect(readOnlyLabels.length).toBeGreaterThan(0);
    });

    it('should show help messages for immutable fields', () => {
      render(
        <GoalForm mode="edit" initialData={editModeData} onSubmit={mockOnSubmit} onBack={mockOnBack} loading={false} />,
      );

      expect(screen.getByText('goals.edit.form.fields.cannotChangeSport')).toBeInTheDocument();
      expect(screen.getByText('goals.edit.form.fields.cannotChangeTargetType')).toBeInTheDocument();
      expect(screen.getByText('goals.edit.form.fields.cannotChangePeriod')).toBeInTheDocument();
      expect(screen.getByText('goals.edit.form.fields.cannotChangeStartDate')).toBeInTheDocument();
    });

    it('should keep title editable in edit mode', () => {
      render(
        <GoalForm mode="edit" initialData={editModeData} onSubmit={mockOnSubmit} onBack={mockOnBack} loading={false} />,
      );

      const titleInput = screen.getByLabelText(/goals.create.form.fields.title.label/i);
      expect(titleInput).not.toBeDisabled();
    });

    it('should keep description editable in edit mode', () => {
      render(
        <GoalForm mode="edit" initialData={editModeData} onSubmit={mockOnSubmit} onBack={mockOnBack} loading={false} />,
      );

      const descriptionTextarea = screen.getByLabelText(/goals.create.form.fields.description.label/i);
      expect(descriptionTextarea).not.toBeDisabled();
    });

    it('should keep targetValue editable in edit mode', () => {
      render(
        <GoalForm mode="edit" initialData={editModeData} onSubmit={mockOnSubmit} onBack={mockOnBack} loading={false} />,
      );

      const targetValueInput = screen.getByLabelText(/goals.create.form.fields.targetValue.label/i);
      expect(targetValueInput).not.toBeDisabled();
    });

    it('should show recurring goal note when goal is recurring', () => {
      const recurringData = { ...editModeData, isRecurring: true };
      render(
        <GoalForm
          mode="edit"
          initialData={recurringData}
          onSubmit={mockOnSubmit}
          onBack={mockOnBack}
          loading={false}
        />,
      );

      expect(screen.getByText('goals.edit.form.fields.recurringGoalNote')).toBeInTheDocument();
    });
  });

  describe('Dirty Checking', () => {
    const editData: GoalFormData = {
      title: 'Run 50km',
      description: 'Monthly goal',
      targetType: GoalTargetType.Distance,
      targetValue: 50,
      periodType: GoalPeriodType.Monthly,
      sportType: SportType.Run,
      isRecurring: false,
      startDate: new Date('2025-02-01'),
      endDate: null,
    };

    it('should disable submit button when no changes in edit mode', () => {
      render(
        <GoalForm mode="edit" initialData={editData} onSubmit={mockOnSubmit} onBack={mockOnBack} loading={false} />,
      );

      const submitButton = screen.getByRole('button', { name: /goals.edit.form.actions.save/i });
      expect(submitButton).toBeDisabled();
      expect(screen.getByText('goals.edit.form.noChanges')).toBeInTheDocument();
    });

    it('should enable submit button when title is modified', async () => {
      const user = userEvent.setup();

      render(
        <GoalForm mode="edit" initialData={editData} onSubmit={mockOnSubmit} onBack={mockOnBack} loading={false} />,
      );

      const titleInput = screen.getByLabelText(/goals.create.form.fields.title.label/i);
      await user.clear(titleInput);
      await user.type(titleInput, 'Run 60km');

      const submitButton = screen.getByRole('button', { name: /goals.edit.form.actions.save/i });
      expect(submitButton).not.toBeDisabled();
    });

    it('should enable submit button when description is modified', async () => {
      const user = userEvent.setup();

      render(
        <GoalForm mode="edit" initialData={editData} onSubmit={mockOnSubmit} onBack={mockOnBack} loading={false} />,
      );

      const descriptionTextarea = screen.getByLabelText(/goals.create.form.fields.description.label/i);
      await user.clear(descriptionTextarea);
      await user.type(descriptionTextarea, 'Updated description');

      const submitButton = screen.getByRole('button', { name: /goals.edit.form.actions.save/i });
      expect(submitButton).not.toBeDisabled();
    });

    it('should enable submit button when targetValue is modified', async () => {
      const user = userEvent.setup();

      render(
        <GoalForm mode="edit" initialData={editData} onSubmit={mockOnSubmit} onBack={mockOnBack} loading={false} />,
      );

      const targetValueInput = screen.getByLabelText(/goals.create.form.fields.targetValue.label/i);
      await user.clear(targetValueInput);
      await user.type(targetValueInput, '60');

      const submitButton = screen.getByRole('button', { name: /goals.edit.form.actions.save/i });
      expect(submitButton).not.toBeDisabled();
    });

    it('should disable button again when changes are reverted', async () => {
      const user = userEvent.setup();

      render(
        <GoalForm mode="edit" initialData={editData} onSubmit={mockOnSubmit} onBack={mockOnBack} loading={false} />,
      );

      const titleInput = screen.getByLabelText(/goals.create.form.fields.title.label/i);
      const submitButton = screen.getByRole('button', { name: /goals.edit.form.actions.save/i });

      await user.clear(titleInput);
      await user.type(titleInput, 'Run 60km');
      expect(submitButton).not.toBeDisabled();

      await user.clear(titleInput);
      await user.type(titleInput, 'Run 50km');
      expect(submitButton).toBeDisabled();
    });

    it('should correctly compare Date objects for endDate', () => {
      const dataWithEndDate = {
        ...editData,
        periodType: GoalPeriodType.Custom,
        endDate: new Date('2025-02-28'),
      };

      render(
        <GoalForm
          mode="edit"
          initialData={dataWithEndDate}
          onSubmit={mockOnSubmit}
          onBack={mockOnBack}
          loading={false}
        />,
      );

      const submitButton = screen.getByRole('button', { name: /goals.edit.form.actions.save/i });
      expect(submitButton).toBeDisabled();
    });

    it('should always enable submit in create mode', () => {
      render(
        <GoalForm mode="create" initialData={editData} onSubmit={mockOnSubmit} onBack={mockOnBack} loading={false} />,
      );

      const submitButton = screen.getByRole('button', { name: /goals.create.form.actions.create/i });
      expect(submitButton).not.toBeDisabled();
      expect(screen.queryByText('goals.edit.form.noChanges')).not.toBeInTheDocument();
    });

    it('should handle null description correctly', async () => {
      const user = userEvent.setup();
      const dataWithNullDescription = { ...editData, description: '' };

      render(
        <GoalForm
          mode="edit"
          initialData={dataWithNullDescription}
          onSubmit={mockOnSubmit}
          onBack={mockOnBack}
          loading={false}
        />,
      );

      const submitButton = screen.getByRole('button', { name: /goals.edit.form.actions.save/i });
      expect(submitButton).toBeDisabled();

      const descriptionTextarea = screen.getByLabelText(/goals.create.form.fields.description.label/i);
      await user.type(descriptionTextarea, 'New description');

      expect(submitButton).not.toBeDisabled();
    });
  });
});
