import { Habit, SortOption } from '../types';
import { getCurrentStreak } from './dateUtils';

/**
 * Filter habits by search query
 */
export const filterHabitsBySearch = (
  habits: Habit[],
  searchQuery: string
): Habit[] => {
  if (!searchQuery.trim()) return habits;

  const query = searchQuery.toLowerCase();
  return habits.filter((habit) =>
    habit.name.toLowerCase().includes(query) ||
    (habit.description?.toLowerCase().includes(query) ?? false)
  );
};

/**
 * Filter habits by archived status
 */
export const filterHabitsByArchived = (
  habits: Habit[],
  showArchived: boolean
): Habit[] => {
  return showArchived ? habits : habits.filter((h) => !h.archived);
};

/**
 * Sort habits based on sort option
 */
export const sortHabits = (
  habits: Habit[],
  sortBy: SortOption
): Habit[] => {
  const sorted = [...habits];

  switch (sortBy) {
    case 'name':
      return sorted.sort((a, b) => a.name.localeCompare(b.name));

    case 'created':
      return sorted.sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

    case 'completion':
      return sorted.sort((a, b) => {
        const streakA = getCurrentStreak(a.completions);
        const streakB = getCurrentStreak(b.completions);
        return streakB - streakA;
      });

    case 'manual':
    default:
      return sorted.sort((a, b) => a.order - b.order);
  }
};

/**
 * Get filtered and sorted habits
 */
export const getProcessedHabits = (
  habits: Habit[],
  searchQuery: string,
  sortBy: SortOption,
  showArchived: boolean
): Habit[] => {
  let processed = habits;

  // Filter by archived status
  processed = filterHabitsByArchived(processed, showArchived);

  // Filter by search query
  processed = filterHabitsBySearch(processed, searchQuery);

  // Sort
  processed = sortHabits(processed, sortBy);

  return processed;
};

/**
 * Generate a unique color for a new habit
 */
export const generateHabitColor = (existingHabits: Habit[]): string => {
  const colors = [
    '#ef4444', // red
    '#f59e0b', // amber
    '#10b981', // emerald
    '#3b82f6', // blue
    '#8b5cf6', // violet
    '#ec4899', // pink
    '#06b6d4', // cyan
    '#84cc16', // lime
  ];

  // Find least used color
  const colorCounts = colors.map((color) => ({
    color,
    count: existingHabits.filter((h) => h.color === color).length,
  }));

  colorCounts.sort((a, b) => a.count - b.count);

  return colorCounts[0].color;
};
