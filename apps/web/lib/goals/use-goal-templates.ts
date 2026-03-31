'use client';

import { useMemo, useCallback } from 'react';
import { useLocale } from 'next-intl';
import { useQuery } from '@/lib/graphql';
import {
  GoalTemplatesDocument,
  GoalTemplateInfoFragmentDoc,
  type GoalTemplateInfoFragment,
  Locale,
} from '@/gql/graphql';
import { getFragmentData } from '@/gql/fragment-masking';

interface UseGoalTemplatesOptions {
  category?: string;
  locale?: string;
}

interface UseGoalTemplatesResult {
  templates: GoalTemplateInfoFragment[];
  loading: boolean;
  error: Error | undefined;
  refetch: () => Promise<unknown>;
}

export function useGoalTemplates(options?: UseGoalTemplatesOptions): UseGoalTemplatesResult {
  const contextLocale = useLocale();

  const locale = options?.locale ?? contextLocale;

  const variables = useMemo(
    () => ({
      category: options?.category,
      locale: locale.toUpperCase() as Locale,
    }),
    [options?.category, locale],
  );

  const {
    data,
    loading,
    error,
    refetch: apolloRefetch,
  } = useQuery(GoalTemplatesDocument, {
    variables,
    fetchPolicy: 'cache-first',
    nextFetchPolicy: 'cache-first',
  });

  const templates = useMemo(() => {
    if (!data?.goalTemplates) return [];
    return data.goalTemplates
      .filter((template): template is NonNullable<typeof template> => template != null)
      .map(template => getFragmentData(GoalTemplateInfoFragmentDoc, template));
  }, [data?.goalTemplates]);

  const refetch = useCallback(async () => {
    return apolloRefetch();
  }, [apolloRefetch]);

  return {
    templates,
    loading,
    error: error as Error | undefined,
    refetch,
  };
}
