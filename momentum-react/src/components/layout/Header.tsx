import { useHabitStore } from '../../store/habitStore';
import { Button } from '../common/Button';
import { SearchBar } from './SearchBar';
import { SortSelect } from './SortSelect';
import { ViewToggle } from './ViewToggle';
import { ThemeToggle } from './ThemeToggle';
import { AccountMenu } from './AccountMenu';

export function Header() {
  const { currentYear, openModal } = useHabitStore();

  return (
    <header className="border-b border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm sticky top-0 z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Top Row */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Momentum
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Year
              </span>
              <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded text-sm font-medium">
                {currentYear}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <AccountMenu />
          </div>
        </div>

        {/* Toolbar Row */}
        <div className="flex items-center gap-3 flex-wrap">
          <SearchBar />

          <div className="flex items-center gap-2">
            <SortSelect />
            <ViewToggle />
            <ThemeToggle />

            <Button
              variant="primary"
              size="sm"
              onClick={() => openModal('habit-form')}
              className="flex items-center gap-2"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              <span className="hidden sm:inline">New Habit</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
