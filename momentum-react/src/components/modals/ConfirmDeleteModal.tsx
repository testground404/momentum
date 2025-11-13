import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import type { Habit } from '../../types';
import { Button } from '../common/Button';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  habit: Habit | null;
  isLoading?: boolean;
}

export function ConfirmDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  habit,
  isLoading = false,
}: ConfirmDeleteModalProps) {
  if (!habit) return null;

  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog onClose={onClose} className="relative z-50">
        {/* Backdrop */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" />
        </Transition.Child>

        {/* Modal */}
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <Dialog.Panel className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
              {/* Content */}
              <div className="px-6 py-6">
                {/* Icon */}
                <div className="mx-auto flex items-center justify-center w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
                  <svg
                    className="w-6 h-6 text-red-600 dark:text-red-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>

                {/* Title */}
                <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-gray-100 text-center mb-2">
                  Delete Habit?
                </Dialog.Title>

                {/* Description */}
                <Dialog.Description className="text-sm text-gray-500 dark:text-gray-400 text-center mb-4">
                  Are you sure you want to delete <span className="font-semibold text-gray-700 dark:text-gray-300">"{habit.name}"</span>?
                  <br />
                  <span className="text-red-600 dark:text-red-400 font-medium">
                    This action cannot be undone and all tracking data will be permanently lost.
                  </span>
                </Dialog.Description>

                {/* Habit Preview */}
                <div className="flex items-center gap-3 p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 mb-6">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-xl flex-shrink-0"
                    style={{ backgroundColor: habit.color }}
                  >
                    {habit.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 dark:text-gray-100 truncate">
                      {habit.name}
                    </div>
                    {habit.description && (
                      <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                        {habit.description}
                      </div>
                    )}
                  </div>
                </div>

                {/* Alternative Action */}
                <div className="text-xs text-center text-gray-500 dark:text-gray-400 mb-6">
                  💡 Tip: You can archive this habit instead to keep your data while hiding it from view.
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700 flex items-center justify-end gap-3">
                <Button type="button" variant="secondary" onClick={onClose} disabled={isLoading}>
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="danger"
                  onClick={onConfirm}
                  loading={isLoading}
                  disabled={isLoading}
                >
                  Delete Habit
                </Button>
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
}
