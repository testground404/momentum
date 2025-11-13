import { useHabitStore } from '../../store/habitStore';

export function ViewToggle() {
  const { currentView, setView } = useHabitStore();

  return (
    <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
      <button
        onClick={() => setView('year')}
        className={`px-3 py-1.5 text-sm rounded-md transition-all ${
          currentView === 'year'
            ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm'
            : 'text-gray-600 dark:text-gray-400'
        }`}
        aria-label="Year view"
      >
        Year
      </button>
      <button
        onClick={() => setView('month')}
        className={`px-3 py-1.5 text-sm rounded-md transition-all ${
          currentView === 'month'
            ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm'
            : 'text-gray-600 dark:text-gray-400'
        }`}
        aria-label="Month view"
      >
        Month
      </button>
    </div>
  );
}
