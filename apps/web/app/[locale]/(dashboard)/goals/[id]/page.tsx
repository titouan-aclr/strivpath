'use client';

import { GoalCompletedMessage } from '@/components/goals/goal-completed-message';
import { GoalDetailError } from '@/components/goals/goal-detail-error';
import { GoalDetailHeader } from '@/components/goals/goal-detail-header';
import { GoalDetailSkeleton } from '@/components/goals/goal-detail-skeleton';
import { GoalDetailsCard } from '@/components/goals/goal-details-card';
import { GoalFailedMessage } from '@/components/goals/goal-failed-message';
import { GoalProgressCard } from '@/components/goals/goal-progress-card';
import { Button } from '@/components/ui/button';
import { GoalStatus } from '@/gql/graphql';
import { useGoalDetail } from '@/lib/goals/use-goal-detail';
import { ArrowLeft } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
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
  const locale = useLocale();
  const t = useTranslations('goals.detail');
  const goalId = parseInt(unwrappedParams.id, 10);
  const { goal, loading, error } = useGoalDetail({ id: goalId });
  const { width, height } = useWindowSize();
  const [showConfetti, setShowConfetti] = useState(false);
  const hasCelebrated = useRef(false);

  useEffect(() => {
    if (goal?.status === GoalStatus.Completed && !hasCelebrated.current) {
      setShowConfetti(true);
      hasCelebrated.current = true;
      setTimeout(() => setShowConfetti(false), 5000);
    }
  }, [goal?.status]);

  if (loading) {
    return <GoalDetailSkeleton />;
  }

  if (error || !goal) {
    return <GoalDetailError />;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {showConfetti && <Confetti width={width} height={height} recycle={false} numberOfPieces={200} />}

      <Button asChild variant="ghost" size="sm">
        <Link href={`/${locale}/goals`}>
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
