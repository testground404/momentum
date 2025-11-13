import { useEffect } from 'react';
import { useThemeStore } from './store/themeStore';
import { useHabitStore } from './store/habitStore';
import { Button } from './components/common';
import { HabitList } from './components/habits';

function App() {
  const { mode, toggleTheme } = useThemeStore();
  const { habits, addHabit, setView, currentView } = useHabitStore();

  // Add demo habit on first load
  useEffect(() => {
    if (habits.length === 0) {
      const today = new Date();
      const demoHabit = {
        id: 'demo-1',
        name: 'Morning Exercise',
        description: 'Start the day with 30 minutes of exercise',
        icon: '💪',
        color: '#3b82f6',
        year: today.getFullYear(),
        startDate: new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0],
        createdAt: new Date().toISOString(),
        archived: false,
        completions: {
          // Add some demo completions
          '0': true,
          '1': true,
          '5': true,
          '10': true,
          '15': true,
          '20': true,
          '25': true,
          '30': true,
        },
      };
      addHabit(demoHabit);
    }
  }, [habits.length, addHabit]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Momentum
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Phase 3: Component Migration
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* View Toggle */}
              <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                <button
                  onClick={() => setView('year')}
                  className={`px-3 py-1.5 text-sm rounded-md transition-all ${
                    currentView === 'year'
                      ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400'
                  }`}
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
                >
                  Month
                </button>
              </div>

              {/* Theme Toggle */}
              <Button variant="secondary" size="sm" onClick={toggleTheme}>
                {mode === 'dark' ? '☀️' : '🌙'}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Phase Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded-lg p-4">
            <h2 className="text-sm font-semibold text-green-800 dark:text-green-200 mb-1 flex items-center gap-2">
              <span>✅</span> Phase 1
            </h2>
            <p className="text-xs text-green-700 dark:text-green-300">
              Infrastructure Setup
            </p>
          </div>

          <div className="bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded-lg p-4">
            <h2 className="text-sm font-semibold text-green-800 dark:text-green-200 mb-1 flex items-center gap-2">
              <span>✅</span> Phase 2
            </h2>
            <p className="text-xs text-green-700 dark:text-green-300">
              Core Architecture
            </p>
          </div>

          <div className="bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded-lg p-4">
            <h2 className="text-sm font-semibold text-green-800 dark:text-green-200 mb-1 flex items-center gap-2">
              <span>✅</span> Phase 3
            </h2>
            <p className="text-xs text-green-700 dark:text-green-300">
              Component Migration
            </p>
          </div>
        </div>

        {/* Component Demo Section */}
        <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Phase 3 Components
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-green-600 dark:text-green-400">✓</span>
              <span className="text-gray-700 dark:text-gray-300">Button</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-600 dark:text-green-400">✓</span>
              <span className="text-gray-700 dark:text-gray-300">Input</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-600 dark:text-green-400">✓</span>
              <span className="text-gray-700 dark:text-gray-300">Card</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-600 dark:text-green-400">✓</span>
              <span className="text-gray-700 dark:text-gray-300">HabitCard</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-600 dark:text-green-400">✓</span>
              <span className="text-gray-700 dark:text-gray-300">YearWheel</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-600 dark:text-green-400">✓</span>
              <span className="text-gray-700 dark:text-gray-300">MonthGrid</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-600 dark:text-green-400">✓</span>
              <span className="text-gray-700 dark:text-gray-300">HabitList</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-600 dark:text-green-400">✓</span>
              <span className="text-gray-700 dark:text-gray-300">Custom Hooks</span>
            </div>
          </div>
        </div>

        {/* Habit List */}
        <HabitList />
      </main>

      {/* Footer */}
      <footer className="mt-16 py-8 border-t border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Try clicking on the dots in the year wheel or the days in the month grid to toggle completions!
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
