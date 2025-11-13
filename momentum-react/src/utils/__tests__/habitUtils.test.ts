import { describe, it, expect } from 'vitest';
import type { Habit } from '../../types';
import {
  filterHabits,
  sortHabits,
  calculateHabitStats,
  calculateStreaks,
} from '../habitUtils';

const createMockHabit = (overrides: Partial<Habit> = {}): Habit => ({
  id: '1',
  name: 'Test Habit',
  icon: '💪',
  color: '#3b82f6',
  year: 2023,
  startDate: '2023-01-01',
  createdAt: '2023-01-01T00:00:00.000Z',
  archived: false,
  completions: {},
  ...overrides,
});

describe('habitUtils', () => {
  describe('filterHabits', () => {
    const habits: Habit[] = [
      createMockHabit({ id: '1', name: 'Morning Run', archived: false }),
      createMockHabit({ id: '2', name: 'Evening Yoga', archived: false }),
      createMockHabit({ id: '3', name: 'Old Habit', archived: true }),
    ];

    it('filters habits by search query', () => {
      const filtered = filterHabits(habits, 'run', false);
      expect(filtered).toHaveLength(1);
      expect(filtered[0].name).toBe('Morning Run');
    });

    it('search is case-insensitive', () => {
      const filtered = filterHabits(habits, 'MORNING', false);
      expect(filtered).toHaveLength(1);
      expect(filtered[0].name).toBe('Morning Run');
    });

    it('shows archived habits when showArchived is true', () => {
      const filtered = filterHabits(habits, '', true);
      expect(filtered).toHaveLength(1);
      expect(filtered[0].archived).toBe(true);
    });

    it('hides archived habits when showArchived is false', () => {
      const filtered = filterHabits(habits, '', false);
      expect(filtered).toHaveLength(2);
      expect(filtered.every((h) => !h.archived)).toBe(true);
    });

    it('returns all habits with empty search', () => {
      const filtered = filterHabits(habits, '', false);
      expect(filtered).toHaveLength(2);
    });
  });

  describe('sortHabits', () => {
    const habits: Habit[] = [
      createMockHabit({
        id: '1',
        name: 'Zebra',
        createdAt: '2023-01-01T00:00:00.000Z',
        completions: { '0': true, '1': true }, // 2 days
      }),
      createMockHabit({
        id: '2',
        name: 'Apple',
        createdAt: '2023-01-03T00:00:00.000Z',
        completions: { '0': true }, // 1 day
      }),
      createMockHabit({
        id: '3',
        name: 'Banana',
        createdAt: '2023-01-02T00:00:00.000Z',
        completions: {}, // 0 days
      }),
    ];

    it('sorts by name A-Z', () => {
      const sorted = sortHabits([...habits], 'name-az');
      expect(sorted[0].name).toBe('Apple');
      expect(sorted[2].name).toBe('Zebra');
    });

    it('sorts by name Z-A', () => {
      const sorted = sortHabits([...habits], 'name-za');
      expect(sorted[0].name).toBe('Zebra');
      expect(sorted[2].name).toBe('Apple');
    });

    it('sorts by created date newest first', () => {
      const sorted = sortHabits([...habits], 'created-newest');
      expect(sorted[0].id).toBe('2'); // Latest date
      expect(sorted[2].id).toBe('1'); // Earliest date
    });

    it('sorts by created date oldest first', () => {
      const sorted = sortHabits([...habits], 'created-oldest');
      expect(sorted[0].id).toBe('1'); // Earliest date
      expect(sorted[2].id).toBe('2'); // Latest date
    });

    it('sorts by completion rate high to low', () => {
      const sorted = sortHabits([...habits], 'rate-high-low');
      expect(sorted[0].id).toBe('1'); // 100% (2/2)
      expect(sorted[2].id).toBe('3'); // 0% (0/x)
    });

    it('sorts by completion rate low to high', () => {
      const sorted = sortHabits([...habits], 'rate-low-high');
      expect(sorted[0].id).toBe('3'); // 0%
      expect(sorted[2].id).toBe('1'); // 100%
    });
  });

  describe('calculateHabitStats', () => {
    it('calculates stats for habit with no completions', () => {
      const habit = createMockHabit({
        startDate: '2023-01-01',
        completions: {},
      });

      const stats = calculateHabitStats(habit);

      expect(stats.completedDays).toBe(0);
      expect(stats.completionRate).toBe(0);
      expect(stats.currentStreak).toBe(0);
      expect(stats.longestStreak).toBe(0);
    });

    it('calculates stats for habit with completions', () => {
      const habit = createMockHabit({
        startDate: '2023-01-01',
        completions: {
          '0': true,
          '1': true,
          '2': true,
        },
      });

      const stats = calculateHabitStats(habit);

      expect(stats.completedDays).toBe(3);
      expect(stats.totalDays).toBeGreaterThan(0);
      expect(stats.completionRate).toBeGreaterThan(0);
    });
  });

  describe('calculateStreaks', () => {
    it('calculates current streak correctly', () => {
      const today = new Date();
      const currentYear = today.getFullYear();
      const todayIndex = Math.floor(
        (today.getTime() - new Date(currentYear, 0, 1).getTime()) /
          (1000 * 60 * 60 * 24)
      );

      const habit = createMockHabit({
        year: currentYear,
        startDate: today.toISOString().split('T')[0],
        completions: {
          [todayIndex]: true,
          [todayIndex - 1]: true,
          [todayIndex - 2]: true,
        },
      });

      const { currentStreak } = calculateStreaks(habit);
      expect(currentStreak).toBe(3);
    });

    it('calculates longest streak correctly', () => {
      const habit = createMockHabit({
        startDate: '2023-01-01',
        completions: {
          '0': true,
          '1': true,
          '2': true,
          '5': true,
          '6': true,
        },
      });

      const { longestStreak } = calculateStreaks(habit);
      expect(longestStreak).toBe(3);
    });

    it('returns zero streaks for empty completions', () => {
      const habit = createMockHabit({
        completions: {},
      });

      const { currentStreak, longestStreak } = calculateStreaks(habit);
      expect(currentStreak).toBe(0);
      expect(longestStreak).toBe(0);
    });
  });
});
