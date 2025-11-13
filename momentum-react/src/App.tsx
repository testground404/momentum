import { useThemeStore } from './store/themeStore';
import { useHabitStore } from './store/habitStore';

function App() {
  const { mode, toggleTheme } = useThemeStore();
  const { habits, currentView, sortOption } = useHabitStore();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="card p-8 md:p-12 max-w-4xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Momentum
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-2">
            Habit Tracker - React Migration
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Phase 2: Core Architecture & State Management
          </p>
        </div>

        <div className="space-y-6">
          {/* Phase Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded-lg p-4">
              <h2 className="text-lg font-semibold text-green-800 dark:text-green-200 mb-2 flex items-center gap-2">
                <span>✅</span> Phase 1 Complete
              </h2>
              <p className="text-green-700 dark:text-green-300 text-sm">
                Project infrastructure & dependencies
              </p>
            </div>

            <div className="bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded-lg p-4">
              <h2 className="text-lg font-semibold text-green-800 dark:text-green-200 mb-2 flex items-center gap-2">
                <span>✅</span> Phase 2 Complete
              </h2>
              <p className="text-green-700 dark:text-green-300 text-sm">
                State management & Firebase integration
              </p>
            </div>
          </div>

          {/* Architecture Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-3 text-sm">
                State Management
              </h3>
              <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                <li>• Zustand Store</li>
                <li>• React Query (Server)</li>
                <li>• LocalStorage Persist</li>
                <li>• Real-time Sync</li>
              </ul>
            </div>

            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
              <h3 className="font-semibold text-purple-900 dark:text-purple-100 mb-3 text-sm">
                Firebase Services
              </h3>
              <ul className="text-xs text-purple-700 dark:text-purple-300 space-y-1">
                <li>• Authentication</li>
                <li>• Firestore CRUD</li>
                <li>• Real-time Listeners</li>
                <li>• Type Conversions</li>
              </ul>
            </div>

            <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-4">
              <h3 className="font-semibold text-emerald-900 dark:text-emerald-100 mb-3 text-sm">
                Utilities & Hooks
              </h3>
              <ul className="text-xs text-emerald-700 dark:text-emerald-300 space-y-1">
                <li>• Custom React Hooks</li>
                <li>• Stats Calculations</li>
                <li>• Date Helpers</li>
                <li>• Filter & Sort Logic</li>
              </ul>
            </div>
          </div>

          {/* Store State Demo */}
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Live Store State
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600 dark:text-gray-400">Habits Count:</span>
                <span className="ml-2 font-mono text-blue-600 dark:text-blue-400">
                  {habits.length}
                </span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Current View:</span>
                <span className="ml-2 font-mono text-blue-600 dark:text-blue-400">
                  {currentView}
                </span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Sort Option:</span>
                <span className="ml-2 font-mono text-blue-600 dark:text-blue-400">
                  {sortOption}
                </span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Theme:</span>
                <span className="ml-2 font-mono text-blue-600 dark:text-blue-400">
                  {mode}
                </span>
              </div>
            </div>
          </div>

          {/* Phase 2 Features */}
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-lg p-6 border border-indigo-200 dark:border-indigo-800">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Phase 2 Deliverables
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="flex items-start gap-2">
                <span className="text-green-600 dark:text-green-400 mt-0.5">✓</span>
                <span className="text-gray-700 dark:text-gray-300">
                  Enhanced type definitions with day-indexed completions
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-600 dark:text-green-400 mt-0.5">✓</span>
                <span className="text-gray-700 dark:text-gray-300">
                  Complete Zustand store with computed getters
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-600 dark:text-green-400 mt-0.5">✓</span>
                <span className="text-gray-700 dark:text-gray-300">
                  Firebase services with real-time subscriptions
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-600 dark:text-green-400 mt-0.5">✓</span>
                <span className="text-gray-700 dark:text-gray-300">
                  React Query hooks for optimistic updates
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-600 dark:text-green-400 mt-0.5">✓</span>
                <span className="text-gray-700 dark:text-gray-300">
                  Habit statistics & streak calculations
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-600 dark:text-green-400 mt-0.5">✓</span>
                <span className="text-gray-700 dark:text-gray-300">
                  Authentication hook with Google sign-in
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-600 dark:text-green-400 mt-0.5">✓</span>
                <span className="text-gray-700 dark:text-gray-300">
                  Filter & sort utilities (6 sort options)
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-600 dark:text-green-400 mt-0.5">✓</span>
                <span className="text-gray-700 dark:text-gray-300">
                  Comprehensive date & day-index helpers
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={toggleTheme}
              className="btn btn-primary flex-1"
            >
              {mode === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode'}
            </button>
            <button
              onClick={() => window.open('PHASE_2_ARCHITECTURE.md', '_blank')}
              className="btn btn-secondary flex-1"
            >
              📖 View Documentation
            </button>
          </div>

          {/* Next Phase */}
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Next Phase: Core Components Development
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500">
              Building reusable UI components, habit cards, year wheel, and month grid views
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
