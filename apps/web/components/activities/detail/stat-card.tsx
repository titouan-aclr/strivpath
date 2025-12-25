import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  subValue?: string;
  highlight?: boolean;
}

export function StatCard({ label, value, icon: Icon, subValue, highlight }: StatCardProps) {
  return (
    <Card className={cn(highlight && 'border-strava-orange/50')}>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          {Icon && (
            <div className="p-1.5 rounded-md bg-strava-orange/10">
              <Icon className="h-4 w-4 text-strava-orange" aria-hidden="true" />
            </div>
          )}
          <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">{value}</p>
        {subValue && <p className="text-xs text-muted-foreground mt-1">{subValue}</p>}
      </CardContent>
    </Card>
  );
}
