import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ThemeStore {
  mode: 'light' | 'dark';
  toggleTheme: () => void;
  setTheme: (mode: 'light' | 'dark') => void;
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set) => ({
      mode: 'light',

      toggleTheme: () => set((state) => {
        const newMode = state.mode === 'light' ? 'dark' : 'light';
        // Update document class for Tailwind dark mode
        if (newMode === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
        return { mode: newMode };
      }),

      setTheme: (mode) => set(() => {
        // Update document class for Tailwind dark mode
        if (mode === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
        return { mode };
      }),
    }),
    {
      name: 'theme-storage',
    }
  )
);
