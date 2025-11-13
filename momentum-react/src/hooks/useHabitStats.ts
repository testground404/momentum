import { useMemo } from 'react';
import type { Habit, HabitStats } from '../types';
import { calculateHabitStats } from '../utils/habitUtils';

/**
 * Hook to calculate and memoize habit statistics
 */
export function useHabitStats(habit: Habit): HabitStats {
  return useMemo(() => {
    return calculateHabitStats(habit);
  }, [habit]);
}
