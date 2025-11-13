import { describe, it, expect, beforeEach } from 'vitest';
import { useHabitStore } from '../../store/habitStore';
import type { Habit } from '../../types';

describe('HabitStore Integration', () => {
  const mockHabit: Habit = {
    id: 'test-1',
    name: 'Test Habit',
    description: 'Test description',
    icon: '💪',
    color: '#3b82f6',
    year: 2023,
    startDate: '2023-01-01',
    createdAt: '2023-01-01T00:00:00.000Z',
    archived: false,
    completions: {},
  };

  beforeEach(() => {
    // Reset store before each test
    useHabitStore.setState({
      habits: [],
      currentView: 'year',
      currentYear: new Date().getFullYear(),
      currentMonth: new Date().getMonth(),
      searchQuery: '',
      sortOption: 'created-newest',
      showArchived: false,
      selectedHabitId: null,
      modal: { type: null },
    });
  });

  describe('Habit CRUD Operations', () => {
    it('adds a habit', () => {
      const { addHabit, habits } = useHabitStore.getState();

      addHabit(mockHabit);

      const state = useHabitStore.getState();
      expect(state.habits).toHaveLength(1);
      expect(state.habits[0]).toEqual(mockHabit);
    });

    it('updates an existing habit', () => {
      const { addHabit, updateHabit } = useHabitStore.getState();

      addHabit(mockHabit);
      updateHabit('test-1', { name: 'Updated Name' });

      const state = useHabitStore.getState();
      expect(state.habits).toHaveLength(1);
      expect(state.habits[0].name).toBe('Updated Name');
    });

    it('toggles completion for a habit', () => {
      const { addHabit, toggleCompletion } = useHabitStore.getState();

      addHabit(mockHabit);
      toggleCompletion('test-1', 0);

      const state = useHabitStore.getState();
      expect(state.habits[0].completions['0']).toBe(true);

      // Toggle off
      toggleCompletion('test-1', 0);
      const stateAfter = useHabitStore.getState();
      expect(stateAfter.habits[0].completions['0']).toBeUndefined();
    });

    it('sets a note for a habit day', () => {
      const { addHabit, setNote } = useHabitStore.getState();

      addHabit(mockHabit);
      setNote('test-1', 0, 'Test note');

      const state = useHabitStore.getState();
      expect(state.habits[0].notes?.['0']).toBe('Test note');
    });

    it('archives a habit', () => {
      const { addHabit, archiveHabit } = useHabitStore.getState();

      addHabit(mockHabit);
      archiveHabit('test-1');

      const state = useHabitStore.getState();
      expect(state.habits[0].archived).toBe(true);
    });

    it('unarchives a habit', () => {
      const { addHabit, archiveHabit, unarchiveHabit } = useHabitStore.getState();

      addHabit(mockHabit);
      archiveHabit('test-1');
      unarchiveHabit('test-1');

      const state = useHabitStore.getState();
      expect(state.habits[0].archived).toBe(false);
    });
  });

  describe('Filtering and Sorting', () => {
    beforeEach(() => {
      const habits: Habit[] = [
        { ...mockHabit, id: '1', name: 'Zebra Habit', createdAt: '2023-01-01T00:00:00.000Z' },
        { ...mockHabit, id: '2', name: 'Apple Habit', createdAt: '2023-01-03T00:00:00.000Z' },
        { ...mockHabit, id: '3', name: 'Banana Habit', createdAt: '2023-01-02T00:00:00.000Z', archived: true },
      ];

      useHabitStore.setState({ habits });
    });

    it('filters habits by search query', () => {
      const { setSearchQuery, getFilteredHabits } = useHabitStore.getState();

      setSearchQuery('apple');
      const filtered = getFilteredHabits();

      expect(filtered).toHaveLength(1);
      expect(filtered[0].name).toBe('Apple Habit');
    });

    it('filters out archived habits by default', () => {
      const { getFilteredHabits } = useHabitStore.getState();

      const filtered = getFilteredHabits();

      expect(filtered).toHaveLength(2);
      expect(filtered.every(h => !h.archived)).toBe(true);
    });

    it('shows archived habits when showArchived is true', () => {
      const { setShowArchived, getFilteredHabits } = useHabitStore.getState();

      setShowArchived(true);
      const filtered = getFilteredHabits();

      expect(filtered).toHaveLength(1);
      expect(filtered[0].archived).toBe(true);
    });

    it('sorts habits by name A-Z', () => {
      const { setSortOption, getFilteredHabits } = useHabitStore.getState();

      setSortOption('name-az');
      const filtered = getFilteredHabits();

      expect(filtered[0].name).toBe('Apple Habit');
      expect(filtered[1].name).toBe('Zebra Habit');
    });

    it('sorts habits by creation date newest first', () => {
      const { setSortOption, getFilteredHabits } = useHabitStore.getState();

      setSortOption('created-newest');
      const filtered = getFilteredHabits();

      expect(filtered[0].id).toBe('2'); // Latest
      expect(filtered[1].id).toBe('1'); // Earliest (excluding archived)
    });
  });

  describe('View Management', () => {
    it('sets current view', () => {
      const { setView } = useHabitStore.getState();

      setView('month');

      const state = useHabitStore.getState();
      expect(state.currentView).toBe('month');
    });

    it('sets current year', () => {
      const { setYear } = useHabitStore.getState();

      setYear(2024);

      const state = useHabitStore.getState();
      expect(state.currentYear).toBe(2024);
    });

    it('sets current month', () => {
      const { setMonth } = useHabitStore.getState();

      setMonth(5);

      const state = useHabitStore.getState();
      expect(state.currentMonth).toBe(5);
    });
  });

  describe('Modal Management', () => {
    it('opens a modal', () => {
      const { openModal } = useHabitStore.getState();

      openModal('habit-form');

      const state = useHabitStore.getState();
      expect(state.modal.type).toBe('habit-form');
    });

    it('opens a modal with data', () => {
      const { openModal } = useHabitStore.getState();

      openModal('habit-edit', { habit: mockHabit });

      const state = useHabitStore.getState();
      expect(state.modal.type).toBe('habit-edit');
      expect(state.modal.data?.habit).toEqual(mockHabit);
    });

    it('closes a modal', () => {
      const { openModal, closeModal } = useHabitStore.getState();

      openModal('habit-form');
      closeModal();

      const state = useHabitStore.getState();
      expect(state.modal.type).toBeNull();
      expect(state.modal.data).toBeUndefined();
    });
  });

  describe('Computed Getters', () => {
    it('gets habit by ID', () => {
      const { addHabit, getHabitById } = useHabitStore.getState();

      addHabit(mockHabit);
      const habit = getHabitById('test-1');

      expect(habit).toEqual(mockHabit);
    });

    it('returns undefined for non-existent habit', () => {
      const { getHabitById } = useHabitStore.getState();

      const habit = getHabitById('non-existent');

      expect(habit).toBeUndefined();
    });

    it('gets total habits count', () => {
      const { addHabit, getTotalHabits } = useHabitStore.getState();

      addHabit({ ...mockHabit, id: '1' });
      addHabit({ ...mockHabit, id: '2' });
      addHabit({ ...mockHabit, id: '3', archived: true });

      expect(getTotalHabits()).toBe(3);
    });

    it('gets active habits count', () => {
      const { addHabit, getActiveHabits } = useHabitStore.getState();

      addHabit({ ...mockHabit, id: '1' });
      addHabit({ ...mockHabit, id: '2' });
      addHabit({ ...mockHabit, id: '3', archived: true });

      expect(getActiveHabits()).toBe(2);
    });
  });
});
