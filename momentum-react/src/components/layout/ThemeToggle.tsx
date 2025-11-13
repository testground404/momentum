import { useThemeStore } from '../../store/themeStore';
import { Button } from '../common/Button';

export function ThemeToggle() {
  const { mode, toggleTheme } = useThemeStore();

  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={toggleTheme}
      aria-label={`Switch to ${mode === 'dark' ? 'light' : 'dark'} mode`}
    >
      {mode === 'dark' ? '☀️' : '🌙'}
    </Button>
  );
}
