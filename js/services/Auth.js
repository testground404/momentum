/**
 * Authentication Module (Modular Firebase SDK v10)
 * Handles user authentication, registration, and session management
 * Supports both Firebase Authentication and localStorage fallback
 */

import { auth, googleProvider, firebaseInitialized } from '../firebase-config.js';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  deleteUser,
  onAuthStateChanged as firebaseOnAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

const USERS_KEY = 'momentum_users';
const SESSION_KEY = 'momentum_session';

// Check if Firebase is initialized
const useFirebase = firebaseInitialized;

console.log('Auth mode:', useFirebase ? 'Firebase' : 'LocalStorage');

// ========== Firebase Auth Methods ==========

/**
 * Register with Firebase
 */
async function registerWithFirebase(email, password) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    console.log('User registered:', userCredential.user.uid);
    return { success: true, user: userCredential.user };
  } catch (error) {
    console.error('Firebase registration error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Login with Firebase
 */
async function loginWithFirebase(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log('User logged in:', userCredential.user.uid);
    return { success: true, user: userCredential.user };
  } catch (error) {
    console.error('Firebase login error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Login with Google
 */
async function loginWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    console.log('Google login successful:', result.user.uid);
    return { success: true, user: result.user };
  } catch (error) {
    console.error('Google login error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Logout from Firebase
 */
async function logoutFromFirebase() {
  try {
    await signOut(auth);
    return true;
  } catch (error) {
    console.error('Firebase logout error:', error);
    return false;
  }
}

/**
 * Delete Firebase account
 */
async function deleteFirebaseAccount() {
  try {
    const user = auth.currentUser;
    if (user) {
      await deleteUser(user);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Firebase account deletion error:', error);
    return false;
  }
}

/**
 * Get current Firebase user
 */
function getCurrentFirebaseUser() {
  return auth.currentUser;
}

/**
 * Check if Firebase user is authenticated
 */
function isFirebaseAuthenticated() {
  return auth.currentUser !== null;
}

// ========== LocalStorage Auth Methods (Fallback) ==========

function getUsers() {
  try {
    const users = localStorage.getItem(USERS_KEY);
    return users ? JSON.parse(users) : {};
  } catch (e) {
    console.error('Error reading users:', e);
    return {};
  }
}

function saveUsers(users) {
  try {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    return true;
  } catch (e) {
    console.error('Error saving users:', e);
    return false;
  }
}

function hashPassword(password) {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(36);
}

function registerWithLocalStorage(username, password) {
  if (!username || !password) {
    return false;
  }

  const users = getUsers();

  if (users[username]) {
    return false;
  }

  users[username] = {
    password: hashPassword(password),
    createdAt: new Date().toISOString()
  };

  if (saveUsers(users)) {
    createSession(username);
    return true;
  }

  return false;
}

function loginWithLocalStorage(username, password) {
  if (!username || !password) {
    return false;
  }

  const users = getUsers();
  const user = users[username];

  if (!user) {
    return false;
  }

  if (user.password === hashPassword(password)) {
    createSession(username);
    return true;
  }

  return false;
}

function createSession(username) {
  const session = {
    username: username,
    loginTime: new Date().toISOString()
  };

  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch (e) {
    console.error('Error creating session:', e);
  }
}

function getSession() {
  try {
    const session = localStorage.getItem(SESSION_KEY);
    return session ? JSON.parse(session) : null;
  } catch (e) {
    console.error('Error reading session:', e);
    return null;
  }
}

function isLocalStorageAuthenticated() {
  const session = getSession();
  return session !== null && session.username !== undefined;
}

function getCurrentLocalUser() {
  const session = getSession();
  return session ? session.username : null;
}

function logoutFromLocalStorage() {
  try {
    localStorage.removeItem(SESSION_KEY);
    return true;
  } catch (e) {
    console.error('Error logging out:', e);
    return false;
  }
}

function deleteLocalAccount(username) {
  const users = getUsers();

  if (!users[username]) {
    return false;
  }

  delete users[username];

  if (saveUsers(users)) {
    logoutFromLocalStorage();
    return true;
  }

  return false;
}

// ========== Public API ==========

/**
 * Register a new user
 * @param {string} emailOrUsername - Email (Firebase) or Username (localStorage)
 * @param {string} password
 * @returns {Promise<boolean>|boolean}
 */
export async function register(emailOrUsername, password) {
  if (useFirebase) {
    const result = await registerWithFirebase(emailOrUsername, password);
    return result.success;
  } else {
    return registerWithLocalStorage(emailOrUsername, password);
  }
}

/**
 * Login user
 * @param {string} emailOrUsername - Email (Firebase) or Username (localStorage)
 * @param {string} password
 * @returns {Promise<boolean>|boolean}
 */
export async function login(emailOrUsername, password) {
  if (useFirebase) {
    const result = await loginWithFirebase(emailOrUsername, password);
    return result.success;
  } else {
    return loginWithLocalStorage(emailOrUsername, password);
  }
}

/**
 * Login with Google (Firebase only)
 * @returns {Promise<object>}
 */
export async function loginGoogle() {
  if (useFirebase) {
    return await loginWithGoogle();
  } else {
    return { success: false, error: 'Firebase not configured' };
  }
}

/**
 * Check if user is authenticated
 * @returns {boolean}
 */
export function isAuthenticated() {
  if (useFirebase) {
    return isFirebaseAuthenticated();
  } else {
    return isLocalStorageAuthenticated();
  }
}

/**
 * Get current user identifier
 * @returns {string|null}
 */
export function getCurrentUser() {
  if (useFirebase) {
    const user = getCurrentFirebaseUser();
    return user ? user.uid : null;
  } else {
    return getCurrentLocalUser();
  }
}

/**
 * Get current user email (Firebase only)
 * @returns {string|null}
 */
export function getCurrentUserEmail() {
  if (useFirebase) {
    const user = getCurrentFirebaseUser();
    return user ? user.email : null;
  } else {
    return getCurrentLocalUser();
  }
}

/**
 * Logout current user
 * @returns {Promise<boolean>|boolean}
 */
export async function logout() {
  if (useFirebase) {
    return await logoutFromFirebase();
  } else {
    return logoutFromLocalStorage();
  }
}

/**
 * Delete user account
 * @param {string} username - Only used for localStorage mode
 * @returns {Promise<boolean>|boolean}
 */
export async function deleteAccount(username) {
  if (useFirebase) {
    return await deleteFirebaseAccount();
  } else {
    return deleteLocalAccount(username);
  }
}

/**
 * Get auth state observer (Firebase only)
 */
export function onAuthStateChanged(callback) {
  if (useFirebase && auth) {
    return firebaseOnAuthStateChanged(auth, callback);
  }
  return null;
}

/**
 * Export useFirebase flag for consumers to check which mode is active
 */
export { useFirebase };
