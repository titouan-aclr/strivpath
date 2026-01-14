import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GoalTemplateSelector } from './goal-template-selector';
import { GoalTargetType, GoalPeriodType, SportType } from '@/gql/graphql';
import type { GoalTemplateInfoFragment } from '@/gql/graphql';

const mockUseTranslations = (namespace?: string) => (key: string) => {
  const translations: Record<string, string> = {
    'goals.create.templateSelector.title': 'Choose a Goal Template',
    'goals.create.templateSelector.description': 'Select from pre-defined goals or create your own',
    'goals.create.templateSelector.custom.title': 'Custom Goal',
    'goals.create.templateSelector.custom.description': 'Create a goal from scratch',
    'goals.create.templateSelector.categories.beginner': 'Beginner',
    'goals.create.templateSelector.categories.intermediate': 'Intermediate',
    'goals.create.templateSelector.categories.advanced': 'Advanced',
    'goals.create.templateSelector.categories.challenge': 'Challenge',
  };
  const fullKey = namespace ? `${namespace}.${key}` : key;
  return translations[fullKey] || key;
};

vi.mock('next-intl', () => ({
  useTranslations: (namespace?: string) => mockUseTranslations(namespace),
}));

vi.mock('./goal-template-card', () => ({
  GoalTemplateCard: ({ template, onSelect }: { template: GoalTemplateInfoFragment; onSelect: () => void }) => (
    <div data-testid={`template-card-${template.id}`} onClick={onSelect}>
      {template.title}
    </div>
  ),
}));

const createMockTemplate = (overrides?: Partial<GoalTemplateInfoFragment>): GoalTemplateInfoFragment => ({
  __typename: 'GoalTemplate' as const,
  id: '1',
  title: 'Run 50km',
  description: 'Monthly running goal',
  targetType: GoalTargetType.Distance,
  targetValue: 50,
  periodType: GoalPeriodType.Monthly,
  sportType: SportType.Run,
  category: 'beginner',
  isPreset: true,
  createdAt: new Date('2024-01-01'),
  ...overrides,
});

describe('GoalTemplateSelector', () => {
  const mockOnSelectTemplate = vi.fn();
  const mockOnSelectCustom = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('loading state', () => {
    it('should display skeleton when loading', () => {
      const { container } = render(
        <GoalTemplateSelector
          templates={[]}
          loading={true}
          onSelectTemplate={mockOnSelectTemplate}
          onSelectCustom={mockOnSelectCustom}
        />,
      );

      const skeletons = container.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('should not display content while loading', () => {
      render(
        <GoalTemplateSelector
          templates={[]}
          loading={true}
          onSelectTemplate={mockOnSelectTemplate}
          onSelectCustom={mockOnSelectCustom}
        />,
      );

      expect(screen.queryByText('Choose a Goal Template')).not.toBeInTheDocument();
    });
  });

  describe('header', () => {
    it('should display title and description', () => {
      render(
        <GoalTemplateSelector
          templates={[]}
          loading={false}
          onSelectTemplate={mockOnSelectTemplate}
          onSelectCustom={mockOnSelectCustom}
        />,
      );

      expect(screen.getByText('Choose a Goal Template')).toBeInTheDocument();
      expect(screen.getByText('Select from pre-defined goals or create your own')).toBeInTheDocument();
    });
  });

  describe('custom option', () => {
    it('should display custom goal card', () => {
      render(
        <GoalTemplateSelector
          templates={[]}
          loading={false}
          onSelectTemplate={mockOnSelectTemplate}
          onSelectCustom={mockOnSelectCustom}
        />,
      );

      expect(screen.getByText('Custom Goal')).toBeInTheDocument();
      expect(screen.getByText('Create a goal from scratch')).toBeInTheDocument();
    });

    it('should call onSelectCustom when custom card is clicked', async () => {
      const user = userEvent.setup();
      render(
        <GoalTemplateSelector
          templates={[]}
          loading={false}
          onSelectTemplate={mockOnSelectTemplate}
          onSelectCustom={mockOnSelectCustom}
        />,
      );

      const customCard = screen.getByText('Custom Goal').closest('div[role="button"]');
      expect(customCard).toBeInTheDocument();

      await user.click(customCard!);

      expect(mockOnSelectCustom).toHaveBeenCalledTimes(1);
    });

    it('should handle keyboard navigation on custom card', async () => {
      const user = userEvent.setup();
      render(
        <GoalTemplateSelector
          templates={[]}
          loading={false}
          onSelectTemplate={mockOnSelectTemplate}
          onSelectCustom={mockOnSelectCustom}
        />,
      );

      const customCard = screen.getByText('Custom Goal').closest('div[role="button"]') as HTMLElement;
      customCard.focus();

      await user.keyboard('{Enter}');
      expect(mockOnSelectCustom).toHaveBeenCalledTimes(1);

      mockOnSelectCustom.mockClear();

      await user.keyboard(' ');
      expect(mockOnSelectCustom).toHaveBeenCalledTimes(1);
    });

    it('should display custom goal icon', () => {
      const { container } = render(
        <GoalTemplateSelector
          templates={[]}
          loading={false}
          onSelectTemplate={mockOnSelectTemplate}
          onSelectCustom={mockOnSelectCustom}
        />,
      );

      const iconContainer = container.querySelector('.bg-strava-orange\\/10');
      expect(iconContainer).toBeInTheDocument();
    });
  });

  describe('template categories', () => {
    it('should display category headers with badge counts', () => {
      const templates = [
        createMockTemplate({ id: '1', category: 'beginner', title: 'Template 1' }),
        createMockTemplate({ id: '2', category: 'beginner', title: 'Template 2' }),
        createMockTemplate({ id: '3', category: 'intermediate', title: 'Template 3' }),
      ];

      render(
        <GoalTemplateSelector
          templates={templates}
          loading={false}
          onSelectTemplate={mockOnSelectTemplate}
          onSelectCustom={mockOnSelectCustom}
        />,
      );

      expect(screen.getByText('Beginner')).toBeInTheDocument();
      expect(screen.getByText('Intermediate')).toBeInTheDocument();

      const beginnerSection = screen.getByText('Beginner').closest('div');
      expect(within(beginnerSection!).getByText('2')).toBeInTheDocument();

      const intermediateSection = screen.getByText('Intermediate').closest('div');
      expect(within(intermediateSection!).getByText('1')).toBeInTheDocument();
    });

    it('should not display empty categories', () => {
      const templates = [createMockTemplate({ category: 'beginner' })];

      render(
        <GoalTemplateSelector
          templates={templates}
          loading={false}
          onSelectTemplate={mockOnSelectTemplate}
          onSelectCustom={mockOnSelectCustom}
        />,
      );

      expect(screen.getByText('Beginner')).toBeInTheDocument();
      expect(screen.queryByText('Intermediate')).not.toBeInTheDocument();
      expect(screen.queryByText('Advanced')).not.toBeInTheDocument();
      expect(screen.queryByText('Challenge')).not.toBeInTheDocument();
    });

    it('should display categories in correct order', () => {
      const templates = [
        createMockTemplate({ id: '1', category: 'challenge' }),
        createMockTemplate({ id: '2', category: 'beginner' }),
        createMockTemplate({ id: '3', category: 'advanced' }),
        createMockTemplate({ id: '4', category: 'intermediate' }),
      ];

      const { container } = render(
        <GoalTemplateSelector
          templates={templates}
          loading={false}
          onSelectTemplate={mockOnSelectTemplate}
          onSelectCustom={mockOnSelectCustom}
        />,
      );

      const categoryHeaders = Array.from(container.querySelectorAll('h2')).map(h => h.textContent);
      expect(categoryHeaders).toEqual(['Beginner', 'Intermediate', 'Advanced', 'Challenge']);
    });

    it('should handle "other" category', () => {
      const templates = [createMockTemplate({ category: 'other' })];

      render(
        <GoalTemplateSelector
          templates={templates}
          loading={false}
          onSelectTemplate={mockOnSelectTemplate}
          onSelectCustom={mockOnSelectCustom}
        />,
      );

      expect(screen.queryByText('Beginner')).not.toBeInTheDocument();
    });
  });

  describe('template cards', () => {
    it('should render template cards in grid layout', () => {
      const templates = [
        createMockTemplate({ id: '1', title: 'Template 1', category: 'beginner' }),
        createMockTemplate({ id: '2', title: 'Template 2', category: 'beginner' }),
      ];

      const { container } = render(
        <GoalTemplateSelector
          templates={templates}
          loading={false}
          onSelectTemplate={mockOnSelectTemplate}
          onSelectCustom={mockOnSelectCustom}
        />,
      );

      expect(screen.getByTestId('template-card-1')).toBeInTheDocument();
      expect(screen.getByTestId('template-card-2')).toBeInTheDocument();

      const grid = container.querySelector('.grid');
      expect(grid).toBeInTheDocument();
      expect(grid).toHaveClass('md:grid-cols-2');
    });

    it('should call onSelectTemplate when template card is clicked', async () => {
      const user = userEvent.setup();
      const templates = [createMockTemplate({ id: '1', title: 'Template 1', category: 'beginner' })];

      render(
        <GoalTemplateSelector
          templates={templates}
          loading={false}
          onSelectTemplate={mockOnSelectTemplate}
          onSelectCustom={mockOnSelectCustom}
        />,
      );

      const templateCard = screen.getByTestId('template-card-1');
      await user.click(templateCard);

      expect(mockOnSelectTemplate).toHaveBeenCalledTimes(1);
      expect(mockOnSelectTemplate).toHaveBeenCalledWith(templates[0]);
    });

    it('should group templates by category correctly', () => {
      const templates = [
        createMockTemplate({ id: '1', title: 'Beginner 1', category: 'beginner' }),
        createMockTemplate({ id: '2', title: 'Advanced 1', category: 'advanced' }),
        createMockTemplate({ id: '3', title: 'Beginner 2', category: 'beginner' }),
      ];

      render(
        <GoalTemplateSelector
          templates={templates}
          loading={false}
          onSelectTemplate={mockOnSelectTemplate}
          onSelectCustom={mockOnSelectCustom}
        />,
      );

      const beginnerSection = screen.getByText('Beginner').closest('div')!.parentElement;
      expect(within(beginnerSection!).getByTestId('template-card-1')).toBeInTheDocument();
      expect(within(beginnerSection!).getByTestId('template-card-3')).toBeInTheDocument();

      const advancedSection = screen.getByText('Advanced').closest('div')!.parentElement;
      expect(within(advancedSection!).getByTestId('template-card-2')).toBeInTheDocument();
    });
  });

  describe('empty state', () => {
    it('should display custom option even with no templates', () => {
      render(
        <GoalTemplateSelector
          templates={[]}
          loading={false}
          onSelectTemplate={mockOnSelectTemplate}
          onSelectCustom={mockOnSelectCustom}
        />,
      );

      expect(screen.getByText('Custom Goal')).toBeInTheDocument();
    });

    it('should not display any category sections with no templates', () => {
      render(
        <GoalTemplateSelector
          templates={[]}
          loading={false}
          onSelectTemplate={mockOnSelectTemplate}
          onSelectCustom={mockOnSelectCustom}
        />,
      );

      expect(screen.queryByText('Beginner')).not.toBeInTheDocument();
      expect(screen.queryByText('Intermediate')).not.toBeInTheDocument();
      expect(screen.queryByText('Advanced')).not.toBeInTheDocument();
      expect(screen.queryByText('Challenge')).not.toBeInTheDocument();
    });
  });
});
