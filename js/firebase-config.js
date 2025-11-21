/**
 * Firebase Configuration (Modular SDK v9+)
 *
 * To set up Firebase:
 * 1. Go to https://console.firebase.google.com/
 * 2. Create a new project (or select existing)
 * 3. Click "Add app" and select "Web"
 * 4. Copy your Firebase config and paste below
 * 5. Enable Authentication:
 *    - Go to Authentication > Sign-in method
 *    - Enable Email/Password
 *    - Enable Google (optional)
 * 6. Enable Firestore:
 *    - Go to Firestore Database
 *    - Click "Create database"
 *    - Start in production mode
 *    - Set up security rules (see below)
 */

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAuth, GoogleAuthProvider } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDtvqvDxljK2uNS2UfIkjCQusT2uuIvkEQ",
  authDomain: "momentum-cce49.firebaseapp.com",
  projectId: "momentum-cce49",
  storageBucket: "momentum-cce49.firebasestorage.app",
  messagingSenderId: "1027051183429",
  appId: "1:1027051183429:web:9b8a3fc2edacdb2fd8322c",
  measurementId: "G-MQT1GP9G9Q"
};

// Initialize Firebase
let app, auth, db, googleProvider;
let firebaseInitialized = false;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  googleProvider = new GoogleAuthProvider();
  firebaseInitialized = true;
  console.log('Firebase initialized successfully (Modular SDK)');
} catch (error) {
  console.error('Error initializing Firebase:', error);
  console.log('Falling back to localStorage mode');
}

// Export Firebase instances
export { app, auth, db, googleProvider, firebaseInitialized };

/**
 * Firestore Security Rules
 *
 * Copy these rules to Firestore Database > Rules in Firebase Console:
 *
 * rules_version = '2';
 * service cloud.firestore {
 *   match /databases/{database}/documents {
 *     // Users can only read/write their own data
 *     match /users/{userId}/habits/{habitId} {
 *       allow read, write: if request.auth != null && request.auth.uid == userId;
 *     }
 *
 *     match /users/{userId}/settings/{document=**} {
 *       allow read, write: if request.auth != null && request.auth.uid == userId;
 *     }
 *   }
 * }
 */
