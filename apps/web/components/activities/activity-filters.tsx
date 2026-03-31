'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import type { ActivityType } from '@/gql/graphql';
import { SORT_OPTIONS, SPORT_TYPE_CONFIG } from '@/lib/activities/constants';
import type { ActivityFilter } from '@/lib/activities/types';
import { Filter } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { ActivityDateRangeFilter } from './activity-date-range-filter';

interface ActivityFiltersProps {
  filter: ActivityFilter;
  onFilterChange: (filter: ActivityFilter) => void;
}

export function ActivityFilters({ filter, onFilterChange }: ActivityFiltersProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (isMobile) {
    return <ActivityFiltersMobile filter={filter} onFilterChange={onFilterChange} />;
  }

  return <ActivityFiltersDesktop filter={filter} onFilterChange={onFilterChange} />;
}

function ActivityFiltersDesktop({ filter, onFilterChange }: ActivityFiltersProps) {
  const t = useTranslations('activities.filters');
  const tSport = useTranslations();

  const getCurrentSortValue = () => {
    const match = SORT_OPTIONS.find(
      opt => opt.orderBy === filter.orderBy && opt.orderDirection === filter.orderDirection,
    );
    return match?.value ?? 'DATE_DESC';
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

  return (
    <div className="space-y-3">
      <div className="flex items-end gap-4 flex-wrap">
        <div className="min-w-[200px]">
          <Label className="mb-3 block">{t('dateRange.label')}</Label>
          <ActivityDateRangeFilter
            startDate={filter.startDate}
            endDate={filter.endDate}
            onChange={(start, end) => onFilterChange({ ...filter, startDate: start, endDate: end })}
          />
        </div>

        <div className="flex-1 min-w-[280px]">
          <Label className="mb-3 block">{t('sportType.label')}</Label>
          <div className="flex gap-2 flex-wrap" role="radiogroup" aria-label={t('sportType.label')}>
            <Badge
              variant={!filter.type ? 'default' : 'outline'}
              className="cursor-pointer py-1.5"
              onClick={() => onFilterChange({ ...filter, type: undefined })}
              role="radio"
              aria-checked={!filter.type}
              tabIndex={0}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onFilterChange({ ...filter, type: undefined });
                }
              }}
            >
              {t('sportType.all')}
            </Badge>

            {Object.entries(SPORT_TYPE_CONFIG).map(([sportType, config]) => {
              const Icon = config.icon;
              const isSelected = (filter.type as string) === sportType;
              return (
                <Badge
                  key={sportType}
                  variant={isSelected ? 'default' : 'outline'}
                  className="cursor-pointer py-1.5"
                  onClick={() => onFilterChange({ ...filter, type: sportType as ActivityType })}
                  role="radio"
                  aria-checked={isSelected}
                  tabIndex={0}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onFilterChange({ ...filter, type: sportType as ActivityType });
                    }
                  }}
                >
                  <Icon className="h-4 w-4 mr-1" aria-hidden="true" />
                  {tSport(config.label)}
                </Badge>
              );
            })}
          </div>
        </div>

        <div className="min-w-[180px]">
          <Label className="mb-3 block">{t('sort.label')}</Label>
          <Select value={getCurrentSortValue()} onValueChange={handleSortChange}>
            <SelectTrigger className="w-full" aria-label={t('sort.label')}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {tSport(option.label)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button variant="outline" onClick={() => onFilterChange({})} className="w-full md:w-auto">
        {t('clear')}
      </Button>
    </div>
  );
}

function ActivityFiltersMobile({ filter, onFilterChange }: ActivityFiltersProps) {
  const t = useTranslations('activities.filters');
  const tSport = useTranslations();
  const [isOpen, setIsOpen] = useState(false);
  const [tempFilter, setTempFilter] = useState<ActivityFilter>(filter);

  const getCurrentSortValue = () => {
    const match = SORT_OPTIONS.find(
      opt => opt.orderBy === tempFilter.orderBy && opt.orderDirection === tempFilter.orderDirection,
    );
    return match?.value ?? 'DATE_DESC';
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
    setTempFilter({});
    onFilterChange({});
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
        {t('showFilters')}
      </Button>

      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="bottom" className="h-[80vh]">
          <SheetHeader>
            <SheetTitle>{t('title')}</SheetTitle>
          </SheetHeader>

          <div className="space-y-6 mt-6 overflow-y-auto max-h-[calc(80vh-180px)]">
            <div>
              <Label className="mb-3 block">{t('sportType.label')}</Label>
              <div className="flex gap-2 flex-wrap" role="radiogroup" aria-label={t('sportType.label')}>
                <Badge
                  variant={!tempFilter.type ? 'default' : 'outline'}
                  className="cursor-pointer py-1.5"
                  onClick={() => setTempFilter({ ...tempFilter, type: undefined })}
                  role="radio"
                  aria-checked={!tempFilter.type}
                >
                  {t('sportType.all')}
                </Badge>

                {Object.entries(SPORT_TYPE_CONFIG).map(([sportType, config]) => {
                  const Icon = config.icon;
                  const isSelected = (tempFilter.type as string) === sportType;
                  return (
                    <Badge
                      key={sportType}
                      variant={isSelected ? 'default' : 'outline'}
                      className="cursor-pointer py-1.5"
                      onClick={() => setTempFilter({ ...tempFilter, type: sportType as ActivityType })}
                      role="radio"
                      aria-checked={isSelected}
                    >
                      <Icon className="h-4 w-4 mr-1" aria-hidden="true" />
                      {tSport(config.label)}
                    </Badge>
                  );
                })}
              </div>
            </div>

            <div>
              <Label className="mb-3 block">{t('dateRange.label')}</Label>
              <ActivityDateRangeFilter
                startDate={tempFilter.startDate}
                endDate={tempFilter.endDate}
                onChange={(start, end) => setTempFilter({ ...tempFilter, startDate: start, endDate: end })}
              />
            </div>

            <div>
              <Label className="mb-3 block">{t('sort.label')}</Label>
              <Select value={getCurrentSortValue()} onValueChange={handleSortChange}>
                <SelectTrigger className="w-full" aria-label={t('sort.label')}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {tSport(option.label)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <SheetFooter className="mt-6 gap-3">
            <Button variant="outline" onClick={handleClear} className="flex-1">
              {t('clear')}
            </Button>
            <Button onClick={handleApply} className="flex-1">
              {t('apply')}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}
