import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  orderBy,
  onSnapshot,
  Timestamp,
} from 'firebase/firestore';
import type { Unsubscribe } from 'firebase/firestore';
import { db } from './firebase';
import type { Habit, FirebaseHabit } from '../types';

const HABITS_COLLECTION = 'habits';

/**
 * Convert Firestore habit data to app Habit type
 */
const convertFirebaseHabit = (id: string, data: any): Habit => {
  return {
    id,
    name: data.name,
    description: data.description,
    icon: data.icon,
    color: data.color,
    year: data.year,
    startDate: data.startDate,
    createdAt:
      data.createdAt instanceof Timestamp
        ? data.createdAt.toDate().toISOString()
        : data.createdAt,
    updatedAt:
      data.updatedAt instanceof Timestamp
        ? data.updatedAt.toDate().toISOString()
        : data.updatedAt,
    archived: data.archived || false,
    userId: data.userId,
    completions: data.completions || {},
    notes: data.notes,
    order: data.order,
  };
};

/**
 * Fetch all habits for a user (one-time fetch)
 */
export const fetchUserHabits = async (userId: string): Promise<Habit[]> => {
  try {
    const habitsRef = collection(db, HABITS_COLLECTION);
    const q = query(
      habitsRef,
      where('userId', '==', userId),
      orderBy('order', 'asc')
    );

    const querySnapshot = await getDocs(q);
    const habits: Habit[] = [];

    querySnapshot.forEach((doc) => {
      habits.push(convertFirebaseHabit(doc.id, doc.data()));
    });

    return habits;
  } catch (error) {
    console.error('Error fetching habits:', error);
    throw error;
  }
};

/**
 * Subscribe to real-time updates for user habits
 */
export const subscribeToUserHabits = (
  userId: string,
  callback: (habits: Habit[]) => void
): Unsubscribe => {
  const habitsRef = collection(db, HABITS_COLLECTION);
  const q = query(
    habitsRef,
    where('userId', '==', userId),
    orderBy('order', 'asc')
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const habits: Habit[] = [];
      snapshot.forEach((doc) => {
        habits.push(convertFirebaseHabit(doc.id, doc.data()));
      });
      callback(habits);
    },
    (error) => {
      console.error('Error subscribing to habits:', error);
    }
  );
};

/**
 * Create a new habit
 */
export const createHabit = async (habitData: Omit<Habit, 'id'>): Promise<string> => {
  try {
    const newHabit: FirebaseHabit = {
      name: habitData.name,
      description: habitData.description,
      icon: habitData.icon,
      color: habitData.color,
      year: habitData.year,
      startDate: habitData.startDate,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      archived: habitData.archived || false,
      userId: habitData.userId,
      completions: habitData.completions || {},
      notes: habitData.notes,
      order: habitData.order || Date.now(),
    };

    const docRef = await addDoc(collection(db, HABITS_COLLECTION), newHabit);
    return docRef.id;
  } catch (error) {
    console.error('Error creating habit:', error);
    throw error;
  }
};

/**
 * Update an existing habit
 */
export const updateHabit = async (
  habitId: string,
  updates: Partial<Omit<Habit, 'id'>>
): Promise<void> => {
  try {
    const habitRef = doc(db, HABITS_COLLECTION, habitId);
    await updateDoc(habitRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating habit:', error);
    throw error;
  }
};

/**
 * Delete a habit
 */
export const deleteHabit = async (habitId: string): Promise<void> => {
  try {
    const habitRef = doc(db, HABITS_COLLECTION, habitId);
    await deleteDoc(habitRef);
  } catch (error) {
    console.error('Error deleting habit:', error);
    throw error;
  }
};

/**
 * Archive a habit
 */
export const archiveHabit = async (habitId: string): Promise<void> => {
  try {
    const habitRef = doc(db, HABITS_COLLECTION, habitId);
    await updateDoc(habitRef, {
      archived: true,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error archiving habit:', error);
    throw error;
  }
};

/**
 * Unarchive a habit
 */
export const unarchiveHabit = async (habitId: string): Promise<void> => {
  try {
    const habitRef = doc(db, HABITS_COLLECTION, habitId);
    await updateDoc(habitRef, {
      archived: false,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error unarchiving habit:', error);
    throw error;
  }
};

/**
 * Toggle habit completion for a specific day
 */
export const toggleHabitCompletion = async (
  habitId: string,
  dayIndex: number,
  currentCompletions: { [dayIndex: string]: boolean }
): Promise<void> => {
  try {
    const habitRef = doc(db, HABITS_COLLECTION, habitId);
    const key = dayIndex.toString();
    const newCompletions = { ...currentCompletions };

    if (newCompletions[key]) {
      delete newCompletions[key];
    } else {
      newCompletions[key] = true;
    }

    await updateDoc(habitRef, {
      completions: newCompletions,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error toggling habit completion:', error);
    throw error;
  }
};

/**
 * Update habit note for a specific day
 */
export const updateHabitNote = async (
  habitId: string,
  dayIndex: number,
  note: string,
  currentNotes: { [dayIndex: string]: string } = {}
): Promise<void> => {
  try {
    const habitRef = doc(db, HABITS_COLLECTION, habitId);
    const key = dayIndex.toString();
    const newNotes = { ...currentNotes };

    if (note.trim() === '') {
      delete newNotes[key];
    } else {
      newNotes[key] = note;
    }

    await updateDoc(habitRef, {
      notes: Object.keys(newNotes).length > 0 ? newNotes : null,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating habit note:', error);
    throw error;
  }
};

/**
 * Batch update habit order (for drag-and-drop reordering)
 */
export const updateHabitOrder = async (habitId: string, order: number): Promise<void> => {
  try {
    const habitRef = doc(db, HABITS_COLLECTION, habitId);
    await updateDoc(habitRef, {
      order,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating habit order:', error);
    throw error;
  }
};

export const habitService = {
  fetchUserHabits,
  subscribeToUserHabits,
  createHabit,
  updateHabit,
  deleteHabit,
  archiveHabit,
  unarchiveHabit,
  toggleHabitCompletion,
  updateHabitNote,
  updateHabitOrder,
};

export default habitService;
