'use client';

import { useState, useMemo, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
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
  const [isMobile, setIsMobile] = useState(false);
  const [tempRange, setTempRange] = useState<{ start?: Date; end?: Date }>({
    start: startDate,
    end: endDate,
  });

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTempRange({ start: startDate, end: endDate });
    }
  }, [isOpen, startDate, endDate]);

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

  const handleQuickSelect = (start?: Date, end?: Date) => {
    onChange(start, end);
    setIsOpen(false);
  };

  if (isMobile) {
    return (
      <>
        <Button variant="outline" className="w-full" onClick={() => setIsOpen(true)}>
          <CalendarIcon className="mr-2 h-4 w-4" />
          {dateRangeLabel}
        </Button>

        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetContent side="bottom" className="h-[85vh]">
            <SheetHeader>
              <SheetTitle>{t('quickSelect')}</SheetTitle>
            </SheetHeader>

            <div className="space-y-6 mt-6 overflow-y-auto max-h-[calc(85vh-140px)]">
              <div>
                <div className="grid grid-cols-2 gap-2">
                  {DATE_RANGE_PRESETS.map(preset => {
                    const { start, end } = preset.getValue();
                    const isActive =
                      ((!start && !startDate) ||
                        (start && startDate && start.toDateString() === startDate.toDateString())) &&
                      ((!end && !endDate) || (end && endDate && end.toDateString() === endDate.toDateString()));

                    return (
                      <Badge
                        key={preset.label}
                        variant={isActive ? 'default' : 'outline'}
                        className="cursor-pointer py-2.5 px-3 justify-center text-center hover:bg-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        onClick={() => handleQuickSelect(start, end)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e: React.KeyboardEvent) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleQuickSelect(start, end);
                          }
                        }}
                      >
                        {t(preset.label.split('.').pop()!)}
                      </Badge>
                    );
                  })}
                </div>
              </div>

              <Separator />

              <div>
                <p className="text-sm font-medium mb-3">{t('customRange')}</p>
                <Calendar
                  mode="range"
                  selected={{ from: tempRange.start, to: tempRange.end }}
                  onSelect={range => setTempRange({ start: range?.from, end: range?.to })}
                  numberOfMonths={1}
                  className="w-full"
                />
              </div>
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-4 bg-background border-t flex gap-3">
              <Button variant="outline" onClick={() => setIsOpen(false)} className="flex-1">
                {t('cancel')}
              </Button>
              <Button onClick={handleApply} className="flex-1">
                {t('apply')}
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </>
    );
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full md:w-auto">
          <CalendarIcon className="mr-2 h-4 w-4" />
          {dateRangeLabel}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="p-0 w-auto" align="start" sideOffset={4}>
        <div className="p-4 space-y-4">
          <div>
            <p className="text-sm font-medium mb-3">{t('quickSelect')}</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {DATE_RANGE_PRESETS.map(preset => {
                const { start, end } = preset.getValue();
                const isActive =
                  ((!start && !startDate) ||
                    (start && startDate && start.toDateString() === startDate.toDateString())) &&
                  ((!end && !endDate) || (end && endDate && end.toDateString() === endDate.toDateString()));

                return (
                  <Badge
                    key={preset.label}
                    variant={isActive ? 'default' : 'outline'}
                    className="cursor-pointer py-1.5 px-3 justify-center text-center hover:bg-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    onClick={() => handleQuickSelect(start, end)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e: React.KeyboardEvent) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleQuickSelect(start, end);
                      }
                    }}
                  >
                    {t(preset.label.split('.').pop()!)}
                  </Badge>
                );
              })}
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
