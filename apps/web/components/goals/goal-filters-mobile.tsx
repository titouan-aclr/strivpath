'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Filter } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { GoalFilter, DEFAULT_FILTER } from '@/lib/goals/types';
import {
  SPORT_TYPE_OPTIONS,
  STATUS_OPTIONS,
  PERIOD_TYPE_OPTIONS,
  TARGET_TYPE_OPTIONS,
  SORT_OPTIONS,
} from './constants';

export interface GoalFiltersMobileProps {
  filter: GoalFilter;
  onFilterChange: (filter: GoalFilter) => void;
}

export function GoalFiltersMobile({ filter, onFilterChange }: GoalFiltersMobileProps) {
  const t = useTranslations('goals');
  const [isOpen, setIsOpen] = useState(false);
  const [tempFilter, setTempFilter] = useState<GoalFilter>(filter);

  const getCurrentSortValue = (): string => {
    const option = SORT_OPTIONS.find(
      opt => opt.orderBy === tempFilter.orderBy && opt.orderDirection === tempFilter.orderDirection,
    );
    return option?.value ?? SORT_OPTIONS[2].value;
  };

  const handleSortChange = (value: string) => {
    const option = SORT_OPTIONS.find(opt => opt.value === value);
    if (option) {
      setTempFilter({
        ...tempFilter,
        orderBy: option.orderBy,
        orderDirection: option.orderDirection,
      });
    }
  };

  const handleApply = () => {
    onFilterChange(tempFilter);
    setIsOpen(false);
  };

  const handleClear = () => {
    setTempFilter(DEFAULT_FILTER);
    onFilterChange(DEFAULT_FILTER);
    setIsOpen(false);
  };

  useEffect(() => {
    if (isOpen) {
      setTempFilter(filter);
    }
  }, [isOpen, filter]);

  return (
    <>
      <Button variant="outline" onClick={() => setIsOpen(true)} className="w-full">
        <Filter className="mr-2 h-4 w-4" />
        {t('filters.showFilters')}
      </Button>

      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="bottom" className="h-[80vh]">
          <SheetHeader>
            <SheetTitle>{t('filters.title')}</SheetTitle>
          </SheetHeader>

          <div className="space-y-6 mt-6 overflow-y-auto max-h-[calc(80vh-180px)]">
            <div>
              <Label className="mb-3 block">{t('filters.sport.label')}</Label>
              <div className="flex gap-2 flex-wrap" role="radiogroup" aria-label={t('filters.sport.label')}>
                {SPORT_TYPE_OPTIONS.map(option => {
                  const isSelected = tempFilter.sportType === option.value;
                  const Icon = option.icon;
                  return (
                    <Badge
                      key={option.value ?? 'all'}
                      variant={isSelected ? 'default' : 'outline'}
                      className="cursor-pointer py-1.5"
                      onClick={() => setTempFilter({ ...tempFilter, sportType: option.value })}
                      role="radio"
                      aria-checked={isSelected}
                    >
                      <Icon className="h-4 w-4 mr-1" aria-hidden="true" />
                      {t(option.label)}
                    </Badge>
                  );
                })}
              </div>
            </div>

            <div>
              <Label className="mb-3 block">{t('filters.status.label')}</Label>
              <div className="flex gap-2 flex-wrap" role="radiogroup" aria-label={t('filters.status.label')}>
                {STATUS_OPTIONS.map(option => {
                  const isSelected = tempFilter.status === option.value;
                  return (
                    <Badge
                      key={option.value ?? 'all'}
                      variant={isSelected ? 'default' : 'outline'}
                      className="cursor-pointer py-1.5"
                      onClick={() => setTempFilter({ ...tempFilter, status: option.value })}
                      role="radio"
                      aria-checked={isSelected}
                    >
                      {t(option.label)}
                    </Badge>
                  );
                })}
              </div>
            </div>

            <div>
              <Label className="mb-3 block">{t('filters.period.label')}</Label>
              <div className="flex gap-2 flex-wrap" role="radiogroup" aria-label={t('filters.period.label')}>
                {PERIOD_TYPE_OPTIONS.map(option => {
                  const isSelected = tempFilter.periodType === option.value;
                  return (
                    <Badge
                      key={option.value ?? 'all'}
                      variant={isSelected ? 'default' : 'outline'}
                      className="cursor-pointer py-1.5"
                      onClick={() => setTempFilter({ ...tempFilter, periodType: option.value })}
                      role="radio"
                      aria-checked={isSelected}
                    >
                      {t(option.label)}
                    </Badge>
                  );
                })}
              </div>
            </div>

            <div>
              <Label className="mb-3 block">{t('filters.target.label')}</Label>
              <div className="flex gap-2 flex-wrap" role="radiogroup" aria-label={t('filters.target.label')}>
                {TARGET_TYPE_OPTIONS.map(option => {
                  const isSelected = tempFilter.targetType === option.value;
                  return (
                    <Badge
                      key={option.value ?? 'all'}
                      variant={isSelected ? 'default' : 'outline'}
                      className="cursor-pointer py-1.5"
                      onClick={() => setTempFilter({ ...tempFilter, targetType: option.value })}
                      role="radio"
                      aria-checked={isSelected}
                    >
                      {t(option.label)}
                    </Badge>
                  );
                })}
              </div>
            </div>

            <div>
              <Label className="mb-3 block">{t('filters.sort.label')}</Label>
              <Select value={getCurrentSortValue()} onValueChange={handleSortChange}>
                <SelectTrigger className="w-full" aria-label={t('filters.sort.label')}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {t(option.label)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <SheetFooter className="mt-6 gap-3">
            <Button variant="outline" onClick={handleClear} className="flex-1">
              {t('filters.clear')}
            </Button>
            <Button onClick={handleApply} className="flex-1">
              {t('filters.apply')}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}
