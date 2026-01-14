'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { PlusCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { GoalTemplateCard } from './goal-template-card';
import type { GoalTemplateInfoFragment } from '@/gql/graphql';

interface GoalTemplateSelectorProps {
  templates: GoalTemplateInfoFragment[];
  loading: boolean;
  onSelectTemplate: (template: GoalTemplateInfoFragment) => void;
  onSelectCustom: () => void;
}

export function GoalTemplateSelector({
  templates,
  loading,
  onSelectTemplate,
  onSelectCustom,
}: GoalTemplateSelectorProps) {
  const t = useTranslations('goals');

  const groupedTemplates = useMemo(() => {
    const groups: Record<string, GoalTemplateInfoFragment[]> = {};
    templates.forEach(template => {
      const category = template.category || 'other';
      if (!groups[category]) groups[category] = [];
      groups[category].push(template);
    });
    return groups;
  }, [templates]);

  const categoryOrder = ['beginner', 'intermediate', 'advanced', 'challenge'];

  if (loading) {
    return <TemplateSelectorSkeleton />;
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold">{t('create.templateSelector.title')}</h1>
        <p className="mt-2 text-muted-foreground">{t('create.templateSelector.description')}</p>
      </div>

      <Card
        className="cursor-pointer transition-all hover:shadow-lg hover:border-strava-orange/50"
        onClick={onSelectCustom}
        role="button"
        tabIndex={0}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onSelectCustom();
          }
        }}
      >
        <CardContent className="flex items-center gap-4 p-6">
          <div className="p-3 rounded-lg bg-strava-orange/10">
            <PlusCircle className="h-6 w-6 text-strava-orange" aria-hidden="true" />
          </div>
          <div>
            <h3 className="font-semibold">{t('create.templateSelector.custom.title')}</h3>
            <p className="text-sm text-muted-foreground">{t('create.templateSelector.custom.description')}</p>
          </div>
        </CardContent>
      </Card>

      {categoryOrder.map(category => {
        const categoryTemplates = groupedTemplates[category];
        if (!categoryTemplates || categoryTemplates.length === 0) return null;

        return (
          <div key={category} className="space-y-4">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold">{t(`create.templateSelector.categories.${category}`)}</h2>
              <Badge variant="secondary">{categoryTemplates.length}</Badge>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {categoryTemplates.map(template => (
                <GoalTemplateCard key={template.id} template={template} onSelect={() => onSelectTemplate(template)} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TemplateSelectorSkeleton() {
  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <Skeleton className="h-9 w-64 mx-auto" />
        <Skeleton className="h-5 w-96 mx-auto" />
      </div>
      <Skeleton className="h-24 w-full" />
      <div className="grid gap-4 md:grid-cols-2">
        {[1, 2, 3, 4].map(i => (
          <Skeleton key={i} className="h-48 w-full" />
        ))}
      </div>
    </div>
  );
}
