import type { GoalStatus, SportType } from '@/gql/graphql';

export interface GoalFilters {
  status?: GoalStatus;
  sportType?: SportType;
  includeArchived?: boolean;
}

export interface GoalSortOptions {
  field: 'progress' | 'deadline' | 'createdAt';
  direction: 'asc' | 'desc';
}

export type GoalErrorType = 'network' | 'validation' | 'not_found' | 'permission_denied' | 'unknown';

export interface GoalError {
  type: GoalErrorType;
  message: string;
  details?: unknown;
}
