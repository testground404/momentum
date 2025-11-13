import { useState, useMemo, useCallback, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import type { IconCategory } from '../../data/icons';
import { HABIT_ICONS, ICON_CATEGORIES, DEFAULT_COLORS } from '../../data/icons';
import { Button } from '../common/Button';
import { Input } from '../common/Input';

interface IconPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (icon: string, color: string) => void;
  currentIcon?: string;
  currentColor?: string;
}

export function IconPickerModal({
  isOpen,
  onClose,
  onSelect,
  currentIcon = '💪',
  currentColor = '#3b82f6',
}: IconPickerModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<IconCategory>('All');
  const [selectedIcon, setSelectedIcon] = useState(currentIcon);
  const [selectedColor, setSelectedColor] = useState(currentColor);

  // Filter icons based on search and category
  const filteredIcons = useMemo(() => {
    let filtered = HABIT_ICONS;

    // Filter by category
    if (selectedCategory !== 'All') {
      filtered = filtered.filter((icon) => icon.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (icon) =>
          icon.name.toLowerCase().includes(query) ||
          icon.keywords.some((keyword) => keyword.toLowerCase().includes(query))
      );
    }

    return filtered;
  }, [searchQuery, selectedCategory]);

  const handleSelect = useCallback(() => {
    onSelect(selectedIcon, selectedColor);
    onClose();
  }, [selectedIcon, selectedColor, onSelect, onClose]);

  const handleIconClick = useCallback((emoji: string) => {
    setSelectedIcon(emoji);
  }, []);

  const handleColorClick = useCallback((color: string) => {
    setSelectedColor(color);
  }, []);

  const handleCategoryClick = useCallback((category: IconCategory) => {
    setSelectedCategory(category);
  }, []);

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
            <Dialog.Panel className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <Dialog.Title className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  Choose Icon & Color
                </Dialog.Title>
                <Dialog.Description className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Select an icon and color for your habit
                </Dialog.Description>
              </div>

              {/* Content */}
              <div className="px-6 py-4 max-h-[60vh] overflow-y-auto">
                {/* Preview */}
                <div className="flex items-center justify-center mb-6">
                  <div
                    className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl shadow-lg transition-all duration-200"
                    style={{ backgroundColor: selectedColor }}
                  >
                    {selectedIcon}
                  </div>
                </div>

                {/* Color Picker */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Color
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {DEFAULT_COLORS.map((color) => (
                      <button
                        key={color.value}
                        onClick={() => handleColorClick(color.value)}
                        className="group relative w-10 h-10 rounded-lg transition-all duration-200 hover:scale-110"
                        style={{ backgroundColor: color.value }}
                        aria-label={color.name}
                      >
                        {selectedColor === color.value && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <svg
                              className="w-5 h-5 text-white drop-shadow-md"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Search */}
                <div className="mb-4">
                  <Input
                    type="text"
                    placeholder="Search icons..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    leftIcon={
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
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                    }
                  />
                </div>

                {/* Category Filter */}
                <div className="mb-4">
                  <div className="flex flex-wrap gap-2">
                    {ICON_CATEGORIES.map((category) => (
                      <button
                        key={category}
                        onClick={() => handleCategoryClick(category)}
                        className={`px-3 py-1.5 text-sm rounded-lg transition-all duration-200 ${
                          selectedCategory === category
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Icon Grid */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Icon ({filteredIcons.length} {filteredIcons.length === 1 ? 'icon' : 'icons'})
                  </label>
                  {filteredIcons.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      No icons found. Try a different search or category.
                    </div>
                  ) : (
                    <div className="grid grid-cols-8 gap-2">
                      {filteredIcons.map((icon) => (
                        <button
                          key={icon.emoji}
                          onClick={() => handleIconClick(icon.emoji)}
                          className={`aspect-square flex items-center justify-center text-2xl rounded-lg transition-all duration-200 hover:scale-110 ${
                            selectedIcon === icon.emoji
                              ? 'bg-blue-100 dark:bg-blue-900/30 ring-2 ring-blue-600 dark:ring-blue-400 shadow-md'
                              : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'
                          }`}
                          title={icon.name}
                          aria-label={icon.name}
                        >
                          {icon.emoji}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700 flex items-center justify-end gap-3">
                <Button variant="secondary" onClick={onClose}>
                  Cancel
                </Button>
                <Button variant="primary" onClick={handleSelect}>
                  Select
                </Button>
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
}
