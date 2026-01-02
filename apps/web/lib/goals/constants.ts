export const GOAL_TEMPLATES_CATEGORIES = ['beginner', 'intermediate', 'advanced', 'challenge'] as const;

export type GoalTemplateCategory = (typeof GOAL_TEMPLATES_CATEGORIES)[number];

export const GOAL_TARGET_UNITS = {
  DISTANCE: 'km',
  DURATION: 'hours',
  ELEVATION: 'meters',
  FREQUENCY: 'sessions',
} as const;

export const GOALS_PAGE_SIZE = 20;
