'use client';

import { useState } from 'react';
import { useRouter } from '@/i18n/navigation';
import { GoalCreationProgress } from '@/components/goals/goal-creation-progress';
import { GoalTemplateSelector } from '@/components/goals/goal-template-selector';
import { GoalForm } from '@/components/goals/goal-form';
import { useGoalTemplates } from '@/lib/goals/use-goal-templates';
import { useCreateGoal } from '@/lib/goals/use-goal-mutations';
import { useAvailableSports } from '@/lib/sports/hooks';
import { transformFormDataToInput } from '@/lib/goals/form-utils';
import { GoalTargetType, GoalPeriodType, type GoalTemplateInfoFragment } from '@/gql/graphql';
import type { GoalFormData } from '@/lib/goals/validation';

export default function NewGoalPage() {
  const router = useRouter();

  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [formData, setFormData] = useState<GoalFormData>({
    title: '',
    description: '',
    targetType: GoalTargetType.Distance,
    targetValue: 0,
    periodType: GoalPeriodType.Weekly,
    sportType: null,
    isRecurring: false,
    startDate: new Date(),
    endDate: null,
  });

  const { templates, loading: templatesLoading } = useGoalTemplates();
  const { createGoal, loading: createLoading } = useCreateGoal();
  const { availableSports } = useAvailableSports();

  const handleTemplateSelect = (template: GoalTemplateInfoFragment | null) => {
    if (template) {
      setFormData({
        title: template.title,
        description: template.description || '',
        targetType: template.targetType,
        targetValue: template.targetValue,
        periodType: template.periodType,
        sportType: template.sportType ?? null,
        isRecurring: false,
        startDate: new Date(),
        endDate: null,
      });
    }

    setCurrentStep(2);
  };

  const handleBack = () => {
    if (currentStep === 2) {
      setCurrentStep(1);
    } else {
      router.push('/goals');
    }
  };

  const handleSubmit = async (data: GoalFormData) => {
    const input = transformFormDataToInput(data);
    await createGoal(input);
  };

  return (
    <div className="container max-w-4xl mx-auto py-8">
      <GoalCreationProgress currentStep={currentStep} />

      {currentStep === 1 && (
        <GoalTemplateSelector
          templates={templates}
          loading={templatesLoading}
          onSelectTemplate={handleTemplateSelect}
          onSelectCustom={() => handleTemplateSelect(null)}
        />
      )}

      {currentStep === 2 && (
        <GoalForm
          mode="create"
          initialData={formData}
          availableSports={availableSports}
          onSubmit={handleSubmit}
          onBack={handleBack}
          loading={createLoading}
        />
      )}
    </div>
  );
}
