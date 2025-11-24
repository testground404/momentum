/**
 * Storage Module (Modular Firebase SDK v10)
 * Handles all data storage operations
 * Supports both Firestore (Firebase) and localStorage
 */

import { db, firebaseInitialized } from '../firebase-config.js';
import { getCurrentUser, getCurrentUserEmail } from './Auth.js';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  writeBatch,
  query
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

const STORAGE_PREFIX = 'momentum_';

// Check if Firebase is available
const useFirebase = firebaseInitialized;

// ========== Firestore Methods ==========

// Cache for delta-based updates
let lastSavedHabits = new Map(); // habitId -> habit data (as JSON string)

/**
 * Save habits to Firestore (with delta-based updates)
 */
async function saveHabitsToFirestore(habits) {
  try {
    const userId = getCurrentUser();
    if (!userId) {
      return false;
    }

    const habitsRef = collection(db, 'users', userId, 'habits');
    const batch = writeBatch(db);

    // Create maps for quick lookup
    const currentHabitsMap = new Map();
    habits.forEach(habit => {
      currentHabitsMap.set(habit.id, JSON.stringify(habit));
    });

    let operationCount = 0;

    // Find habits to update or add
    habits.forEach(habit => {
      const habitId = habit.id || generateId();
      const currentJSON = JSON.stringify(habit);
      const previousJSON = lastSavedHabits.get(habitId);

      // Only update if habit is new or changed
      if (previousJSON !== currentJSON) {
        const docRef = doc(habitsRef, habitId);
        batch.set(docRef, habit, { merge: true });
        operationCount++;
      }
    });

    // Find habits to delete (exist in cache but not in current)
    lastSavedHabits.forEach((habitJSON, habitId) => {
      if (!currentHabitsMap.has(habitId)) {
        batch.delete(doc(habitsRef, habitId));
        operationCount++;
      }
    });

    // Only commit if there are changes
    if (operationCount > 0) {
      await batch.commit();

      // Update cache
      lastSavedHabits = currentHabitsMap;

      // Also save to IndexedDB cache
      saveToIndexedDB(userId, habits);
    }

    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Load habits from Firestore (with IndexedDB cache)
 */
async function loadHabitsFromFirestore() {
  try {
    const userId = getCurrentUser();
    if (!userId) {
      return [];
    }

    // Try loading from IndexedDB cache first for instant load
    const cachedHabits = await loadFromIndexedDB(userId);
    if (cachedHabits && cachedHabits.length > 0) {
      // Populate delta cache
      lastSavedHabits.clear();
      cachedHabits.forEach(habit => {
        lastSavedHabits.set(habit.id, JSON.stringify(habit));
      });

      // Load from Firebase in background to check for updates
      loadFromFirestoreInBackground(userId, cachedHabits);

      return cachedHabits;
    }

    // No cache, load from Firestore
    const habitsRef = collection(db, 'users', userId, 'habits');
    const snapshot = await getDocs(habitsRef);

    const habits = [];
    lastSavedHabits.clear(); // Reset cache

    snapshot.forEach(docSnapshot => {
      const habit = { id: docSnapshot.id, ...docSnapshot.data() };
      habits.push(habit);
      // Populate cache on load
      lastSavedHabits.set(habit.id, JSON.stringify(habit));
    });

    // Cache to IndexedDB for next time
    if (habits.length > 0) {
      saveToIndexedDB(userId, habits);
    }

    return habits;
  } catch (error) {
    // Fallback to IndexedDB if Firebase fails
    const userId = getCurrentUser();
    if (userId) {
      const cachedHabits = await loadFromIndexedDB(userId);
      if (cachedHabits) {
        return cachedHabits;
      }
    }

    return [];
  }
}

/**
 * Background sync to check for updates from Firestore
 */
async function loadFromFirestoreInBackground(userId, cachedHabits) {
  try {
    const habitsRef = collection(db, 'users', userId, 'habits');
    const snapshot = await getDocs(habitsRef);

    const habits = [];
    snapshot.forEach(docSnapshot => {
      habits.push({ id: docSnapshot.id, ...docSnapshot.data() });
    });

    // Check if there are differences
    const cachedJSON = JSON.stringify(cachedHabits);
    const firestoreJSON = JSON.stringify(habits);

    if (cachedJSON !== firestoreJSON) {
      saveToIndexedDB(userId, habits);
      // Note: In a real app, you'd want to notify the UI to refresh
    }
  } catch (error) {
  }
}

/**
 * Save settings to Firestore
 */
async function saveSettingsToFirestore(settings) {
  try {
    const userId = getCurrentUser();
    if (!userId) {
      return false;
    }

    const settingsDocRef = doc(db, 'users', userId, 'settings', 'preferences');
    await setDoc(settingsDocRef, settings);

    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Load settings from Firestore
 */
async function loadSettingsFromFirestore() {
  try {
    const userId = getCurrentUser();
    if (!userId) {
      return getDefaultSettings();
    }

    const settingsDocRef = doc(db, 'users', userId, 'settings', 'preferences');
    const settingsDoc = await getDoc(settingsDocRef);

    if (settingsDoc.exists()) {
      return settingsDoc.data();
    }

    return getDefaultSettings();
  } catch (error) {
    return getDefaultSettings();
  }
}

/**
 * Clear all user data from Firestore
 */
async function clearUserDataFromFirestore() {
  try {
    const userId = getCurrentUser();
    if (!userId) {
      return false;
    }

    const userRef = doc(db, 'users', userId);
    const batch = writeBatch(db);

    // Delete habits
    const habitsRef = collection(db, 'users', userId, 'habits');
    const habitsSnapshot = await getDocs(habitsRef);
    habitsSnapshot.docs.forEach(docSnapshot => {
      batch.delete(docSnapshot.ref);
    });

    // Delete settings
    const settingsRef = collection(db, 'users', userId, 'settings');
    const settingsSnapshot = await getDocs(settingsRef);
    settingsSnapshot.docs.forEach(docSnapshot => {
      batch.delete(docSnapshot.ref);
    });

    await batch.commit();

    // Also clear IndexedDB cache
    await clearIndexedDBCache(userId);
    clearDayBasedCache();

    return true;
  } catch (error) {
    return false;
  }
}

// ========== IndexedDB Cache Layer ==========

const DB_NAME = 'MomentumHabitsDB';
const DB_VERSION = 1;
const STORE_NAME = 'habits_cache';
let idb = null;

/**
 * Initialize IndexedDB
 */
async function initIndexedDB() {
  if (idb) return idb;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      resolve(null);
    };

    request.onsuccess = () => {
      idb = request.result;
      resolve(idb);
    };

    request.onupgradeneeded = (event) => {
      const database = event.target.result;

      if (!database.objectStoreNames.contains(STORE_NAME)) {
        const objectStore = database.createObjectStore(STORE_NAME, { keyPath: 'userId' });
        objectStore.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  });
}

/**
 * Save habits to IndexedDB cache
 */
async function saveToIndexedDB(userId, habits) {
  try {
    const database = await initIndexedDB();
    if (!database) return false;

    return new Promise((resolve, reject) => {
      const transaction = database.transaction([STORE_NAME], 'readwrite');
      const objectStore = transaction.objectStore(STORE_NAME);

      const cacheEntry = {
        userId: userId,
        habits: habits,
        timestamp: new Date().toISOString()
      };

      const request = objectStore.put(cacheEntry);

      request.onsuccess = () => {
        resolve(true);
      };

      request.onerror = () => {
        resolve(false);
      };
    });
  } catch (error) {
    return false;
  }
}

/**
 * Load habits from IndexedDB cache
 */
async function loadFromIndexedDB(userId) {
  try {
    const database = await initIndexedDB();
    if (!database) return null;

    return new Promise((resolve, reject) => {
      const transaction = database.transaction([STORE_NAME], 'readonly');
      const objectStore = transaction.objectStore(STORE_NAME);
      const request = objectStore.get(userId);

      request.onsuccess = () => {
        const result = request.result;
        if (result && result.habits) {
          resolve(result.habits);
        } else {
          resolve(null);
        }
      };

      request.onerror = () => {
        resolve(null);
      };
    });
  } catch (error) {
    return null;
  }
}

/**
 * Clear IndexedDB cache
 */
async function clearIndexedDBCache(userId = null) {
  try {
    const database = await initIndexedDB();
    if (!database) return false;

    return new Promise((resolve) => {
      const transaction = database.transaction([STORE_NAME], 'readwrite');
      const objectStore = transaction.objectStore(STORE_NAME);

      let request;
      if (userId) {
        request = objectStore.delete(userId);
      } else {
        request = objectStore.clear();
      }

      request.onsuccess = () => {
        resolve(true);
      };

      request.onerror = () => {
        resolve(false);
      };
    });
  } catch (error) {
    return false;
  }
}

// ========== Day-based Caching ==========

/**
 * Cache for habit data with daily invalidation
 * Structure: { habitId: { date: 'YYYY-MM-DD', data: {...} } }
 */
const dayBasedCache = new Map();

/**
 * Get today's date string
 */
function getTodayDateString() {
  const now = new Date();
  return now.getFullYear() + '-' +
         String(now.getMonth() + 1).padStart(2, '0') + '-' +
         String(now.getDate()).padStart(2, '0');
}

/**
 * Get cached habit data for today
 */
function getCachedHabitData(habitId) {
  const cached = dayBasedCache.get(habitId);
  const today = getTodayDateString();

  if (cached && cached.date === today) {
    return cached.data;
  }

  return null;
}

/**
 * Cache habit data for today
 */
function setCachedHabitData(habitId, data) {
  dayBasedCache.set(habitId, {
    date: getTodayDateString(),
    data: data
  });
}

/**
 * Clear cache for specific habit or all habits
 */
function clearDayBasedCache(habitId = null) {
  if (habitId) {
    dayBasedCache.delete(habitId);
  } else {
    dayBasedCache.clear();
  }
}

// ========== LocalStorage Methods (Fallback) ==========

/**
 * Get user-specific storage key
 */
function getUserKey(key) {
  const username = getCurrentUser();
  if (!username) {
    return null;
  }
  return STORAGE_PREFIX + username + '_' + key;
}

/**
 * Save data to localStorage
 */
function saveToLocalStorage(key, data) {
  const storageKey = getUserKey(key);
  if (!storageKey) return false;

  try {
    const jsonData = JSON.stringify(data);
    localStorage.setItem(storageKey, jsonData);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Load data from localStorage
 */
function loadFromLocalStorage(key, defaultValue = null) {
  const storageKey = getUserKey(key);
  if (!storageKey) return defaultValue;

  try {
    const data = localStorage.getItem(storageKey);
    return data ? JSON.parse(data) : defaultValue;
  } catch (e) {
    return defaultValue;
  }
}

/**
 * Remove data from localStorage
 */
function removeFromLocalStorage(key) {
  const storageKey = getUserKey(key);
  if (!storageKey) return false;

  try {
    localStorage.removeItem(storageKey);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Clear all user data from localStorage
 */
function clearUserDataFromLocalStorage() {
  const username = getCurrentUser();
  if (!username) return false;

  const prefix = STORAGE_PREFIX + username + '_';

  try {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(prefix)) {
        localStorage.removeItem(key);
      }
    });
    return true;
  } catch (e) {
    return false;
  }
}

// ========== Helper Functions ==========

function getDefaultSettings() {
  return {
    theme: 'light',
    view: 'year',
    sortOrder: 'created-newest'
  };
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// ========== Public API ==========

/**
 * Save habits
 */
export async function saveHabits(habits) {
  if (useFirebase) {
    return await saveHabitsToFirestore(habits);
  } else {
    return saveToLocalStorage('habits', habits);
  }
}

/**
 * Load habits
 */
export async function loadHabits() {
  if (useFirebase) {
    return await loadHabitsFromFirestore();
  } else {
    return loadFromLocalStorage('habits', []);
  }
}

/**
 * Save app settings
 */
export async function saveSettings(settings) {
  if (useFirebase) {
    return await saveSettingsToFirestore(settings);
  } else {
    return saveToLocalStorage('settings', settings);
  }
}

/**
 * Load app settings
 */
export async function loadSettings() {
  if (useFirebase) {
    return await loadSettingsFromFirestore();
  } else {
    return loadFromLocalStorage('settings', getDefaultSettings());
  }
}

/**
 * Clear all user data
 */
export async function clearUserData() {
  if (useFirebase) {
    return await clearUserDataFromFirestore();
  } else {
    return clearUserDataFromLocalStorage();
  }
}

/**
 * Export user data
 */
export async function exportData() {
  const username = getCurrentUserEmail() || getCurrentUser();
  if (!username) return null;

  const data = {
    exportDate: new Date().toISOString(),
    username: username,
    habits: await loadHabits(),
    settings: await loadSettings()
  };

  return data;
}

/**
 * Import user data
 */
export async function importData(data) {
  if (!data || !data.habits) return false;

  try {
    await saveHabits(data.habits);
    if (data.settings) {
      await saveSettings(data.settings);
    }
    return true;
  } catch (e) {
    return false;
  }
}

// Legacy methods for backward compatibility
/**
 * Save to localStorage (legacy)
 */
export function save(key, data) {
  return saveToLocalStorage(key, data);
}

/**
 * Load from localStorage (legacy)
 */
export function load(key, defaultValue = null) {
  return loadFromLocalStorage(key, defaultValue);
}

/**
 * Remove from localStorage (legacy)
 */
export function remove(key) {
  return removeFromLocalStorage(key);
}

// Day-based caching exports
export { getCachedHabitData, setCachedHabitData, clearDayBasedCache };

// Export flag for consumers to check which mode is active
export { useFirebase };
