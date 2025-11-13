import { memo, useMemo, useCallback } from 'react';
import clsx from 'clsx';
import type { Habit } from '../../types';
import { getDaysInYearCount, getDayIndex, getCurrentDayIndex } from '../../utils/dateUtils';

interface YearWheelProps {
  habit: Habit;
  year: number;
  onDayClick: (dayIndex: number) => void;
}

interface DotPosition {
  index: number;
  x: number;
  y: number;
  isCompleted: boolean;
  isAvailable: boolean;
  isToday: boolean;
}

export const YearWheel = memo(({ habit, year, onDayClick }: YearWheelProps) => {
  const daysInYear = useMemo(() => getDaysInYearCount(year), [year]);

  const startDayIndex = useMemo(() => {
    if (!habit.startDate) return 0;
    const startDate = new Date(habit.startDate);
    return startDate.getFullYear() === year ? getDayIndex(startDate, year) : 0;
  }, [habit.startDate, year]);

  const currentDayIndex = useMemo(() => {
    const now = new Date();
    return now.getFullYear() === year ? getCurrentDayIndex(year) : -1;
  }, [year]);

  const dots = useMemo((): DotPosition[] => {
    const result: DotPosition[] = [];
    const radius = 140;
    const centerX = 160;
    const centerY = 160;

    for (let i = 0; i < daysInYear; i++) {
      // Start from top (12 o'clock position)
      const angle = (i / daysInYear) * 2 * Math.PI - Math.PI / 2;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);

      const isCompleted = habit.completions[i.toString()] === true;
      const isAvailable = i >= startDayIndex;
      const isToday = i === currentDayIndex;

      result.push({
        index: i,
        x,
        y,
        isCompleted,
        isAvailable,
        isToday,
      });
    }

    return result;
  }, [daysInYear, habit.completions, startDayIndex, currentDayIndex]);

  const completedCount = useMemo(() => {
    return Object.values(habit.completions).filter(Boolean).length;
  }, [habit.completions]);

  const completionRate = useMemo(() => {
    const availableDays = daysInYear - startDayIndex;
    return availableDays > 0
      ? Math.round((completedCount / availableDays) * 100)
      : 0;
  }, [completedCount, daysInYear, startDayIndex]);

  const handleDotClick = useCallback(
    (index: number, isAvailable: boolean) => {
      if (isAvailable) {
        onDayClick(index);
      }
    },
    [onDayClick]
  );

  const handleDotKeyDown = useCallback(
    (event: React.KeyboardEvent, index: number, isAvailable: boolean) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        handleDotClick(index, isAvailable);
      }
    },
    [handleDotClick]
  );

  return (
    <svg
      className="year-wheel w-full h-auto"
      viewBox="0 0 320 320"
      role="img"
      aria-label={`Year progress wheel for ${habit.name}`}
    >
      {/* Month labels */}
      <g className="wheel-months text-xs fill-gray-400 dark:fill-gray-500">
        {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map(
          (month, i) => {
            const angle = ((i * 30) / 365) * 2 * Math.PI - Math.PI / 2;
            const x = 160 + 155 * Math.cos(angle);
            const y = 160 + 155 * Math.sin(angle);
            return (
              <text
                key={month}
                x={x}
                y={y}
                textAnchor="middle"
                dominantBaseline="middle"
                className="text-[10px] font-medium"
              >
                {month}
              </text>
            );
          }
        )}
      </g>

      {/* Day dots */}
      <g className="wheel-dots">
        {dots.map((dot) => (
          <circle
            key={dot.index}
            cx={dot.x}
            cy={dot.y}
            r={dot.isCompleted ? 4 : dot.isToday ? 3.5 : 2.5}
            className={clsx(
              'transition-all duration-200 cursor-pointer',
              {
                'fill-gray-200 dark:fill-gray-700': !dot.isCompleted && dot.isAvailable,
                'fill-gray-100 dark:fill-gray-800 opacity-40': !dot.isAvailable,
                'stroke-current stroke-2': dot.isToday && !dot.isCompleted,
                'hover:scale-150': dot.isAvailable,
              }
            )}
            style={{
              fill: dot.isCompleted ? habit.color : undefined,
              stroke: dot.isToday && !dot.isCompleted ? habit.color : undefined,
            }}
            onClick={() => handleDotClick(dot.index, dot.isAvailable)}
            onKeyDown={(e) => handleDotKeyDown(e, dot.index, dot.isAvailable)}
            role="button"
            tabIndex={dot.isAvailable ? 0 : -1}
            aria-label={`Day ${dot.index + 1}, ${
              dot.isCompleted ? 'completed' : 'incomplete'
            }${dot.isToday ? ', today' : ''}`}
          />
        ))}
      </g>

      {/* Center stats */}
      <g className="wheel-center">
        <text
          x="160"
          y="150"
          textAnchor="middle"
          className="text-4xl font-bold fill-gray-900 dark:fill-gray-100"
        >
          {completedCount}
        </text>
        <text
          x="160"
          y="170"
          textAnchor="middle"
          className="text-sm fill-gray-500 dark:fill-gray-400"
        >
          days
        </text>
        <text
          x="160"
          y="185"
          textAnchor="middle"
          className="text-xs fill-gray-400 dark:fill-gray-500"
        >
          {completionRate}%
        </text>
      </g>
    </svg>
  );
});

YearWheel.displayName = 'YearWheel';
