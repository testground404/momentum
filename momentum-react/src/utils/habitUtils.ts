import type { Habit, SortOption, HabitStats } from '../types';

/**
 * Filter habits by search query and archived status
 */
export const filterHabits = (
  habits: Habit[],
  searchQuery: string,
  showArchived: boolean
): Habit[] => {
  let filtered = habits;

  // Filter by archived status
  if (showArchived) {
    // When showArchived is true, show ONLY archived habits
    filtered = filtered.filter((h) => h.archived);
  } else {
    // When showArchived is false, show only non-archived habits
    filtered = filtered.filter((h) => !h.archived);
  }

  // Filter by search query
  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase();
    filtered = filtered.filter(
      (h) =>
        h.name.toLowerCase().includes(query) ||
        (h.description?.toLowerCase().includes(query) ?? false)
    );
  }

  return filtered;
};

/**
 * Sort habits based on sort option
 */
export const sortHabits = (habits: Habit[], sortOption: SortOption): Habit[] => {
  const sorted = [...habits];

  switch (sortOption) {
    case 'name-az':
      return sorted.sort((a, b) => a.name.localeCompare(b.name));

    case 'name-za':
      return sorted.sort((a, b) => b.name.localeCompare(a.name));

    case 'created-newest':
      return sorted.sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateB - dateA;
      });

    case 'created-oldest':
      return sorted.sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateA - dateB;
      });

    case 'rate-high-low':
      return sorted.sort((a, b) => {
        const rateA = calculateCompletionRate(a);
        const rateB = calculateCompletionRate(b);
        return rateB - rateA;
      });

    case 'rate-low-high':
      return sorted.sort((a, b) => {
        const rateA = calculateCompletionRate(a);
        const rateB = calculateCompletionRate(b);
        return rateA - rateB;
      });

    case 'manual':
    default:
      return sorted.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }
};

/**
 * Calculate completion rate for a habit
 */
export const calculateCompletionRate = (habit: Habit): number => {
  const totalDays = getDaysSinceStart(habit);
  const completedDays = Object.keys(habit.completions).length;

  if (totalDays === 0) return 0;
  return (completedDays / totalDays) * 100;
};

/**
 * Calculate comprehensive statistics for a habit
 */
export const calculateHabitStats = (habit: Habit): HabitStats => {
  const totalDays = getDaysSinceStart(habit);
  const completedDays = Object.keys(habit.completions).length;
  const completionRate = totalDays > 0 ? (completedDays / totalDays) * 100 : 0;

  const { currentStreak, longestStreak, lastCompletedDate } = calculateStreaks(habit);

  return {
    totalDays,
    completedDays,
    completionRate,
    currentStreak,
    longestStreak,
    lastCompletedDate,
  };
};

/**
 * Calculate current and longest streaks
 */
export const calculateStreaks = (
  habit: Habit
): { currentStreak: number; longestStreak: number; lastCompletedDate?: string } => {
  const completionIndices = Object.keys(habit.completions)
    .map((key) => parseInt(key, 10))
    .sort((a, b) => a - b);

  if (completionIndices.length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  // Get the current day index of the year
  const now = new Date();
  const startOfYear = new Date(habit.year, 0, 1);
  const currentDayIndex = Math.floor(
    (now.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24)
  );

  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 1;

  // Calculate current streak (working backwards from today or yesterday)
  let checkIndex = currentDayIndex;
  if (!habit.completions[checkIndex.toString()]) {
    checkIndex = currentDayIndex - 1;
  }

  while (checkIndex >= 0 && habit.completions[checkIndex.toString()]) {
    currentStreak++;
    checkIndex--;
  }

  // Calculate longest streak
  for (let i = 1; i < completionIndices.length; i++) {
    if (completionIndices[i] - completionIndices[i - 1] === 1) {
      tempStreak++;
      longestStreak = Math.max(longestStreak, tempStreak);
    } else {
      tempStreak = 1;
    }
  }

  longestStreak = Math.max(longestStreak, tempStreak, currentStreak);

  // Get last completed date
  const lastIndex = completionIndices[completionIndices.length - 1];
  const lastDate = new Date(habit.year, 0, 1);
  lastDate.setDate(lastDate.getDate() + lastIndex);

  return {
    currentStreak,
    longestStreak,
    lastCompletedDate: lastDate.toISOString().split('T')[0],
  };
};

/**
 * Get number of days since habit was created
 */
export const getDaysSinceStart = (habit: Habit): number => {
  const startDate = new Date(habit.startDate);
  const now = new Date();
  const endOfYear = new Date(habit.year, 11, 31);

  // Use the earlier of today or end of the habit's year
  const endDate = now < endOfYear ? now : endOfYear;

  const diffTime = endDate.getTime() - startDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return Math.max(0, diffDays);
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
    '#f97316', // orange
    '#14b8a6', // teal
  ];

  // Find least used color
  const colorCounts = colors.map((color) => ({
    color,
    count: existingHabits.filter((h) => h.color === color).length,
  }));

  colorCounts.sort((a, b) => a.count - b.count);

  return colorCounts[0].color;
};

/**
 * Get habit color options for picker
 */
export const getHabitColorOptions = () => [
  { name: 'Red', value: '#ef4444', textColor: '#ffffff' },
  { name: 'Orange', value: '#f97316', textColor: '#ffffff' },
  { name: 'Amber', value: '#f59e0b', textColor: '#ffffff' },
  { name: 'Lime', value: '#84cc16', textColor: '#000000' },
  { name: 'Emerald', value: '#10b981', textColor: '#ffffff' },
  { name: 'Teal', value: '#14b8a6', textColor: '#ffffff' },
  { name: 'Cyan', value: '#06b6d4', textColor: '#ffffff' },
  { name: 'Blue', value: '#3b82f6', textColor: '#ffffff' },
  { name: 'Violet', value: '#8b5cf6', textColor: '#ffffff' },
  { name: 'Pink', value: '#ec4899', textColor: '#ffffff' },
];

/**
 * Convert day index to date string
 */
export const dayIndexToDate = (year: number, dayIndex: number): string => {
  const date = new Date(year, 0, 1);
  date.setDate(date.getDate() + dayIndex);
  return date.toISOString().split('T')[0];
};

/**
 * Convert date to day index
 */
export const dateToDayIndex = (year: number, dateString: string): number => {
  const startOfYear = new Date(year, 0, 1);
  const date = new Date(dateString);
  const diffTime = date.getTime() - startOfYear.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Check if a habit is completed on a specific day index
 */
export const isCompletedOnDay = (habit: Habit, dayIndex: number): boolean => {
  return habit.completions[dayIndex.toString()] === true;
};

/**
 * Get completion percentage for visual display
 */
export const getCompletionPercentage = (habit: Habit): number => {
  return Math.round(calculateCompletionRate(habit));
};
