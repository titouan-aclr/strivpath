'use client';

import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';
import type { SportColorConfig } from '@/lib/sports/config';

export interface TrendInfo {
  value: number;
  isPositive: boolean;
}

export interface StatCardProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  trend?: TrendInfo;
  className?: string;
  sportColor?: SportColorConfig;
}

export function StatCard({ label, value, icon: Icon, trend, className, sportColor }: StatCardProps) {
  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <p className="text-3xl font-bold tracking-tight">{value}</p>
            {trend && (
              <div
                className={cn('flex items-center gap-1 text-sm', trend.isPositive ? 'text-green-600' : 'text-red-600')}
              >
                <span aria-hidden="true">{trend.isPositive ? '↑' : '↓'}</span>
                <span>
                  {trend.isPositive ? '+' : '-'}
                  {trend.value}%
                </span>
              </div>
            )}
          </div>
          {Icon && (
            <div className={cn('p-2.5 rounded-lg', sportColor?.bgMuted ?? 'bg-strava-orange/10')}>
              <Icon className={cn('h-5 w-5', sportColor?.text ?? 'text-strava-orange')} aria-hidden="true" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
