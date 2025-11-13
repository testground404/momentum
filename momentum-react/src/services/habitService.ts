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
} from 'firebase/firestore';
import { db } from './firebase';
import { Habit, HabitFormData } from '../types';

const HABITS_COLLECTION = 'habits';

/**
 * Fetch all habits for a user
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
      habits.push({
        id: doc.id,
        ...doc.data(),
      } as Habit);
    });

    return habits;
  } catch (error) {
    console.error('Error fetching habits:', error);
    throw error;
  }
};

/**
 * Create a new habit
 */
export const createHabit = async (
  userId: string,
  habitData: HabitFormData
): Promise<Habit> => {
  try {
    const newHabit = {
      ...habitData,
      userId,
      archived: false,
      completions: [],
      order: Date.now(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, HABITS_COLLECTION), newHabit);

    return {
      id: docRef.id,
      ...newHabit,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Habit;
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
  updates: Partial<Habit>
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
 * Toggle habit completion for a specific date
 */
export const toggleHabitCompletion = async (
  habitId: string,
  date: string,
  currentCompletions: { date: string; timestamp: Date }[]
): Promise<void> => {
  try {
    const habitRef = doc(db, HABITS_COLLECTION, habitId);

    const isCompleted = currentCompletions.some((c) => c.date === date);
    let newCompletions;

    if (isCompleted) {
      // Remove completion
      newCompletions = currentCompletions.filter((c) => c.date !== date);
    } else {
      // Add completion
      newCompletions = [
        ...currentCompletions,
        { date, timestamp: new Date() },
      ];
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
