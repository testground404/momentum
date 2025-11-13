/**
 * Core type definitions for Momentum Habit Tracker
 */

export interface Habit {
  id: string;
  name: string;
  description?: string;
  icon: string;
  color: string;
  year: number;
  startDate: string; // ISO date string
  createdAt: string;
  updatedAt?: string;
  archived?: boolean;
  userId?: string;

  // Tracking data - dayIndex is 0-365 (or 0-366 for leap years)
  completions: { [dayIndex: string]: boolean };
  notes?: { [dayIndex: string]: string };
  order?: number;
}

export interface HabitStats {
  totalDays: number;
  completedDays: number;
  completionRate: number;
  currentStreak: number;
  longestStreak: number;
  lastCompletedDate?: string;
}

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export interface HabitFormData {
  name: string;
  description?: string;
  icon: string;
  color: string;
}

export type ViewMode = 'year' | 'month';

export type SortOption =
  | 'created-newest'
  | 'created-oldest'
  | 'name-az'
  | 'name-za'
  | 'rate-high-low'
  | 'rate-low-high'
  | 'manual';

export interface AppState {
  habits: Habit[];
  currentView: ViewMode;
  currentYear: number;
  currentMonth?: number;
  searchQuery: string;
  sortOption: SortOption;
  showArchived: boolean;
  selectedHabitId?: string;
}

// Icon and color picker types
export interface IconOption {
  name: string;
  category: string;
  tags: string[];
}

export interface ColorOption {
  name: string;
  value: string;
  textColor?: string;
}

// Modal types
export type ModalType = 'habit-form' | 'habit-edit' | 'confirm-delete' | 'settings' | null;

export interface ModalState {
  type: ModalType;
  data?: any;
}

// Firebase types
export interface FirebaseHabit extends Omit<Habit, 'id'> {
  // Server timestamps
  createdAt: any; // Firestore Timestamp
  updatedAt?: any; // Firestore Timestamp
}
