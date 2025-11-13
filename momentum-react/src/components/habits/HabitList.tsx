import { memo, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useHabitStore } from '../../store/habitStore';
import { HabitCard } from './HabitCard';

export const HabitList = memo(() => {
  const habits = useHabitStore((state) => state.getFilteredHabits());
  const parentRef = useRef<HTMLDivElement>(null);

  // Use virtual scrolling only if there are many habits (>10)
  const useVirtual = habits.length > 10;

  const virtualizer = useVirtualizer({
    count: habits.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 450, // Estimated height of HabitCard with margin
    overscan: 3,
    enabled: useVirtual,
  });

  if (habits.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
          <svg
            className="w-8 h-8 text-gray-400 dark:text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
          No habits yet
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-sm">
          Start building better habits by creating your first one
        </p>
      </div>
    );
  }

  // For small lists, use regular grid rendering
  if (!useVirtual) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {habits.map((habit) => (
          <HabitCard key={habit.id} habit={habit} />
        ))}
      </div>
    );
  }

  // For large lists, use virtual scrolling with single column
  return (
    <div ref={parentRef} className="max-w-4xl mx-auto" style={{ height: '100vh', overflow: 'auto' }}>
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => {
          const habit = habits[virtualItem.index];
          return (
            <div
              key={habit.id}
              data-index={virtualItem.index}
              ref={virtualizer.measureElement}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualItem.start}px)`,
              }}
              className="px-4 py-3"
            >
              <HabitCard habit={habit} />
            </div>
          );
        })}
      </div>
    </div>
  );
});

HabitList.displayName = 'HabitList';
