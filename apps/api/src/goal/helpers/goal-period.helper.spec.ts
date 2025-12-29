import { GoalPeriodHelper } from './goal-period.helper';
import { GoalPeriodType } from '../enums/goal-period-type.enum';
import { BadRequestException } from '@nestjs/common';

describe('GoalPeriodHelper', () => {
  describe('calculateEndDate', () => {
    it('should calculate WEEKLY end date (startDate + 6 days)', () => {
      const startDate = new Date('2025-01-06T10:00:00Z');
      const endDate = GoalPeriodHelper.calculateEndDate(GoalPeriodType.WEEKLY, startDate);

      expect(endDate.getDate()).toBe(12);
      expect(endDate.getHours()).toBe(23);
      expect(endDate.getMinutes()).toBe(59);
      expect(endDate.getSeconds()).toBe(59);
    });

    it('should calculate MONTHLY end date (last day of month)', () => {
      const startDate = new Date('2025-02-15T10:00:00Z');
      const endDate = GoalPeriodHelper.calculateEndDate(GoalPeriodType.MONTHLY, startDate);

      expect(endDate.getDate()).toBe(28);
      expect(endDate.getMonth()).toBe(1);
      expect(endDate.getHours()).toBe(23);
    });

    it('should handle leap year for MONTHLY', () => {
      const startDate = new Date('2024-02-15T10:00:00Z');
      const endDate = GoalPeriodHelper.calculateEndDate(GoalPeriodType.MONTHLY, startDate);

      expect(endDate.getDate()).toBe(29);
    });

    it('should calculate YEARLY end date (December 31)', () => {
      const startDate = new Date('2025-03-15T10:00:00Z');
      const endDate = GoalPeriodHelper.calculateEndDate(GoalPeriodType.YEARLY, startDate);

      expect(endDate.getFullYear()).toBe(2025);
      expect(endDate.getMonth()).toBe(11);
      expect(endDate.getDate()).toBe(31);
    });

    it('should use custom end date for CUSTOM period', () => {
      const startDate = new Date('2025-01-01T10:00:00Z');
      const customEndDate = new Date('2025-01-15T20:00:00Z');
      const endDate = GoalPeriodHelper.calculateEndDate(GoalPeriodType.CUSTOM, startDate, customEndDate);

      expect(endDate).toEqual(customEndDate);
    });

    it('should throw error when CUSTOM period has no custom end date', () => {
      const startDate = new Date('2025-01-01T10:00:00Z');
      expect(() => GoalPeriodHelper.calculateEndDate(GoalPeriodType.CUSTOM, startDate)).toThrow(BadRequestException);
      expect(() => GoalPeriodHelper.calculateEndDate(GoalPeriodType.CUSTOM, startDate)).toThrow(
        'Custom end date is required for CUSTOM period type',
      );
    });

    it('should throw error when custom end date is before start date', () => {
      const startDate = new Date('2025-01-15T10:00:00Z');
      const customEndDate = new Date('2025-01-10T10:00:00Z');
      expect(() => GoalPeriodHelper.calculateEndDate(GoalPeriodType.CUSTOM, startDate, customEndDate)).toThrow(
        BadRequestException,
      );
      expect(() => GoalPeriodHelper.calculateEndDate(GoalPeriodType.CUSTOM, startDate, customEndDate)).toThrow(
        'End date must be after start date',
      );
    });
  });

  describe('validateDateRange', () => {
    it('should not throw error for valid date range', () => {
      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-01-15');
      expect(() => GoalPeriodHelper.validateDateRange(startDate, endDate)).not.toThrow();
    });

    it('should throw error when end date equals start date', () => {
      const date = new Date('2025-01-01');
      expect(() => GoalPeriodHelper.validateDateRange(date, date)).toThrow(BadRequestException);
      expect(() => GoalPeriodHelper.validateDateRange(date, date)).toThrow('End date must be after start date');
    });

    it('should throw error when end date is before start date', () => {
      const startDate = new Date('2025-01-15');
      const endDate = new Date('2025-01-01');
      expect(() => GoalPeriodHelper.validateDateRange(startDate, endDate)).toThrow(BadRequestException);
      expect(() => GoalPeriodHelper.validateDateRange(startDate, endDate)).toThrow('End date must be after start date');
    });
  });
});
