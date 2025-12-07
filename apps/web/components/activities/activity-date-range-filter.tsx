'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Separator } from '@/components/ui/separator';
import { DATE_RANGE_PRESETS } from '@/lib/activities/constants';
import { formatDate } from '@/lib/activities/formatters';

interface ActivityDateRangeFilterProps {
  startDate?: Date;
  endDate?: Date;
  onChange: (startDate?: Date, endDate?: Date) => void;
}

export function ActivityDateRangeFilter({ startDate, endDate, onChange }: ActivityDateRangeFilterProps) {
  const t = useTranslations('activities.filters.dateRange');
  const [isOpen, setIsOpen] = useState(false);
  const [tempRange, setTempRange] = useState<{ start?: Date; end?: Date }>({
    start: startDate,
    end: endDate,
  });

  const dateRangeLabel = useMemo(() => {
    if (!startDate && !endDate) {
      return t('allTime');
    }

    const matchingPreset = DATE_RANGE_PRESETS.find(preset => {
      const { start, end } = preset.getValue();
      const startMatches =
        (!start && !startDate) || (start && startDate && start.toDateString() === startDate.toDateString());
      const endMatches = (!end && !endDate) || (end && endDate && end.toDateString() === endDate.toDateString());
      return startMatches && endMatches;
    });

    if (matchingPreset) {
      return t(matchingPreset.label.split('.').pop()!);
    }

    return `${formatDate(startDate, 'en', 'short')} - ${formatDate(endDate, 'en', 'short')}`;
  }, [startDate, endDate, t]);

  const handleApply = () => {
    onChange(tempRange.start, tempRange.end);
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full md:w-auto">
          <CalendarIcon className="mr-2 h-4 w-4" />
          {dateRangeLabel}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-4 space-y-4">
          <div>
            <p className="text-sm font-medium mb-2">{t('quickSelect')}</p>
            <div className="space-y-1">
              {DATE_RANGE_PRESETS.map(preset => (
                <Button
                  key={preset.label}
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => {
                    const { start, end } = preset.getValue();
                    onChange(start, end);
                    setIsOpen(false);
                  }}
                >
                  {t(preset.label.split('.').pop()!)}
                </Button>
              ))}
            </div>
          </div>

          <Separator />

          <div>
            <p className="text-sm font-medium mb-2">{t('customRange')}</p>
            <Calendar
              mode="range"
              selected={{ from: tempRange.start, to: tempRange.end }}
              onSelect={range => setTempRange({ start: range?.from, end: range?.to })}
              numberOfMonths={2}
            />
            <div className="flex gap-2 mt-3">
              <Button variant="outline" onClick={() => setIsOpen(false)} className="flex-1">
                {t('cancel')}
              </Button>
              <Button onClick={handleApply} className="flex-1">
                {t('apply')}
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
