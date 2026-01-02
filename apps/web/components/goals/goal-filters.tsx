'use client';

import { useState, useEffect } from 'react';
import { GoalFilter } from '@/lib/goals/types';
import { GoalFiltersDesktop } from './goal-filters-desktop';
import { GoalFiltersMobile } from './goal-filters-mobile';

export interface GoalFiltersProps {
  filter: GoalFilter;
  onFilterChange: (filter: GoalFilter) => void;
}

export function GoalFilters({ filter, onFilterChange }: GoalFiltersProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (isMobile) {
    return <GoalFiltersMobile filter={filter} onFilterChange={onFilterChange} />;
  }

  return <GoalFiltersDesktop filter={filter} onFilterChange={onFilterChange} />;
}
