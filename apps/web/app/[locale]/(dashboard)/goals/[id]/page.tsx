'use client';

import { GoalCompletedMessage } from '@/components/goals/goal-completed-message';
import { GoalDetailError } from '@/components/goals/goal-detail-error';
import { GoalDetailHeader } from '@/components/goals/goal-detail-header';
import { GoalDetailSkeleton } from '@/components/goals/goal-detail-skeleton';
import { GoalDetailsCard } from '@/components/goals/goal-details-card';
import { GoalFailedMessage } from '@/components/goals/goal-failed-message';
import { GoalProgressCard } from '@/components/goals/goal-progress-card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { GoalStatus } from '@/gql/graphql';
import { useGoalDetail } from '@/lib/goals/use-goal-detail';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { use, useEffect, useRef, useState } from 'react';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';

interface GoalDetailPageProps {
  params: Promise<{
    id: string;
    locale: string;
  }>;
}

export default function GoalDetailPage({ params }: GoalDetailPageProps) {
  const unwrappedParams = use(params);
  const t = useTranslations('goals.detail');
  const goalId = parseInt(unwrappedParams.id, 10);

  if (isNaN(goalId) || goalId <= 0) {
    return (
      <div className="container py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{t('error.title')}</AlertTitle>
          <AlertDescription>{t('error.description')}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const { goal, loading, error } = useGoalDetail({ id: goalId });
  const { width, height } = useWindowSize();
  const [showConfetti, setShowConfetti] = useState(false);
  const hasCelebrated = useRef(false);

  useEffect(() => {
    if (goal?.status === GoalStatus.Completed && !hasCelebrated.current) {
      setShowConfetti(true);
      hasCelebrated.current = true;

      const timer = setTimeout(() => setShowConfetti(false), 5000);

      return () => clearTimeout(timer);
    }
  }, [goal?.status]);

  if (loading) {
    return <GoalDetailSkeleton />;
  }

  if (error || !goal) {
    return <GoalDetailError />;
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-6">
      {showConfetti && <Confetti width={width} height={height} recycle={false} numberOfPieces={200} />}

      <Button asChild variant="ghost" size="sm">
        <Link href="/goals">
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('backButton')}
        </Link>
      </Button>

      <GoalDetailHeader goal={goal} />

      {goal.status === GoalStatus.Completed && <GoalCompletedMessage />}
      {goal.status === GoalStatus.Failed && <GoalFailedMessage />}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GoalProgressCard goal={goal} />
        <GoalDetailsCard goal={goal} />
      </div>
    </div>
  );
}
