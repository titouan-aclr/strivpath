'use client';

import { use } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { AlertCircle, Loader2 } from 'lucide-react';
import { GoalForm } from '@/components/goals/goal-form';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useGoalDetail } from '@/lib/goals/use-goal-detail';
import { useUpdateGoal } from '@/lib/goals/use-goal-mutations';
import { useAvailableSports } from '@/lib/sports/hooks';
import { transformFormDataToUpdateInput } from '@/lib/goals/form-utils';
import type { GoalFormData } from '@/lib/goals/validation';

interface EditGoalPageProps {
  params: Promise<{
    id: string;
    locale: string;
  }>;
}

export default function EditGoalPage({ params }: EditGoalPageProps) {
  const unwrappedParams = use(params);
  const router = useRouter();
  const t = useTranslations('goals');

  const goalId = parseInt(unwrappedParams.id, 10);

  if (isNaN(goalId) || goalId <= 0) {
    return (
      <div className="container py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{t('detail.error.title')}</AlertTitle>
          <AlertDescription>{t('detail.error.description')}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const { goal, loading: loadingGoal, error: goalError } = useGoalDetail({ id: goalId });
  const { updateGoal, loading: updating } = useUpdateGoal();
  const { availableSports } = useAvailableSports();

  const handleBack = () => {
    router.push(`/goals/${goalId}`);
  };

  const handleSubmit = async (formData: GoalFormData) => {
    const input = transformFormDataToUpdateInput(formData);
    const result = await updateGoal(goalId, input);

    if (result) {
      router.push(`/goals/${goalId}`);
    }
  };

  if (loadingGoal) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-strava-orange" />
      </div>
    );
  }

  if (goalError || !goal) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold mb-2">{t('detail.notFound.title')}</h1>
        <p className="text-muted-foreground mb-4">{t('detail.notFound.description')}</p>
      </div>
    );
  }

  const initialData: GoalFormData = {
    title: goal.title,
    description: goal.description || '',
    targetType: goal.targetType,
    targetValue: goal.targetValue,
    periodType: goal.periodType,
    sportType: goal.sportType ?? null,
    isRecurring: goal.isRecurring,
    startDate: new Date(goal.startDate),
    endDate: goal.endDate ? new Date(goal.endDate) : null,
  };

  return (
    <div className="container max-w-4xl mx-auto py-8">
      <GoalForm
        mode="edit"
        initialData={initialData}
        availableSports={availableSports}
        onSubmit={handleSubmit}
        onBack={handleBack}
        loading={updating}
      />
    </div>
  );
}
