import { useThemeStore } from '../store/themeStore';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';

export function SettingsPage() {
  const { mode, setTheme } = useThemeStore();
  const { user, signOut } = useAuth();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Account Settings */}
      <Card>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Account
        </h2>

        {user ? (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'User'}
                  className="w-16 h-16 rounded-full"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-white text-2xl font-semibold">
                  {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <div className="font-medium text-gray-900 dark:text-gray-100">
                  {user.displayName || 'Anonymous User'}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">{user.email}</div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button variant="danger" onClick={signOut}>
                Sign Out
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-gray-600 dark:text-gray-400">
            <p>Not signed in. Running in demo mode.</p>
          </div>
        )}
      </Card>

      {/* Appearance Settings */}
      <Card>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Appearance
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Theme
            </label>
            <div className="flex gap-3">
              <button
                onClick={() => setTheme('light')}
                className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                  mode === 'light'
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <span>☀️</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">Light</span>
                </div>
              </button>

              <button
                onClick={() => setTheme('dark')}
                className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                  mode === 'dark'
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700'
                }'`}
              >
                <div className="flex items-center justify-center gap-2">
                  <span>🌙</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">Dark</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* Data Settings */}
      <Card>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Data & Privacy
        </h2>

        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-medium text-gray-900 dark:text-gray-100">
                Export Data
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Download all your habits and tracking data
              </p>
            </div>
            <Button variant="secondary" size="sm">
              Export
            </Button>
          </div>

          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-medium text-red-600 dark:text-red-400">
                  Delete Account
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Permanently delete your account and all data
                </p>
              </div>
              <Button variant="danger" size="sm">
                Delete
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* About */}
      <Card>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
          About
        </h2>

        <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
          <div className="flex justify-between">
            <span>Version</span>
            <span className="font-medium">1.0.0</span>
          </div>
          <div className="flex justify-between">
            <span>Build</span>
            <span className="font-medium">Phase 5 - Layout & Routing</span>
          </div>
          <div className="flex justify-between">
            <span>Framework</span>
            <span className="font-medium">React 19.2.0</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
