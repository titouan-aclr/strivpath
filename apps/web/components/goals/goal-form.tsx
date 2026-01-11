'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Loader2, Footprints, Bike, Waves, Activity } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { DatePicker } from './date-picker';
import { GoalTargetType, GoalPeriodType, SportType } from '@/gql/graphql';
import {
  validateGoalField,
  validateGoalForm,
  validateGoalFormForEdit,
  type GoalFormData,
} from '@/lib/goals/validation';
import { getTargetTypeConfig } from '@/lib/goals/form-utils';

interface GoalFormProps {
  mode: 'create' | 'edit';
  initialData: GoalFormData;
  onSubmit: (data: GoalFormData) => Promise<void>;
  onBack: () => void;
  loading: boolean;
}

export function GoalForm({ mode, initialData, onSubmit, onBack, loading }: GoalFormProps) {
  const t = useTranslations('goals');
  const isEditMode = mode === 'edit';

  const [formData, setFormData] = useState<GoalFormData>(initialData);
  const [errors, setErrors] = useState<Partial<Record<keyof GoalFormData, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof GoalFormData, boolean>>>({});

  const areValuesEqual = (a: unknown, b: unknown): boolean => {
    if (a === b) return true;
    if (a == null || b == null) return false;

    if (a instanceof Date && b instanceof Date) {
      return a.getTime() === b.getTime();
    }

    if (typeof a !== 'object' && typeof b !== 'object') {
      return a === b;
    }

    return false;
  };

  const isDirty = useMemo(() => {
    if (mode === 'create') return true;

    const fieldsToCheck: (keyof GoalFormData)[] = ['title', 'description', 'targetValue', 'endDate'];

    return fieldsToCheck.some(field => !areValuesEqual(formData[field], initialData[field]));
  }, [formData, initialData, mode]);

  const updateField = <K extends keyof GoalFormData>(field: K, value: GoalFormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setTouched(prev => ({ ...prev, [field]: true }));

    const error = validateGoalField(field, value, { ...formData, [field]: value }, t);
    setErrors(prev => ({ ...prev, [field]: error || undefined }));
  };

  const handleBlur = <K extends keyof GoalFormData>(field: K) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    const error = validateGoalField(field, formData[field], formData, t);
    setErrors(prev => ({ ...prev, [field]: error || undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationErrors = isEditMode ? validateGoalFormForEdit(formData, t) : validateGoalForm(formData, t);
    setErrors(validationErrors);
    setTouched({
      title: true,
      targetValue: true,
      startDate: true,
      endDate: true,
    });

    if (Object.keys(validationErrors).length > 0) {
      toast.error(t('create.form.validationError'));
      return;
    }

    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Unexpected error during goal submission:', error);
    }
  };

  const targetConfig = getTargetTypeConfig(formData.targetType);
  const showEndDate = formData.periodType === GoalPeriodType.Custom;

  return (
    <form
      onSubmit={e => {
        void handleSubmit(e);
      }}
      className="space-y-8"
    >
      <div>
        <h1 className="text-3xl font-bold">{isEditMode ? t('edit.form.title') : t('create.form.title')}</h1>
        <p className="mt-2 text-muted-foreground">
          {isEditMode ? t('edit.form.description') : t('create.form.description')}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('create.form.sections.basic')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">{t('create.form.fields.title.label')}</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={e => updateField('title', e.target.value)}
              onBlur={() => handleBlur('title')}
              placeholder={t('create.form.fields.title.placeholder')}
              disabled={loading}
              aria-invalid={touched.title && !!errors.title}
              aria-describedby={touched.title && errors.title ? 'title-error' : undefined}
            />
            {touched.title && errors.title && (
              <p id="title-error" className="text-sm text-destructive" role="alert">
                {errors.title}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">
              {t('create.form.fields.description.label')}
              <span className="text-muted-foreground ml-1">{t('create.form.fields.optional')}</span>
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={e => updateField('description', e.target.value)}
              placeholder={t('create.form.fields.description.placeholder')}
              disabled={loading}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sportType">
              {t('create.form.fields.sportType.label')}
              {isEditMode && (
                <span className="text-xs text-muted-foreground ml-2">{t('edit.form.fields.readOnly')}</span>
              )}
            </Label>
            <Select
              value={formData.sportType || 'all'}
              onValueChange={value => updateField('sportType', value === 'all' ? null : (value as SportType))}
              disabled={loading || isEditMode}
            >
              <SelectTrigger id="sportType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    {t('create.form.fields.sportType.allSports')}
                  </div>
                </SelectItem>
                <SelectItem value={SportType.Run}>
                  <div className="flex items-center gap-2">
                    <Footprints className="h-4 w-4" />
                    {t('sportTypes.run')}
                  </div>
                </SelectItem>
                <SelectItem value={SportType.Ride}>
                  <div className="flex items-center gap-2">
                    <Bike className="h-4 w-4" />
                    {t('sportTypes.ride')}
                  </div>
                </SelectItem>
                <SelectItem value={SportType.Swim}>
                  <div className="flex items-center gap-2">
                    <Waves className="h-4 w-4" />
                    {t('sportTypes.swim')}
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            {isEditMode && <p className="text-sm text-muted-foreground">{t('edit.form.fields.cannotChangeSport')}</p>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('create.form.sections.target')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="targetType">
              {t('create.form.fields.targetType.label')}
              {isEditMode && (
                <span className="text-xs text-muted-foreground ml-2">{t('edit.form.fields.readOnly')}</span>
              )}
            </Label>
            <Select
              value={formData.targetType}
              onValueChange={value => updateField('targetType', value as GoalTargetType)}
              disabled={loading || isEditMode}
            >
              <SelectTrigger id="targetType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.values(GoalTargetType).map(type => (
                  <SelectItem key={type} value={type}>
                    {t(`targetTypes.${type.toLowerCase()}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isEditMode && (
              <p className="text-sm text-muted-foreground">{t('edit.form.fields.cannotChangeTargetType')}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="targetValue">{t('create.form.fields.targetValue.label')}</Label>
            <div className="flex gap-2">
              <Input
                id="targetValue"
                type="number"
                step={targetConfig.step}
                min={0}
                value={formData.targetValue || ''}
                onChange={e => updateField('targetValue', parseFloat(e.target.value) || 0)}
                onBlur={() => handleBlur('targetValue')}
                disabled={loading}
                className="flex-1"
                aria-invalid={touched.targetValue && !!errors.targetValue}
                aria-describedby={touched.targetValue && errors.targetValue ? 'targetValue-error' : undefined}
              />
              <div className="flex items-center px-3 border rounded-md bg-muted text-muted-foreground min-w-[60px] justify-center">
                {targetConfig.unit}
              </div>
            </div>
            {touched.targetValue && errors.targetValue && (
              <p id="targetValue-error" className="text-sm text-destructive" role="alert">
                {errors.targetValue}
              </p>
            )}
            <p className="text-sm text-muted-foreground">{t(targetConfig.hintKey)}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('create.form.sections.period')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="periodType">
              {t('create.form.fields.periodType.label')}
              {isEditMode && (
                <span className="text-xs text-muted-foreground ml-2">{t('edit.form.fields.readOnly')}</span>
              )}
            </Label>
            <Select
              value={formData.periodType}
              onValueChange={value => {
                const periodType = value as GoalPeriodType;
                updateField('periodType', periodType);
                if (periodType !== GoalPeriodType.Custom) {
                  updateField('endDate', null);
                }
              }}
              disabled={loading || isEditMode}
            >
              <SelectTrigger id="periodType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.values(GoalPeriodType).map(type => (
                  <SelectItem key={type} value={type}>
                    {t(`periodTypes.${type.toLowerCase()}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isEditMode && <p className="text-sm text-muted-foreground">{t('edit.form.fields.cannotChangePeriod')}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="startDate">
              {t('create.form.fields.startDate.label')}
              {isEditMode && (
                <span className="text-xs text-muted-foreground ml-2">{t('edit.form.fields.readOnly')}</span>
              )}
            </Label>
            <DatePicker
              id="startDate"
              date={formData.startDate}
              onDateChange={date => updateField('startDate', date || new Date())}
              disabled={loading || isEditMode}
              placeholder={t('create.form.fields.startDate.placeholder')}
            />
            {touched.startDate && errors.startDate && <p className="text-sm text-destructive">{errors.startDate}</p>}
            {isEditMode && (
              <p className="text-sm text-muted-foreground">{t('edit.form.fields.cannotChangeStartDate')}</p>
            )}
          </div>

          {showEndDate && (
            <div className="space-y-2">
              <Label htmlFor="endDate">{t('create.form.fields.endDate.label')}</Label>
              <DatePicker
                id="endDate"
                date={formData.endDate}
                onDateChange={date => updateField('endDate', date || null)}
                disabled={loading}
                placeholder={t('create.form.fields.endDate.placeholder')}
              />
              {touched.endDate && errors.endDate && <p className="text-sm text-destructive">{errors.endDate}</p>}
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="isRecurring">
                {t('create.form.fields.isRecurring.label')}
                {isEditMode && (
                  <span className="text-xs text-muted-foreground ml-2">{t('edit.form.fields.readOnly')}</span>
                )}
              </Label>
              <p className="text-sm text-muted-foreground">{t('create.form.fields.isRecurring.description')}</p>
            </div>
            <Switch
              id="isRecurring"
              checked={formData.isRecurring}
              onCheckedChange={checked => updateField('isRecurring', checked)}
              disabled={loading || isEditMode}
            />
          </div>
          {isEditMode && formData.isRecurring && (
            <p className="text-sm text-muted-foreground">{t('edit.form.fields.recurringGoalNote')}</p>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button type="button" variant="outline" onClick={onBack} disabled={loading} className="flex-1">
          {t('create.form.actions.back')}
        </Button>
        <Button type="submit" disabled={loading || (isEditMode && !isDirty)} className="flex-1" aria-busy={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEditMode ? t('edit.form.actions.save') : t('create.form.actions.create')}
        </Button>
      </div>

      {isEditMode && !isDirty && (
        <p className="text-sm text-muted-foreground text-center">{t('edit.form.noChanges')}</p>
      )}
    </form>
  );
}
