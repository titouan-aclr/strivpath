import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProblemSolutionSection } from './problem-solution-section';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const messages: Record<string, string> = {
      'heading.line1Intro': 'Strava is great at recording',
      'heading.line1Emphasis': 'what you did.',
      'heading.line2Intro': 'But what about',
      'heading.line2Emphasis': "where you're going?",
      'without.title': 'Without StrivPath',
      'without.headline': 'Lots of logged activities with no sense of direction.',
      'without.point1': 'Sessions logged, purpose unknown',
      'without.point2': 'Numbers without narrative',
      'without.point3': 'No milestone to celebrate',
      'with.title': 'With StrivPath',
      'with.headline': 'Goals that give meaning to every session you do.',
      'with.point1': 'Every activity moves you forward',
      'with.point2': 'Progress visible in real time',
      'with.point3': 'Milestones worth celebrating',
    };
    return messages[key] ?? key;
  },
}));

vi.mock('@/components/ui/blur-fade', () => ({
  BlurFade: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe('ProblemSolutionSection', () => {
  it('renders the section heading', () => {
    render(<ProblemSolutionSection />);
    expect(screen.getByText(/strava is great at recording/i)).toBeInTheDocument();
    expect(screen.getByText(/where you're going/i)).toBeInTheDocument();
  });

  it('renders the "Without StrivPath" column', () => {
    render(<ProblemSolutionSection />);
    expect(screen.getByText(/without strivpath/i)).toBeInTheDocument();
    expect(screen.getByText(/no sense of direction/i)).toBeInTheDocument();
  });

  it('renders the "With StrivPath" column', () => {
    render(<ProblemSolutionSection />);
    expect(screen.getByText(/with strivpath/i)).toBeInTheDocument();
    expect(screen.getByText(/give meaning/i)).toBeInTheDocument();
  });

  it('renders the three pain points', () => {
    render(<ProblemSolutionSection />);
    expect(screen.getByText(/sessions logged, purpose unknown/i)).toBeInTheDocument();
    expect(screen.getByText(/numbers without narrative/i)).toBeInTheDocument();
    expect(screen.getByText(/no milestone to celebrate/i)).toBeInTheDocument();
  });

  it('renders the three benefits', () => {
    render(<ProblemSolutionSection />);
    expect(screen.getByText(/every activity moves you forward/i)).toBeInTheDocument();
    expect(screen.getByText(/progress visible in real time/i)).toBeInTheDocument();
    expect(screen.getByText(/milestones worth celebrating/i)).toBeInTheDocument();
  });
});
