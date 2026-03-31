'use client';

import { useCallback, useState } from 'react';
import { useRouter } from '@/i18n/navigation';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { useMutation } from '@/lib/graphql';
import {
  CreateGoalDocument,
  CreateGoalFromTemplateDocument,
  UpdateGoalDocument,
  DeleteGoalDocument,
  ArchiveGoalDocument,
  type CreateGoalInput,
  type CreateGoalFromTemplateInput,
  type UpdateGoalInput,
  type GoalDetailFragment,
} from '@/gql/graphql';
import { getFragmentData } from '@/gql/fragment-masking';
import { GoalDetailFragmentDoc } from '@/gql/graphql';

interface UseCreateGoalResult {
  createGoal: (input: CreateGoalInput) => Promise<GoalDetailFragment | null>;
  loading: boolean;
  error: Error | undefined;
}

export function useCreateGoal(): UseCreateGoalResult {
  const router = useRouter();
  const t = useTranslations('goals');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | undefined>();

  const [createGoalMutation] = useMutation(CreateGoalDocument, {
    refetchQueries: ['Goals', 'ActiveGoals'],
    awaitRefetchQueries: true,
  });

  const createGoal = useCallback(
    async (input: CreateGoalInput) => {
      setIsLoading(true);
      setError(undefined);

      try {
        const result = await createGoalMutation({ variables: { input } });

        if (!result.data?.createGoal) {
          throw new Error('Failed to create goal');
        }

        const goal = getFragmentData(GoalDetailFragmentDoc, result.data.createGoal);

        toast.success(t('create.success'));
        router.push('/goals');

        return goal;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        setError(error);
        toast.error(t('create.error'));
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [createGoalMutation, router, t],
  );

  return {
    createGoal,
    loading: isLoading,
    error,
  };
}

interface UseCreateGoalFromTemplateResult {
  createFromTemplate: (input: CreateGoalFromTemplateInput) => Promise<GoalDetailFragment | null>;
  loading: boolean;
  error: Error | undefined;
}

export function useCreateGoalFromTemplate(): UseCreateGoalFromTemplateResult {
  const router = useRouter();
  const t = useTranslations('goals');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | undefined>();

  const [createFromTemplateMutation] = useMutation(CreateGoalFromTemplateDocument, {
    refetchQueries: ['Goals', 'ActiveGoals'],
    awaitRefetchQueries: true,
  });

  const createFromTemplate = useCallback(
    async (input: CreateGoalFromTemplateInput) => {
      setIsLoading(true);
      setError(undefined);

      try {
        const result = await createFromTemplateMutation({ variables: { input } });

        if (!result.data?.createGoalFromTemplate) {
          throw new Error('Failed to create goal from template');
        }

        const goal = getFragmentData(GoalDetailFragmentDoc, result.data.createGoalFromTemplate);

        toast.success(t('create.success'));
        router.push('/goals');

        return goal;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        setError(error);
        toast.error(t('create.error'));
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [createFromTemplateMutation, router, t],
  );

  return {
    createFromTemplate,
    loading: isLoading,
    error,
  };
}

interface UseUpdateGoalResult {
  updateGoal: (id: number, input: UpdateGoalInput) => Promise<GoalDetailFragment | null>;
  loading: boolean;
  error: Error | undefined;
}

export function useUpdateGoal(): UseUpdateGoalResult {
  const t = useTranslations('goals');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | undefined>();

  const [updateGoalMutation] = useMutation(UpdateGoalDocument);

  const updateGoal = useCallback(
    async (id: number, input: UpdateGoalInput) => {
      setIsLoading(true);
      setError(undefined);

      try {
        const result = await updateGoalMutation({ variables: { id, input } });

        if (!result.data?.updateGoal) {
          throw new Error('Failed to update goal');
        }

        const goal = getFragmentData(GoalDetailFragmentDoc, result.data.updateGoal);

        toast.success(t('update.success'));

        return goal;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        setError(error);
        toast.error(t('update.error'));
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [updateGoalMutation, t],
  );

  return {
    updateGoal,
    loading: isLoading,
    error,
  };
}

interface UseDeleteGoalResult {
  deleteGoal: (id: number) => Promise<boolean>;
  loading: boolean;
  error: Error | undefined;
}

export function useDeleteGoal(): UseDeleteGoalResult {
  const router = useRouter();
  const t = useTranslations('goals');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | undefined>();

  const [deleteGoalMutation] = useMutation(DeleteGoalDocument, {
    refetchQueries: ['Goals', 'ActiveGoals'],
    awaitRefetchQueries: true,
  });

  const deleteGoal = useCallback(
    async (id: number) => {
      setIsLoading(true);
      setError(undefined);

      try {
        const result = await deleteGoalMutation({ variables: { id } });

        if (!result.data?.deleteGoal) {
          throw new Error('Failed to delete goal');
        }

        toast.success(t('delete.success'));
        router.push('/goals');

        return true;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        setError(error);
        toast.error(t('delete.error'));
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [deleteGoalMutation, router, t],
  );

  return {
    deleteGoal,
    loading: isLoading,
    error,
  };
}

interface UseArchiveGoalResult {
  archiveGoal: (id: number) => Promise<GoalDetailFragment | null>;
  loading: boolean;
  error: Error | undefined;
}

export function useArchiveGoal(): UseArchiveGoalResult {
  const t = useTranslations('goals');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | undefined>();

  const [archiveGoalMutation] = useMutation(ArchiveGoalDocument, {
    refetchQueries: ['Goals', 'ActiveGoals'],
    awaitRefetchQueries: true,
  });

  const archiveGoal = useCallback(
    async (id: number) => {
      setIsLoading(true);
      setError(undefined);

      try {
        const result = await archiveGoalMutation({ variables: { id } });

        if (!result.data?.archiveGoal) {
          throw new Error('Failed to archive goal');
        }

        const goal = getFragmentData(GoalDetailFragmentDoc, result.data.archiveGoal);

        toast.success(t('archive.success'));

        return goal;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        setError(error);
        toast.error(t('archive.error'));
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [archiveGoalMutation, t],
  );

  return {
    archiveGoal,
    loading: isLoading,
    error,
  };
}
