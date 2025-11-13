import { useThemeStore } from './store/themeStore';

function App() {
  const { mode, toggleTheme } = useThemeStore();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="card p-12 max-w-2xl mx-4">
        <div className="text-center">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Momentum
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            Habit Tracker - React Migration
          </p>

          <div className="space-y-4">
            <div className="bg-green-100 dark:bg-green-900 border border-green-300 dark:border-green-700 rounded-lg p-4">
              <h2 className="text-lg font-semibold text-green-800 dark:text-green-200 mb-2">
                ✅ Phase 1 Complete
              </h2>
              <p className="text-green-700 dark:text-green-300 text-sm">
                Project infrastructure successfully set up
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                  Frontend Stack
                </h3>
                <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                  <li>• React 18 + TypeScript</li>
                  <li>• Vite Build Tool</li>
                  <li>• Tailwind CSS</li>
                  <li>• Zustand State Management</li>
                </ul>
              </div>

              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                <h3 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">
                  Backend & Tools
                </h3>
                <ul className="text-sm text-purple-700 dark:text-purple-300 space-y-1">
                  <li>• Firebase Auth & Firestore</li>
                  <li>• React Query</li>
                  <li>• date-fns</li>
                  <li>• Headless UI</li>
                </ul>
              </div>
            </div>

            <button
              onClick={toggleTheme}
              className="btn btn-primary w-full mt-6"
            >
              Toggle Theme (Current: {mode === 'dark' ? '🌙 Dark' : '☀️ Light'})
            </button>

            <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Next Steps: Phase 2 - Core Components Development
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
