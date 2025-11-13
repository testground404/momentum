/**
 * Core type definitions for Momentum Habit Tracker
 */

export interface Habit {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color: string;
  createdAt: Date;
  updatedAt: Date;
  archived: boolean;
  userId: string;
  completions: Completion[];
  order: number;
}

export interface Completion {
  date: string; // ISO date string (YYYY-MM-DD)
  timestamp: Date;
}

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export interface Theme {
  mode: 'light' | 'dark';
}

export interface HabitFormData {
  name: string;
  description?: string;
  icon?: string;
  color: string;
}

export type SortOption = 'manual' | 'name' | 'created' | 'completion';
export type ViewMode = 'year' | 'month';

export interface AppState {
  habits: Habit[];
  searchQuery: string;
  sortBy: SortOption;
  viewMode: ViewMode;
  showArchived: boolean;
  selectedDate: Date;
}
