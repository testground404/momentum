import { memo, useMemo, useCallback } from 'react';
import clsx from 'clsx';
import type { Habit } from '../../types';
import { getDayIndex } from '../../utils/dateUtils';

interface MonthGridProps {
  habit: Habit;
  year: number;
  month: number;
  onDayClick: (dayIndex: number) => void;
}

interface DayCell {
  dayNumber: number;
  dayIndex: number;
  isCompleted: boolean;
  isAvailable: boolean;
  isToday: boolean;
  inCurrentMonth: boolean;
}

export const MonthGrid = memo(({ habit, year, month, onDayClick }: MonthGridProps) => {
  const startDayIndex = useMemo(() => {
    if (!habit.startDate) return 0;
    const startDate = new Date(habit.startDate);
    return startDate.getFullYear() === year ? getDayIndex(startDate, year) : 0;
  }, [habit.startDate, year]);

  const today = useMemo(() => new Date(), []);
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
  const todayDate = isCurrentMonth ? today.getDate() : -1;

  const days = useMemo((): DayCell[] => {
    const result: DayCell[] = [];

    // Get first day of month and total days
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startWeekday = firstDay.getDay(); // 0 = Sunday

    // Add empty cells for days before month starts
    for (let i = 0; i < startWeekday; i++) {
      const prevMonthDay = new Date(year, month, -i);
      const dayIndex = getDayIndex(prevMonthDay, year);
      result.unshift({
        dayNumber: prevMonthDay.getDate(),
        dayIndex,
        isCompleted: habit.completions[dayIndex.toString()] === true,
        isAvailable: dayIndex >= startDayIndex,
        isToday: false,
        inCurrentMonth: false,
      });
    }

    // Add days of current month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dayIndex = getDayIndex(date, year);

      result.push({
        dayNumber: day,
        dayIndex,
        isCompleted: habit.completions[dayIndex.toString()] === true,
        isAvailable: dayIndex >= startDayIndex,
        isToday: day === todayDate,
        inCurrentMonth: true,
      });
    }

    // Add empty cells to complete the grid (max 6 weeks)
    const remainingCells = 42 - result.length;
    for (let i = 1; i <= remainingCells; i++) {
      const nextMonthDay = new Date(year, month + 1, i);
      const dayIndex = getDayIndex(nextMonthDay, year);
      result.push({
        dayNumber: i,
        dayIndex,
        isCompleted: habit.completions[dayIndex.toString()] === true,
        isAvailable: dayIndex >= startDayIndex,
        isToday: false,
        inCurrentMonth: false,
      });
    }

    return result;
  }, [year, month, habit.completions, startDayIndex, todayDate]);

  const handleDayClick = useCallback(
    (dayIndex: number, isAvailable: boolean, inCurrentMonth: boolean) => {
      if (isAvailable && inCurrentMonth) {
        onDayClick(dayIndex);
      }
    },
    [onDayClick]
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent, dayIndex: number, isAvailable: boolean, inCurrentMonth: boolean) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        handleDayClick(dayIndex, isAvailable, inCurrentMonth);
      }
    },
    [handleDayClick]
  );

  return (
    <div className="month-grid">
      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div
            key={day}
            className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 py-1"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, index) => (
          <button
            key={index}
            onClick={() => handleDayClick(day.dayIndex, day.isAvailable, day.inCurrentMonth)}
            onKeyDown={(e) => handleKeyDown(e, day.dayIndex, day.isAvailable, day.inCurrentMonth)}
            disabled={!day.isAvailable || !day.inCurrentMonth}
            className={clsx(
              'aspect-square flex items-center justify-center rounded-lg text-sm font-medium transition-all duration-200',
              {
                // Current month days
                'text-gray-900 dark:text-gray-100': day.inCurrentMonth && !day.isCompleted,
                'hover:bg-gray-100 dark:hover:bg-gray-700':
                  day.inCurrentMonth && day.isAvailable && !day.isCompleted,

                // Other month days
                'text-gray-400 dark:text-gray-600': !day.inCurrentMonth,

                // Completed days
                'text-white font-semibold': day.isCompleted,

                // Today
                'ring-2 ring-offset-2 dark:ring-offset-gray-800': day.isToday,

                // Unavailable days
                'opacity-40 cursor-not-allowed': !day.isAvailable,

                // Available days
                'cursor-pointer': day.isAvailable && day.inCurrentMonth,
              }
            )}
            style={{
              backgroundColor: day.isCompleted ? habit.color : undefined,
            }}
            aria-label={`${day.dayNumber}, ${
              day.isCompleted ? 'completed' : 'incomplete'
            }${day.isToday ? ', today' : ''}`}
          >
            {day.dayNumber}
          </button>
        ))}
      </div>
    </div>
  );
});

MonthGrid.displayName = 'MonthGrid';
