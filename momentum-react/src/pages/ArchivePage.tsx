import { lazy, Suspense } from 'react';
import { useHabitStore } from '../store/habitStore';
import { HabitList } from '../components/habits';
import { useHabitActions } from '../hooks/useHabitActions';
import type { Habit } from '../types';

// Lazy load modals for code splitting
const HabitFormModal = lazy(() => import('../components/modals').then(module => ({ default: module.HabitFormModal })));
const ConfirmDeleteModal = lazy(() => import('../components/modals').then(module => ({ default: module.ConfirmDeleteModal })));

export function ArchivePage() {
  const { habits, addHabit, modal, closeModal } = useHabitStore();
  const { isUpdating, isDeleting } = useHabitActions();

  const archivedHabits = habits.filter((h) => h.archived);

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
      {/* Empty State */}
      {archivedHabits.length === 0 ? (
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
            <svg
              className="w-8 h-8 text-gray-400 dark:text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            No archived habits
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Habits you archive will appear here
          </p>
        </div>
      ) : (
        <>
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Archived Habits ({archivedHabits.length})
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              These habits are hidden from your main view but you can restore them anytime
            </p>
          </div>

          <HabitList />
        </>
      )}

      {/* Modals - Lazy loaded with Suspense */}
      <Suspense fallback={null}>
        {modal.type === 'habit-edit' && (
          <HabitFormModal
            isOpen={true}
            onClose={closeModal}
            onSubmit={handleUpdateHabit}
            habit={modal.data?.habit || null}
            isLoading={isUpdating}
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
