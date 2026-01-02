import { GoalStatus, GoalPeriodType, GoalTargetType, SportType } from '@/gql/graphql';
import { GoalOrderBy, OrderDirection } from '@/components/goals/constants';

export interface GoalFilter {
  sportType?: SportType | null;
  status?: GoalStatus | null;
  periodType?: GoalPeriodType | null;
  targetType?: GoalTargetType | null;
  orderBy?: GoalOrderBy;
  orderDirection?: OrderDirection;
}

export const DEFAULT_FILTER: GoalFilter = {
  sportType: null,
  status: GoalStatus.Active,
  periodType: null,
  targetType: null,
  orderBy: GoalOrderBy.DEADLINE,
  orderDirection: OrderDirection.ASC,
};

export type GoalErrorType = 'network' | 'validation' | 'not_found' | 'permission_denied' | 'unknown';

export interface GoalError {
  type: GoalErrorType;
  message: string;
  details?: unknown;
}
