import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Habit, SortOption, ViewMode, HabitStats, ModalState } from '../types';
import { calculateHabitStats, sortHabits, filterHabits } from '../utils/habitUtils';

interface HabitStore {
  // State
  habits: Habit[];
  currentView: ViewMode;
  currentYear: number;
  currentMonth: number;
  searchQuery: string;
  sortOption: SortOption;
  showArchived: boolean;
  selectedHabitId: string | null;
  modal: ModalState;

  // Actions - Habit CRUD
  setHabits: (habits: Habit[]) => void;
  addHabit: (habit: Habit) => void;
  updateHabit: (id: string, updates: Partial<Habit>) => void;
  deleteHabit: (id: string) => void;
  archiveHabit: (id: string) => void;
  unarchiveHabit: (id: string) => void;

  // Actions - Completion tracking
  toggleCompletion: (habitId: string, dayIndex: number) => void;
  setNote: (habitId: string, dayIndex: number, note: string) => void;

  // Actions - View controls
  setView: (view: ViewMode) => void;
  setYear: (year: number) => void;
  setMonth: (month: number) => void;
  setSearchQuery: (query: string) => void;
  setSortOption: (option: SortOption) => void;
  setShowArchived: (show: boolean) => void;
  setSelectedHabit: (id: string | null) => void;

  // Actions - Modal
  openModal: (type: ModalState['type'], data?: any) => void;
  closeModal: () => void;

  // Computed values
  getFilteredHabits: () => Habit[];
  getHabitById: (id: string) => Habit | undefined;
  getHabitStats: (habitId: string) => HabitStats | null;
  getTotalHabits: () => number;
  getActiveHabits: () => number;
}

export const useHabitStore = create<HabitStore>()(
  persist(
    (set, get) => ({
      // Initial state
      habits: [],
      currentView: 'year',
      currentYear: new Date().getFullYear(),
      currentMonth: new Date().getMonth(),
      searchQuery: '',
      sortOption: 'created-newest',
      showArchived: false,
      selectedHabitId: null,
      modal: { type: null },

      // Habit CRUD Actions
      setHabits: (habits) => set({ habits }),

      addHabit: (habit) =>
        set((state) => ({
          habits: [...state.habits, habit],
        })),

      updateHabit: (id, updates) =>
        set((state) => ({
          habits: state.habits.map((h) =>
            h.id === id ? { ...h, ...updates, updatedAt: new Date().toISOString() } : h
          ),
        })),

      deleteHabit: (id) =>
        set((state) => ({
          habits: state.habits.filter((h) => h.id !== id),
          selectedHabitId: state.selectedHabitId === id ? null : state.selectedHabitId,
        })),

      archiveHabit: (id) =>
        set((state) => ({
          habits: state.habits.map((h) =>
            h.id === id ? { ...h, archived: true, updatedAt: new Date().toISOString() } : h
          ),
        })),

      unarchiveHabit: (id) =>
        set((state) => ({
          habits: state.habits.map((h) =>
            h.id === id ? { ...h, archived: false, updatedAt: new Date().toISOString() } : h
          ),
        })),

      // Completion tracking
      toggleCompletion: (habitId, dayIndex) =>
        set((state) => ({
          habits: state.habits.map((h) => {
            if (h.id !== habitId) return h;

            const completions = { ...h.completions };
            const key = dayIndex.toString();

            if (completions[key]) {
              delete completions[key];
            } else {
              completions[key] = true;
            }

            return {
              ...h,
              completions,
              updatedAt: new Date().toISOString(),
            };
          }),
        })),

      setNote: (habitId, dayIndex, note) =>
        set((state) => ({
          habits: state.habits.map((h) => {
            if (h.id !== habitId) return h;

            const notes = { ...(h.notes || {}) };
            const key = dayIndex.toString();

            if (note.trim() === '') {
              delete notes[key];
            } else {
              notes[key] = note;
            }

            return {
              ...h,
              notes: Object.keys(notes).length > 0 ? notes : undefined,
              updatedAt: new Date().toISOString(),
            };
          }),
        })),

      // View controls
      setView: (currentView) => set({ currentView }),

      setYear: (currentYear) => set({ currentYear }),

      setMonth: (currentMonth) => set({ currentMonth }),

      setSearchQuery: (searchQuery) => set({ searchQuery }),

      setSortOption: (sortOption) => set({ sortOption }),

      setShowArchived: (showArchived) => set({ showArchived }),

      setSelectedHabit: (selectedHabitId) => set({ selectedHabitId }),

      // Modal actions
      openModal: (type, data) => set({ modal: { type, data } }),

      closeModal: () => set({ modal: { type: null } }),

      // Computed values
      getFilteredHabits: () => {
        const { habits, searchQuery, sortOption, showArchived } = get();
        let filtered = filterHabits(habits, searchQuery, showArchived);
        return sortHabits(filtered, sortOption);
      },

      getHabitById: (id) => {
        return get().habits.find((h) => h.id === id);
      },

      getHabitStats: (habitId) => {
        const habit = get().habits.find((h) => h.id === habitId);
        if (!habit) return null;
        return calculateHabitStats(habit);
      },

      getTotalHabits: () => {
        return get().habits.length;
      },

      getActiveHabits: () => {
        return get().habits.filter((h) => !h.archived).length;
      },
    }),
    {
      name: 'momentum-storage',
      partialize: (state) => ({
        habits: state.habits,
        currentView: state.currentView,
        sortOption: state.sortOption,
        showArchived: state.showArchived,
      }),
    }
  )
);
