import { memo, useCallback } from 'react';
import clsx from 'clsx';
import type { Habit } from '../../types';
import { useHabitStore } from '../../store/habitStore';
import { useHabitStats } from '../../hooks/useHabitStats';
import { useHabitActions } from '../../hooks/useHabitActions';
import { YearWheel } from './YearWheel';
import { MonthGrid } from './MonthGrid';
import { Card } from '../common/Card';

interface HabitCardProps {
  habit: Habit;
}

export const HabitCard = memo(({ habit }: HabitCardProps) => {
  const { currentView, currentYear, currentMonth } = useHabitStore();
  const stats = useHabitStats(habit);
  const { toggleCompletion, openModal } = useHabitActions();

  const handleDayClick = useCallback(
    (dayIndex: number) => {
      toggleCompletion(habit.id, dayIndex, habit.completions);
    },
    [habit.id, habit.completions, toggleCompletion]
  );

  const handleEditClick = useCallback(() => {
    openModal('habit-edit', { habit });
  }, [habit, openModal]);

  return (
    <Card padding="none" className="overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            {/* Icon */}
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-xl font-bold"
              style={{ backgroundColor: habit.color }}
            >
              {habit.icon || habit.name.charAt(0).toUpperCase()}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
                {habit.name}
              </h3>
              {habit.description && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                  {habit.description}
                </p>
              )}

              {/* Stats */}
              <div className="flex items-center gap-4 mt-2 text-xs text-gray-600 dark:text-gray-400">
                <span>
                  {stats.completedDays} / {stats.totalDays} days
                </span>
                <span>•</span>
                <span>{stats.completionRate.toFixed(1)}%</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <span className={clsx({ 'text-orange-500 font-semibold': stats.currentStreak > 0 })}>
                    {stats.currentStreak}
                  </span>
                  <span>day streak</span>
                </span>
              </div>
            </div>
          </div>

          {/* Menu button */}
          <button
            onClick={handleEditClick}
            className="p-2 -mr-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Habit options"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Visualization */}
      <div className="p-4 bg-gray-50 dark:bg-gray-800/50">
        {currentView === 'year' ? (
          <YearWheel habit={habit} year={currentYear} onDayClick={handleDayClick} />
        ) : (
          <MonthGrid
            habit={habit}
            year={currentYear}
            month={currentMonth}
            onDayClick={handleDayClick}
          />
        )}
      </div>
    </Card>
  );
});

HabitCard.displayName = 'HabitCard';
