import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GoalTemplateCard } from './goal-template-card';
import { GoalTargetType, GoalPeriodType, SportType } from '@/gql/graphql';
import type { GoalTemplateInfoFragment } from '@/gql/graphql';

const mockUseTranslations = (namespace?: string) => (key: string) => {
  const translations: Record<string, string> = {
    'goals.periodTypes.weekly': 'Weekly',
    'goals.periodTypes.monthly': 'Monthly',
    'goals.periodTypes.yearly': 'Yearly',
    'goals.create.templateSelector.recurring': 'Recurring',
  };
  const fullKey = namespace ? `${namespace}.${key}` : key;
  return translations[fullKey] || key;
};

vi.mock('next-intl', () => ({
  useTranslations: (namespace?: string) => mockUseTranslations(namespace),
}));

describe('GoalTemplateCard', () => {
  const mockTemplate: GoalTemplateInfoFragment = {
    id: '1',
    title: 'Run 50km this month',
    description: 'Build endurance with consistent running',
    targetType: GoalTargetType.Distance,
    targetValue: 50,
    periodType: GoalPeriodType.Monthly,
    sportType: SportType.Run,
    category: 'intermediate',
    isPreset: true,
    createdAt: new Date('2025-01-01T00:00:00.000Z'),
  };

  const mockOnSelect = vi.fn();

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should render template title', () => {
    render(<GoalTemplateCard template={mockTemplate} onSelect={mockOnSelect} />);

    expect(screen.getByText('Run 50km this month')).toBeInTheDocument();
  });

  it('should render template description', () => {
    render(<GoalTemplateCard template={mockTemplate} onSelect={mockOnSelect} />);

    expect(screen.getByText('Build endurance with consistent running')).toBeInTheDocument();
  });

  it('should render formatted target value', () => {
    render(<GoalTemplateCard template={mockTemplate} onSelect={mockOnSelect} />);

    expect(screen.getByText('50')).toBeInTheDocument();
  });

  it('should render period type badge', () => {
    render(<GoalTemplateCard template={mockTemplate} onSelect={mockOnSelect} />);

    expect(screen.getByText('Monthly')).toBeInTheDocument();
  });

  it('should render recurring badge when isPreset is true', () => {
    render(<GoalTemplateCard template={mockTemplate} onSelect={mockOnSelect} />);

    expect(screen.getByText('Recurring')).toBeInTheDocument();
  });

  it('should not render recurring badge when isPreset is false', () => {
    const nonPresetTemplate = { ...mockTemplate, isPreset: false };
    render(<GoalTemplateCard template={nonPresetTemplate} onSelect={mockOnSelect} />);

    expect(screen.queryByText('Recurring')).not.toBeInTheDocument();
  });

  it('should render sport icon', () => {
    const { container } = render(<GoalTemplateCard template={mockTemplate} onSelect={mockOnSelect} />);

    const icon = container.querySelector('svg');
    expect(icon).toBeInTheDocument();
  });

  it('should have orange background for sport icon', () => {
    const { container } = render(<GoalTemplateCard template={mockTemplate} onSelect={mockOnSelect} />);

    const iconContainer = container.querySelector('.bg-primary\\/10');
    expect(iconContainer).toBeInTheDocument();
  });

  it('should call onSelect when card is clicked', async () => {
    const user = userEvent.setup();
    render(<GoalTemplateCard template={mockTemplate} onSelect={mockOnSelect} />);

    const card = screen.getByRole('button');
    await user.click(card);

    expect(mockOnSelect).toHaveBeenCalledTimes(1);
  });

  it('should call onSelect when Enter key is pressed', async () => {
    const user = userEvent.setup();
    render(<GoalTemplateCard template={mockTemplate} onSelect={mockOnSelect} />);

    const card = screen.getByRole('button');
    card.focus();
    await user.keyboard('{Enter}');

    expect(mockOnSelect).toHaveBeenCalledTimes(1);
  });

  it('should call onSelect when Space key is pressed', async () => {
    const user = userEvent.setup();
    render(<GoalTemplateCard template={mockTemplate} onSelect={mockOnSelect} />);

    const card = screen.getByRole('button');
    card.focus();
    await user.keyboard(' ');

    expect(mockOnSelect).toHaveBeenCalledTimes(1);
  });

  it('should have hover styles', () => {
    const { container } = render(<GoalTemplateCard template={mockTemplate} onSelect={mockOnSelect} />);

    const card = container.querySelector('.hover\\:shadow-lg');
    expect(card).toBeInTheDocument();

    const borderHover = container.querySelector('.hover\\:border-primary\\/50');
    expect(borderHover).toBeInTheDocument();
  });

  it('should be keyboard accessible with tabIndex', () => {
    render(<GoalTemplateCard template={mockTemplate} onSelect={mockOnSelect} />);

    const card = screen.getByRole('button');
    expect(card).toHaveAttribute('tabIndex', '0');
  });

  it('should render template without description', () => {
    const templateNoDesc = { ...mockTemplate, description: undefined };
    render(<GoalTemplateCard template={templateNoDesc} onSelect={mockOnSelect} />);

    expect(screen.getByText('Run 50km this month')).toBeInTheDocument();
    expect(screen.queryByText('Build endurance with consistent running')).not.toBeInTheDocument();
  });

  it('should render template with null sportType (all sports)', () => {
    const allSportsTemplate = { ...mockTemplate, sportType: null };
    const { container } = render(<GoalTemplateCard template={allSportsTemplate} onSelect={mockOnSelect} />);

    const icon = container.querySelector('svg');
    expect(icon).toBeInTheDocument();
  });
});
