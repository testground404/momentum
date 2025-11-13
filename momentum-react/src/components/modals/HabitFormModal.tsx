import { useState, useCallback, useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import type { Habit } from '../../types';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { IconPickerModal } from './IconPickerModal';

interface HabitFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (habitData: Partial<Habit>) => void;
  habit?: Habit | null;
  isLoading?: boolean;
}

interface FormData {
  name: string;
  description: string;
  icon: string;
  color: string;
  startDate: string;
}

interface FormErrors {
  name?: string;
  startDate?: string;
}

export function HabitFormModal({
  isOpen,
  onClose,
  onSubmit,
  habit,
  isLoading = false,
}: HabitFormModalProps) {
  const isEditMode = !!habit;

  // Form state
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    icon: '💪',
    color: '#3b82f6',
    startDate: new Date().toISOString().split('T')[0],
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [showIconPicker, setShowIconPicker] = useState(false);

  // Initialize form data when modal opens or habit changes
  useEffect(() => {
    if (isOpen) {
      if (habit) {
        setFormData({
          name: habit.name,
          description: habit.description || '',
          icon: habit.icon,
          color: habit.color,
          startDate: habit.startDate,
        });
      } else {
        setFormData({
          name: '',
          description: '',
          icon: '💪',
          color: '#3b82f6',
          startDate: new Date().toISOString().split('T')[0],
        });
      }
      setErrors({});
    }
  }, [isOpen, habit]);

  // Form validation
  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    } else if (formData.name.trim().length > 50) {
      newErrors.name = 'Name must be less than 50 characters';
    }

    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // Handle form submission
  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      if (!validateForm()) {
        return;
      }

      const habitData: Partial<Habit> = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        icon: formData.icon,
        color: formData.color,
        startDate: formData.startDate,
      };

      // For new habits, add year based on start date
      if (!isEditMode) {
        const startYear = new Date(formData.startDate).getFullYear();
        habitData.year = startYear;
      }

      onSubmit(habitData);
    },
    [formData, validateForm, onSubmit, isEditMode]
  );

  // Handle input changes
  const handleInputChange = useCallback(
    (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setFormData((prev) => ({
        ...prev,
        [field]: e.target.value,
      }));
      // Clear error for this field
      if (errors[field as keyof FormErrors]) {
        setErrors((prev) => ({
          ...prev,
          [field]: undefined,
        }));
      }
    },
    [errors]
  );

  // Handle icon and color selection
  const handleIconSelect = useCallback((icon: string, color: string) => {
    setFormData((prev) => ({
      ...prev,
      icon,
      color,
    }));
    setShowIconPicker(false);
  }, []);

  return (
    <>
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
              <Dialog.Panel className="w-full max-w-lg bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                  <Dialog.Title className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                    {isEditMode ? 'Edit Habit' : 'Create New Habit'}
                  </Dialog.Title>
                  <Dialog.Description className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {isEditMode
                      ? 'Update your habit details'
                      : 'Create a new habit to track your progress'}
                  </Dialog.Description>
                </div>

                {/* Content */}
                <form onSubmit={handleSubmit}>
                  <div className="px-6 py-4 space-y-4">
                    {/* Icon & Color Picker Button */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Icon & Color
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowIconPicker(true)}
                        className="flex items-center gap-3 px-4 py-3 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-200 w-full"
                      >
                        <div
                          className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl shadow-sm"
                          style={{ backgroundColor: formData.color }}
                        >
                          {formData.icon}
                        </div>
                        <div className="text-left flex-1">
                          <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Click to change
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Choose an icon and color
                          </div>
                        </div>
                        <svg
                          className="w-5 h-5 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </button>
                    </div>

                    {/* Name */}
                    <div>
                      <Input
                        label="Habit Name"
                        type="text"
                        value={formData.name}
                        onChange={handleInputChange('name')}
                        error={errors.name}
                        placeholder="e.g., Morning Exercise"
                        maxLength={50}
                        autoFocus
                        required
                      />
                    </div>

                    {/* Description */}
                    <div>
                      <label
                        htmlFor="description"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                      >
                        Description (Optional)
                      </label>
                      <textarea
                        id="description"
                        value={formData.description}
                        onChange={handleInputChange('description')}
                        placeholder="e.g., 30 minutes of cardio every morning"
                        rows={3}
                        maxLength={200}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 resize-none"
                      />
                      <div className="mt-1 text-xs text-gray-500 dark:text-gray-400 text-right">
                        {formData.description.length}/200
                      </div>
                    </div>

                    {/* Start Date */}
                    <div>
                      <Input
                        label="Start Date"
                        type="date"
                        value={formData.startDate}
                        onChange={handleInputChange('startDate')}
                        error={errors.startDate}
                        max={new Date().toISOString().split('T')[0]}
                        disabled={isEditMode}
                        required
                      />
                      {isEditMode && (
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          Start date cannot be changed after creation
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700 flex items-center justify-end gap-3">
                    <Button type="button" variant="secondary" onClick={onClose} disabled={isLoading}>
                      Cancel
                    </Button>
                    <Button type="submit" variant="primary" loading={isLoading} disabled={isLoading}>
                      {isEditMode ? 'Save Changes' : 'Create Habit'}
                    </Button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>

      {/* Icon Picker Modal */}
      <IconPickerModal
        isOpen={showIconPicker}
        onClose={() => setShowIconPicker(false)}
        onSelect={handleIconSelect}
        currentIcon={formData.icon}
        currentColor={formData.color}
      />
    </>
  );
}
