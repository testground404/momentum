import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import type { Habit } from '../types';
import habitService from '../services/habitService';
import { useHabitStore } from '../store/habitStore';

const HABITS_QUERY_KEY = 'habits';

/**
 * Hook for fetching user habits with React Query
 */
export const useUserHabits = (userId: string | undefined) => {
  return useQuery({
    queryKey: [HABITS_QUERY_KEY, userId],
    queryFn: () => habitService.fetchUserHabits(userId!),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

/**
 * Hook for real-time habit subscriptions
 * This will keep Zustand store in sync with Firebase
 */
export const useHabitsSubscription = (userId: string | undefined) => {
  const setHabits = useHabitStore((state) => state.setHabits);

  useEffect(() => {
    if (!userId) return;

    const unsubscribe = habitService.subscribeToUserHabits(userId, (habits) => {
      setHabits(habits);
    });

    return () => {
      unsubscribe();
    };
  }, [userId, setHabits]);
};

/**
 * Hook for creating a new habit
 */
export const useCreateHabit = () => {
  const queryClient = useQueryClient();
  const addHabit = useHabitStore((state) => state.addHabit);

  return useMutation({
    mutationFn: (habitData: Omit<Habit, 'id'>) =>
      habitService.createHabit(habitData),
    onSuccess: (habitId, habitData) => {
      // Optimistically add to local store
      addHabit({ ...habitData, id: habitId });
      // Invalidate queries to refetch
      queryClient.invalidateQueries({ queryKey: [HABITS_QUERY_KEY] });
    },
  });
};

/**
 * Hook for updating a habit
 */
export const useUpdateHabit = () => {
  const queryClient = useQueryClient();
  const updateHabit = useHabitStore((state) => state.updateHabit);

  return useMutation({
    mutationFn: ({
      habitId,
      updates,
    }: {
      habitId: string;
      updates: Partial<Omit<Habit, 'id'>>;
    }) => habitService.updateHabit(habitId, updates),
    onMutate: async ({ habitId, updates }) => {
      // Optimistically update local store
      updateHabit(habitId, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [HABITS_QUERY_KEY] });
    },
  });
};

/**
 * Hook for deleting a habit
 */
export const useDeleteHabit = () => {
  const queryClient = useQueryClient();
  const deleteHabit = useHabitStore((state) => state.deleteHabit);

  return useMutation({
    mutationFn: (habitId: string) => habitService.deleteHabit(habitId),
    onMutate: async (habitId) => {
      // Optimistically delete from local store
      deleteHabit(habitId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [HABITS_QUERY_KEY] });
    },
  });
};

/**
 * Hook for archiving a habit
 */
export const useArchiveHabit = () => {
  const queryClient = useQueryClient();
  const archiveHabit = useHabitStore((state) => state.archiveHabit);

  return useMutation({
    mutationFn: (habitId: string) => habitService.archiveHabit(habitId),
    onMutate: async (habitId) => {
      archiveHabit(habitId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [HABITS_QUERY_KEY] });
    },
  });
};

/**
 * Hook for toggling habit completion
 */
export const useToggleCompletion = () => {
  const queryClient = useQueryClient();
  const toggleCompletion = useHabitStore((state) => state.toggleCompletion);

  return useMutation({
    mutationFn: ({
      habitId,
      dayIndex,
      currentCompletions,
    }: {
      habitId: string;
      dayIndex: number;
      currentCompletions: { [dayIndex: string]: boolean };
    }) => habitService.toggleHabitCompletion(habitId, dayIndex, currentCompletions),
    onMutate: async ({ habitId, dayIndex }) => {
      // Optimistically toggle in local store
      toggleCompletion(habitId, dayIndex);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [HABITS_QUERY_KEY] });
    },
  });
};

/**
 * Hook for updating habit notes
 */
export const useUpdateNote = () => {
  const queryClient = useQueryClient();
  const setNote = useHabitStore((state) => state.setNote);

  return useMutation({
    mutationFn: ({
      habitId,
      dayIndex,
      note,
      currentNotes,
    }: {
      habitId: string;
      dayIndex: number;
      note: string;
      currentNotes?: { [dayIndex: string]: string };
    }) => habitService.updateHabitNote(habitId, dayIndex, note, currentNotes),
    onMutate: async ({ habitId, dayIndex, note }) => {
      // Optimistically update in local store
      setNote(habitId, dayIndex, note);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [HABITS_QUERY_KEY] });
    },
  });
};
