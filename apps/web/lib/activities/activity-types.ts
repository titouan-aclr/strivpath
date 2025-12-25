import type { ActivityCardFragment, ActivityDetailFragment as GeneratedActivityDetailFragment } from '@/gql/graphql';

export type ActivityDetail = Omit<GeneratedActivityDetailFragment, ' $fragmentRefs' | ' $fragmentName'> &
  Omit<ActivityCardFragment, ' $fragmentRefs' | ' $fragmentName'>;
