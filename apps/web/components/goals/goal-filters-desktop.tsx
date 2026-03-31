'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronDown, ChevronUp, SlidersHorizontal } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GoalFilter, DEFAULT_FILTER } from '@/lib/goals/types';
import { cn } from '@/lib/utils';
import {
  SPORT_TYPE_OPTIONS,
  STATUS_OPTIONS,
  PERIOD_TYPE_OPTIONS,
  TARGET_TYPE_OPTIONS,
  SORT_OPTIONS,
} from './constants';

export interface GoalFiltersDesktopProps {
  filter: GoalFilter;
  onFilterChange: (filter: GoalFilter) => void;
}

export function GoalFiltersDesktop({ filter, onFilterChange }: GoalFiltersDesktopProps) {
  const t = useTranslations('goals');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const getCurrentSortValue = (): string => {
    const option = SORT_OPTIONS.find(
      opt => opt.orderBy === filter.orderBy && opt.orderDirection === filter.orderDirection,
    );
    return option?.value ?? SORT_OPTIONS[2].value;
  };

  const handleSortChange = (value: string) => {
    const option = SORT_OPTIONS.find(opt => opt.value === value);
    if (option) {
      onFilterChange({
        ...filter,
        orderBy: option.orderBy,
        orderDirection: option.orderDirection,
      });
    }
  };

  const hasAdvancedFilters = filter.sportType !== null || filter.periodType !== null || filter.targetType !== null;

  return (
    <div className="space-y-4">
      {/* Primary Filters - Always Visible */}
      <div className="flex items-end gap-6 flex-wrap">
        <div className="flex-1 min-w-[240px]">
          <label className="text-sm font-medium mb-2 block">{t('filters.status.label')}</label>
          <div className="flex gap-2 flex-wrap" role="radiogroup" aria-label={t('filters.status.label')}>
            {STATUS_OPTIONS.map(option => {
              const isSelected = filter.status === option.value;
              return (
                <Badge
                  key={option.value ?? 'all'}
                  variant={isSelected ? 'default' : 'outline'}
                  className="cursor-pointer py-1.5 transition-all"
                  onClick={() => onFilterChange({ ...filter, status: option.value })}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onFilterChange({ ...filter, status: option.value });
                    }
                  }}
                  tabIndex={0}
                  role="radio"
                  aria-checked={isSelected}
                >
                  {t(option.label)}
                </Badge>
              );
            })}
          </div>
        </div>

        <div className="flex items-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className={cn('gap-2', hasAdvancedFilters && 'border-primary text-primary')}
          >
            <SlidersHorizontal className="h-4 w-4" />
            {t('filters.moreFilters')}
            {hasAdvancedFilters && <span className="font-semibold">({countActiveFilters(filter)})</span>}
            {showAdvancedFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>

          {(hasAdvancedFilters || filter.status !== DEFAULT_FILTER.status) && (
            <Button variant="ghost" onClick={() => onFilterChange(DEFAULT_FILTER)} size="sm">
              {t('filters.clear')}
            </Button>
          )}
        </div>

        <div className="min-w-[200px]">
          <label className="text-sm font-medium mb-2 block">{t('filters.sort.label')}</label>
          <Select value={getCurrentSortValue()} onValueChange={handleSortChange}>
            <SelectTrigger>
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

      {/* Advanced Filters - Collapsible */}
      {showAdvancedFilters && (
        <div className="space-y-4 pt-4 border-t animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-end gap-6 flex-wrap">
            <div className="flex-1 min-w-[240px]">
              <label className="text-sm font-medium mb-2 block">{t('filters.sport.label')}</label>
              <div className="flex gap-2 flex-wrap" role="radiogroup" aria-label={t('filters.sport.label')}>
                {SPORT_TYPE_OPTIONS.map(option => {
                  const isSelected = filter.sportType === option.value;
                  const Icon = option.icon;
                  return (
                    <Badge
                      key={option.value ?? 'all'}
                      variant={isSelected ? 'default' : 'outline'}
                      className="cursor-pointer py-1.5 transition-all"
                      onClick={() => onFilterChange({ ...filter, sportType: option.value })}
                      onKeyDown={e => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          onFilterChange({ ...filter, sportType: option.value });
                        }
                      }}
                      tabIndex={0}
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

            <div className="flex-1 min-w-[240px]">
              <label className="text-sm font-medium mb-2 block">{t('filters.period.label')}</label>
              <div className="flex gap-2 flex-wrap" role="radiogroup" aria-label={t('filters.period.label')}>
                {PERIOD_TYPE_OPTIONS.map(option => {
                  const isSelected = filter.periodType === option.value;
                  return (
                    <Badge
                      key={option.value ?? 'all'}
                      variant={isSelected ? 'default' : 'outline'}
                      className="cursor-pointer py-1.5 transition-all"
                      onClick={() => onFilterChange({ ...filter, periodType: option.value })}
                      onKeyDown={e => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          onFilterChange({ ...filter, periodType: option.value });
                        }
                      }}
                      tabIndex={0}
                      role="radio"
                      aria-checked={isSelected}
                    >
                      {t(option.label)}
                    </Badge>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex items-end gap-6 flex-wrap">
            <div className="flex-1 min-w-[240px]">
              <label className="text-sm font-medium mb-2 block">{t('filters.target.label')}</label>
              <div className="flex gap-2 flex-wrap" role="radiogroup" aria-label={t('filters.target.label')}>
                {TARGET_TYPE_OPTIONS.map(option => {
                  const isSelected = filter.targetType === option.value;
                  return (
                    <Badge
                      key={option.value ?? 'all'}
                      variant={isSelected ? 'default' : 'outline'}
                      className="cursor-pointer py-1.5 transition-all"
                      onClick={() => onFilterChange({ ...filter, targetType: option.value })}
                      onKeyDown={e => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          onFilterChange({ ...filter, targetType: option.value });
                        }
                      }}
                      tabIndex={0}
                      role="radio"
                      aria-checked={isSelected}
                    >
                      {t(option.label)}
                    </Badge>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function countActiveFilters(filter: GoalFilter): number {
  let count = 0;
  if (filter.sportType !== null) count++;
  if (filter.periodType !== null) count++;
  if (filter.targetType !== null) count++;
  return count;
}
