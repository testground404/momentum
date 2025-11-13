import { useEffect, lazy, Suspense } from 'react';
import { useHabitStore } from '../store/habitStore';
import { HabitList } from '../components/habits';
import { useHabitActions } from '../hooks/useHabitActions';
import type { Habit } from '../types';

// Lazy load modals for code splitting
const HabitFormModal = lazy(() => import('../components/modals').then(module => ({ default: module.HabitFormModal })));
const ConfirmDeleteModal = lazy(() => import('../components/modals').then(module => ({ default: module.ConfirmDeleteModal })));

export function HabitsPage() {
  const { habits, addHabit, modal, closeModal } = useHabitStore();
  const { isCreating, isUpdating, isDeleting } = useHabitActions();

  // Add demo habit on first load
  useEffect(() => {
    if (habits.length === 0) {
      const today = new Date();
      const demoHabit = {
        id: 'demo-1',
        name: 'Morning Exercise',
        description: 'Start the day with 30 minutes of exercise',
        icon: '💪',
        color: '#3b82f6',
        year: today.getFullYear(),
        startDate: new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0],
        createdAt: new Date().toISOString(),
        archived: false,
        completions: {
          '0': true,
          '1': true,
          '5': true,
          '10': true,
          '15': true,
          '20': true,
          '25': true,
          '30': true,
        },
      };
      addHabit(demoHabit);
    }
  }, [habits.length, addHabit]);

  // Modal handlers
  const handleCreateHabit = async (habitData: Partial<Habit>) => {
    try {
      const newHabit: Habit = {
        id: `habit-${Date.now()}`,
        name: habitData.name!,
        description: habitData.description,
        icon: habitData.icon!,
        color: habitData.color!,
        year: habitData.year!,
        startDate: habitData.startDate!,
        createdAt: new Date().toISOString(),
        archived: false,
        completions: {},
        notes: {},
      };
      addHabit(newHabit);
      closeModal();
    } catch (error) {
      console.error('Failed to create habit:', error);
    }
  };

  const handleUpdateHabit = async (habitData: Partial<Habit>) => {
    try {
      const habitId = modal.data?.habit?.id;
      if (!habitId) return;

      const updatedHabit = habits.find((h) => h.id === habitId);
      if (updatedHabit) {
        const updated = {
          ...updatedHabit,
          ...habitData,
          updatedAt: new Date().toISOString(),
        };
        addHabit(updated);
      }
      closeModal();
    } catch (error) {
      console.error('Failed to update habit:', error);
    }
  };

  const handleDeleteHabit = async () => {
    try {
      const habitId = modal.data?.habit?.id;
      if (!habitId) return;

      // TODO: Implement actual delete functionality when connected to Firebase
      console.log('Delete habit:', habitId);
      closeModal();
    } catch (error) {
      console.error('Failed to delete habit:', error);
    }
  };

  return (
    <>
      {/* Habit List */}
      <HabitList />

      {/* Modals - Lazy loaded with Suspense */}
      <Suspense fallback={null}>
        {(modal.type === 'habit-form' || modal.type === 'habit-edit') && (
          <HabitFormModal
            isOpen={true}
            onClose={closeModal}
            onSubmit={modal.type === 'habit-edit' ? handleUpdateHabit : handleCreateHabit}
            habit={modal.type === 'habit-edit' ? modal.data?.habit : null}
            isLoading={isCreating || isUpdating}
          />
        )}

        {modal.type === 'confirm-delete' && (
          <ConfirmDeleteModal
            isOpen={true}
            onClose={closeModal}
            onConfirm={handleDeleteHabit}
            habit={modal.data?.habit || null}
            isLoading={isDeleting}
          />
        )}
      </Suspense>
    </>
  );
}
