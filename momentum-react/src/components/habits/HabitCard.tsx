import { memo, useCallback, Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
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

  const handleDeleteClick = useCallback(() => {
    openModal('confirm-delete', { habit });
  }, [habit, openModal]);

  const handleArchiveClick = useCallback(() => {
    // Archive functionality will be implemented when connected to Firebase
    console.log('Archive habit:', habit.id);
  }, [habit.id]);

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

          {/* Menu dropdown */}
          <Menu as="div" className="relative">
            <Menu.Button className="p-2 -mr-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
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
            </Menu.Button>

            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right rounded-lg bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                <div className="py-1">
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={handleEditClick}
                        className={clsx(
                          'flex w-full items-center gap-3 px-4 py-2 text-sm',
                          active ? 'bg-gray-100 dark:bg-gray-700' : '',
                          'text-gray-700 dark:text-gray-300'
                        )}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit
                      </button>
                    )}
                  </Menu.Item>

                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={handleArchiveClick}
                        className={clsx(
                          'flex w-full items-center gap-3 px-4 py-2 text-sm',
                          active ? 'bg-gray-100 dark:bg-gray-700' : '',
                          'text-gray-700 dark:text-gray-300'
                        )}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                        </svg>
                        Archive
                      </button>
                    )}
                  </Menu.Item>

                  <div className="border-t border-gray-200 dark:border-gray-700 my-1" />

                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={handleDeleteClick}
                        className={clsx(
                          'flex w-full items-center gap-3 px-4 py-2 text-sm',
                          active ? 'bg-red-50 dark:bg-red-900/20' : '',
                          'text-red-600 dark:text-red-400'
                        )}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete
                      </button>
                    )}
                  </Menu.Item>
                </div>
              </Menu.Items>
            </Transition>
          </Menu>
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
