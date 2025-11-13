/**
 * Script to migrate data from localStorage to Firebase
 * Run once after deploying React app
 *
 * Usage:
 * 1. Ensure user is logged in
 * 2. Open browser console on the new React app
 * 3. Run: migrateLocalStorageToFirebase()
 */

import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../src/services/firebase';
import type { Habit } from '../src/types';

/**
 * Old habit format from vanilla JS app
 */
interface OldHabit {
  id: string;
  name: string;
  description?: string;
  icon: string;
  color: string;
  year: number;
  startDate: string;
  createdAt: string;
  archived?: boolean;
  completions: Record<string, boolean>;
  notes?: Record<string, string>;
  order?: number;
}

/**
 * Main migration function
 * Call this from the browser console after logging in
 */
export async function migrateLocalStorageToFirebase(userId: string): Promise<void> {
  if (!userId) {
    throw new Error('User ID is required. Please ensure user is logged in.');
  }

  // Check for old localStorage data
  const oldData = localStorage.getItem('momentum-habits');
  if (!oldData) {
    console.log('No legacy data found in localStorage.');
    return;
  }

  try {
    const oldHabits: OldHabit[] = JSON.parse(oldData);

    if (!Array.isArray(oldHabits) || oldHabits.length === 0) {
      console.log('No habits to migrate.');
      return;
    }

    console.log(`Found ${oldHabits.length} habits to migrate...`);

    let successCount = 0;
    let errorCount = 0;

    for (const oldHabit of oldHabits) {
      try {
        const newHabit = transformOldToNew(oldHabit, userId);
        await addDoc(collection(db, 'habits'), newHabit);
        successCount++;
        console.log(`✓ Migrated: ${oldHabit.name}`);
      } catch (error) {
        errorCount++;
        console.error(`✗ Failed to migrate: ${oldHabit.name}`, error);
      }
    }

    console.log(`\nMigration complete!`);
    console.log(`✓ Success: ${successCount}`);
    console.log(`✗ Failed: ${errorCount}`);

    // Optionally backup old data
    if (successCount > 0) {
      const backup = localStorage.getItem('momentum-habits');
      if (backup) {
        localStorage.setItem('momentum-habits-backup', backup);
        console.log('\n💾 Backup created at: momentum-habits-backup');
      }
    }
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

/**
 * Transform old habit format to new Firebase format
 */
function transformOldToNew(oldHabit: OldHabit, userId: string): Omit<Habit, 'id'> & { userId: string } {
  return {
    userId,
    name: oldHabit.name,
    description: oldHabit.description,
    icon: oldHabit.icon || '✅',
    color: oldHabit.color || '#3b82f6',
    year: oldHabit.year || new Date().getFullYear(),
    startDate: oldHabit.startDate || new Date().toISOString().split('T')[0],
    createdAt: oldHabit.createdAt || new Date().toISOString(),
    archived: oldHabit.archived || false,
    completions: oldHabit.completions || {},
    notes: oldHabit.notes || undefined,
    order: oldHabit.order,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Rollback migration - restore from backup
 */
export async function rollbackMigration(): Promise<void> {
  const backup = localStorage.getItem('momentum-habits-backup');

  if (!backup) {
    console.log('No backup found to restore.');
    return;
  }

  localStorage.setItem('momentum-habits', backup);
  console.log('✓ Backup restored to momentum-habits');
}

/**
 * Export current habits to JSON file for manual backup
 */
export function exportHabitsToJSON(): void {
  const data = localStorage.getItem('momentum-habits');

  if (!data) {
    console.log('No habits found to export.');
    return;
  }

  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `momentum-habits-backup-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  console.log('✓ Habits exported to JSON file');
}

/**
 * Import habits from JSON file
 */
export function importHabitsFromJSON(jsonString: string): void {
  try {
    const habits = JSON.parse(jsonString);

    if (!Array.isArray(habits)) {
      throw new Error('Invalid format: expected array of habits');
    }

    localStorage.setItem('momentum-habits', jsonString);
    console.log(`✓ Imported ${habits.length} habits`);
  } catch (error) {
    console.error('Import failed:', error);
    throw error;
  }
}

// Make functions available globally for console access
if (typeof window !== 'undefined') {
  (window as any).migrateLocalStorageToFirebase = migrateLocalStorageToFirebase;
  (window as any).rollbackMigration = rollbackMigration;
  (window as any).exportHabitsToJSON = exportHabitsToJSON;
  (window as any).importHabitsFromJSON = importHabitsFromJSON;
}
