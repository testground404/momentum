import { create } from 'zustand';
import { Habit, SortOption, ViewMode } from '../types';

interface HabitStore {
  // State
  habits: Habit[];
  searchQuery: string;
  sortBy: SortOption;
  viewMode: ViewMode;
  showArchived: boolean;
  selectedDate: Date;

  // Actions
  setHabits: (habits: Habit[]) => void;
  addHabit: (habit: Habit) => void;
  updateHabit: (id: string, updates: Partial<Habit>) => void;
  deleteHabit: (id: string) => void;
  setSearchQuery: (query: string) => void;
  setSortBy: (sortBy: SortOption) => void;
  setViewMode: (mode: ViewMode) => void;
  setShowArchived: (show: boolean) => void;
  setSelectedDate: (date: Date) => void;
}

export const useHabitStore = create<HabitStore>((set) => ({
  // Initial state
  habits: [],
  searchQuery: '',
  sortBy: 'manual',
  viewMode: 'year',
  showArchived: false,
  selectedDate: new Date(),

  // Actions
  setHabits: (habits) => set({ habits }),

  addHabit: (habit) => set((state) => ({
    habits: [...state.habits, habit],
  })),

  updateHabit: (id, updates) => set((state) => ({
    habits: state.habits.map((h) =>
      h.id === id ? { ...h, ...updates } : h
    ),
  })),

  deleteHabit: (id) => set((state) => ({
    habits: state.habits.filter((h) => h.id !== id),
  })),

  setSearchQuery: (searchQuery) => set({ searchQuery }),

  setSortBy: (sortBy) => set({ sortBy }),

  setViewMode: (viewMode) => set({ viewMode }),

  setShowArchived: (showArchived) => set({ showArchived }),

  setSelectedDate: (selectedDate) => set({ selectedDate }),
}));
