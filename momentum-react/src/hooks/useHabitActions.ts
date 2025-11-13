import { useCallback } from 'react';
import { useHabitStore } from '../store/habitStore';
import {
  useCreateHabit,
  useUpdateHabit,
  useDeleteHabit,
  useArchiveHabit,
  useToggleCompletion,
  useUpdateNote,
} from './useHabits';
import type { Habit } from '../types';

/**
 * Hook providing all habit-related actions
 */
export function useHabitActions() {
  const createMutation = useCreateHabit();
  const updateMutation = useUpdateHabit();
  const deleteMutation = useDeleteHabit();
  const archiveMutation = useArchiveHabit();
  const toggleCompletionMutation = useToggleCompletion();
  const updateNoteMutation = useUpdateNote();

  const { openModal, closeModal } = useHabitStore();

  const createHabit = useCallback(
    async (habitData: Omit<Habit, 'id'>) => {
      await createMutation.mutateAsync(habitData);
    },
    [createMutation]
  );

  const updateHabit = useCallback(
    async (habitId: string, updates: Partial<Omit<Habit, 'id'>>) => {
      await updateMutation.mutateAsync({ habitId, updates });
    },
    [updateMutation]
  );

  const deleteHabit = useCallback(
    async (habitId: string) => {
      await deleteMutation.mutateAsync(habitId);
    },
    [deleteMutation]
  );

  const archiveHabit = useCallback(
    async (habitId: string) => {
      await archiveMutation.mutateAsync(habitId);
    },
    [archiveMutation]
  );

  const toggleCompletion = useCallback(
    async (habitId: string, dayIndex: number, currentCompletions: { [key: string]: boolean }) => {
      await toggleCompletionMutation.mutateAsync({
        habitId,
        dayIndex,
        currentCompletions,
      });
    },
    [toggleCompletionMutation]
  );

  const updateNote = useCallback(
    async (
      habitId: string,
      dayIndex: number,
      note: string,
      currentNotes?: { [key: string]: string }
    ) => {
      await updateNoteMutation.mutateAsync({
        habitId,
        dayIndex,
        note,
        currentNotes,
      });
    },
    [updateNoteMutation]
  );

  return {
    createHabit,
    updateHabit,
    deleteHabit,
    archiveHabit,
    toggleCompletion,
    updateNote,
    openModal,
    closeModal,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isArchiving: archiveMutation.isPending,
  };
}
