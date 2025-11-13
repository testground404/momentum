import { format, startOfYear, endOfYear, eachDayOfInterval, isToday } from 'date-fns';

/**
 * Format a date to YYYY-MM-DD string
 */
export const formatDateKey = (date: Date): string => {
  return format(date, 'yyyy-MM-dd');
};

/**
 * Get all days in a year
 */
export const getDaysInYear = (year: number): Date[] => {
  const start = startOfYear(new Date(year, 0, 1));
  const end = endOfYear(new Date(year, 0, 1));

  return eachDayOfInterval({ start, end });
};

/**
 * Get all days in a month
 */
export const getDaysInMonth = (year: number, month: number): number => {
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0);

  return eachDayOfInterval({ start, end }).length;
};

/**
 * Check if a habit is completed on a specific date
 */
export const isHabitCompletedOnDate = (
  completions: { date: string }[],
  date: Date
): boolean => {
  const dateKey = formatDateKey(date);
  return completions.some((c) => c.date === dateKey);
};

/**
 * Calculate completion rate for a habit
 */
export const calculateCompletionRate = (
  completions: { date: string }[],
  startDate: Date,
  endDate: Date
): number => {
  const totalDays = eachDayOfInterval({ start: startDate, end: endDate }).length;
  const completedDays = completions.filter((c) => {
    const completionDate = new Date(c.date);
    return completionDate >= startDate && completionDate <= endDate;
  }).length;

  return totalDays > 0 ? (completedDays / totalDays) * 100 : 0;
};

/**
 * Get current streak for a habit
 */
export const getCurrentStreak = (completions: { date: string }[]): number => {
  const sortedCompletions = [...completions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (sortedCompletions.length === 0) return 0;

  const today = new Date();
  const lastCompletion = new Date(sortedCompletions[0].date);

  // Check if last completion was today or yesterday
  const daysDiff = Math.floor(
    (today.getTime() - lastCompletion.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysDiff > 1) return 0;

  let streak = 0;
  let currentDate = new Date(today);

  // If today is not completed, start from yesterday
  if (!isToday(lastCompletion)) {
    currentDate.setDate(currentDate.getDate() - 1);
  }

  for (const completion of sortedCompletions) {
    const expectedDateKey = formatDateKey(currentDate);

    if (completion.date === expectedDateKey) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
};

/**
 * Check if a year is a leap year
 */
export const isLeapYear = (year: number): boolean => {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
};

/**
 * Get the number of days in a specific year
 */
export const getDaysInYearCount = (year: number): number => {
  return isLeapYear(year) ? 366 : 365;
};

/**
 * Get the day index (0-365) for a specific date within a year
 */
export const getDayIndex = (date: Date, year: number): number => {
  const startOfYearDate = new Date(year, 0, 1);
  const diffTime = date.getTime() - startOfYearDate.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Get the current day index of the year
 */
export const getCurrentDayIndex = (year: number): number => {
  return getDayIndex(new Date(), year);
};
