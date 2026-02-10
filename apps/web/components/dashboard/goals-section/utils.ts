import type { GoalStatusColorConfig } from '@/components/goals/constants';
import { getGoalStatusColors } from '@/components/goals/constants';
import { GoalStatus } from '@/gql/graphql';
import type { SportColorConfig } from '@/lib/sports/config';

export function getEffectiveStatusColors(
  status: GoalStatus | undefined,
  sportColor?: SportColorConfig,
): GoalStatusColorConfig {
  const baseColors = getGoalStatusColors(status);
  if (!sportColor || status !== GoalStatus.Active) return baseColors;
  return {
    text: sportColor.text,
    textSubtle: sportColor.textMuted,
    bg: sportColor.bg,
    bgSubtle: sportColor.bgMuted,
    border: sportColor.border,
    hoverBorder: baseColors.hoverBorder,
    hex: baseColors.hex,
  };
}
