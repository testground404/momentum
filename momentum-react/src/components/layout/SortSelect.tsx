import { useHabitStore } from '../../store/habitStore';
import type { SortOption } from '../../types';

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'created-newest', label: 'Newest First' },
  { value: 'created-oldest', label: 'Oldest First' },
  { value: 'name-az', label: 'Name (A-Z)' },
  { value: 'name-za', label: 'Name (Z-A)' },
  { value: 'rate-high-low', label: 'Completion Rate (High)' },
  { value: 'rate-low-high', label: 'Completion Rate (Low)' },
  { value: 'manual', label: 'Manual Order' },
];

export function SortSelect() {
  const { sortOption, setSortOption } = useHabitStore();

  return (
    <div className="relative">
      <select
        value={sortOption}
        onChange={(e) => setSortOption(e.target.value as SortOption)}
        className="block w-full pl-3 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 appearance-none cursor-pointer"
      >
        {SORT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
        <svg
          className="h-4 w-4 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </div>
    </div>
  );
}
