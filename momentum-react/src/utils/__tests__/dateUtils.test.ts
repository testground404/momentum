import { describe, it, expect } from 'vitest';
import {
  isLeapYear,
  getDaysInYearCount,
  getDaysInMonth,
  getDayIndex,
  getCurrentDayIndex,
} from '../dateUtils';

describe('dateUtils', () => {
  describe('isLeapYear', () => {
    it('identifies leap years correctly', () => {
      expect(isLeapYear(2024)).toBe(true);
      expect(isLeapYear(2000)).toBe(true);
      expect(isLeapYear(2020)).toBe(true);
    });

    it('identifies non-leap years correctly', () => {
      expect(isLeapYear(2023)).toBe(false);
      expect(isLeapYear(2021)).toBe(false);
      expect(isLeapYear(1900)).toBe(false);
    });
  });

  describe('getDaysInYearCount', () => {
    it('returns 366 for leap years', () => {
      expect(getDaysInYearCount(2024)).toBe(366);
      expect(getDaysInYearCount(2000)).toBe(366);
    });

    it('returns 365 for non-leap years', () => {
      expect(getDaysInYearCount(2023)).toBe(365);
      expect(getDaysInYearCount(2021)).toBe(365);
    });
  });

  describe('getDaysInMonth', () => {
    it('returns correct days for each month', () => {
      expect(getDaysInMonth(2023, 0)).toBe(31); // January
      expect(getDaysInMonth(2023, 1)).toBe(28); // February (non-leap)
      expect(getDaysInMonth(2024, 1)).toBe(29); // February (leap)
      expect(getDaysInMonth(2023, 3)).toBe(30); // April
      expect(getDaysInMonth(2023, 11)).toBe(31); // December
    });
  });

  describe('getDayIndex', () => {
    it('calculates correct day index from start of year', () => {
      const year = 2023;

      // January 1st should be day 0
      expect(getDayIndex(new Date(2023, 0, 1), year)).toBe(0);

      // January 2nd should be day 1
      expect(getDayIndex(new Date(2023, 0, 2), year)).toBe(1);

      // February 1st should be day 31
      expect(getDayIndex(new Date(2023, 1, 1), year)).toBe(31);

      // December 31st should be day 364 (for non-leap year)
      expect(getDayIndex(new Date(2023, 11, 31), year)).toBe(364);
    });

    it('handles leap years correctly', () => {
      const year = 2024;

      // March 1st in leap year should be day 60 (31 + 29)
      expect(getDayIndex(new Date(2024, 2, 1), year)).toBe(60);

      // December 31st should be day 365 (for leap year)
      expect(getDayIndex(new Date(2024, 11, 31), year)).toBe(365);
    });
  });

  describe('getCurrentDayIndex', () => {
    it('returns a valid day index', () => {
      const currentYear = new Date().getFullYear();
      const dayIndex = getCurrentDayIndex(currentYear);

      expect(dayIndex).toBeGreaterThanOrEqual(0);
      expect(dayIndex).toBeLessThan(366);
    });
  });
});
