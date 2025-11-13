# Firebase Setup Guide

This guide will help you integrate Firebase Authentication and Firestore with your Momentum Habit Tracker application.

## Prerequisites

- A Google account
- Basic understanding of web development
- Your Momentum app files

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"** or **"Create a project"**
3. Enter a project name (e.g., "momentum-habit-tracker")
4. (Optional) Enable Google Analytics
5. Click **"Create project"**
6. Wait for the project to be created

## Step 2: Register Your Web App

1. In your Firebase project, click the **Web icon** (`</>`) to add a web app
2. Register your app:
   - App nickname: `Momentum Habit Tracker`
   - (Optional) Check "Also set up Firebase Hosting"
3. Click **"Register app"**
4. **Copy the Firebase configuration** - you'll need this!

Your config will look like this:
```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

## Step 3: Configure Your App

1. Open `js/firebase-config.js` in your code editor
2. Replace the placeholder config with your actual Firebase config:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_ACTUAL_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

3. Save the file

## Step 4: Enable Authentication

### Enable Email/Password Authentication

1. In Firebase Console, go to **Build** → **Authentication**
2. Click **"Get started"**
3. Click on **"Sign-in method"** tab
4. Click on **"Email/Password"**
5. Toggle **"Enable"**
6. Click **"Save"**

### Enable Google Authentication (Optional but Recommended)

1. In the same **"Sign-in method"** tab
2. Click on **"Google"**
3. Toggle **"Enable"**
4. Select a **Project support email** from the dropdown
5. Click **"Save"**

## Step 5: Set Up Firestore Database

1. In Firebase Console, go to **Build** → **Firestore Database**
2. Click **"Create database"**
3. Choose **"Start in production mode"** (we'll add security rules next)
4. Select a location (choose one closest to your users)
5. Click **"Enable"**

## Step 6: Configure Firestore Security Rules

**CRITICAL: Without proper security rules, your database is vulnerable!**

### Option A: Deploy via Firebase CLI (Recommended)

1. Install Firebase CLI:
```bash
npm install -g firebase-tools
```

2. Login to Firebase:
```bash
firebase login
```

3. Initialize Firebase in your project:
```bash
firebase init firestore
```
   - Select your Firebase project
   - Accept the default `firestore.rules` file
   - Accept the default `firestore.indexes.json` file

4. Deploy the security rules:
```bash
firebase deploy --only firestore:rules
```

### Option B: Manual Setup via Console

1. In Firestore Database, go to the **"Rules"** tab
2. Copy the contents from `firestore.rules` in your project
3. Paste into the Firebase Console rules editor
4. Click **"Publish"**

The security rules ensure:
- ✅ Users can only access their own data
- ✅ Authentication is required for all operations
- ✅ User data is completely isolated
- ✅ Unauthorized access is blocked

## Step 7: Firestore Indexes

**Good news:** Our app uses simple queries that don't require custom indexes!

Firestore automatically creates single-field indexes for all fields. The queries we use are:
- Getting all habits for a user
- Getting specific settings documents
- Batch operations

These don't require composite indexes. The `firestore.indexes.json` file is included for completeness but contains no custom indexes.

If you see index warnings in the console, Firebase will provide a direct link to create the needed index automatically.

## Step 8: Test Your Integration

1. Open your `index.html` in a web browser
2. Open the browser console (F12)
3. You should see: `"Auth mode: Firebase"` and `"Storage mode: Firestore"`
4. Try creating a new account:
   - Enter an email address
   - Enter a password (min 6 characters)
   - Confirm password
   - Click **"Sign Up"**
5. If successful, you should be redirected to `app.html`

## Step 9: Verify in Firebase Console

### Check Authentication

1. Go to **Authentication** → **Users** tab
2. You should see your newly created user

### Check Firestore

1. Go to **Firestore Database** → **Data** tab
2. Create a habit in your app
3. You should see a `users` collection with your user ID
4. Inside, you'll see `habits` and `settings` subcollections

## Features Enabled

With Firebase integration, you now have:

✅ **Secure Authentication**
- Email/password login
- Google OAuth login (one-click sign-in)
- Password reset functionality (can be added)

✅ **Cloud Data Storage**
- Habits synced across devices
- Automatic backup
- Real-time updates (can be added)

✅ **User Data Isolation**
- Each user's data is completely separate
- Security rules prevent unauthorized access
- Scalable to millions of users

✅ **Fallback Support**
- If Firebase is not configured, app falls back to localStorage
- No breaking changes for existing users

## Troubleshooting

### "Firebase SDK not loaded" Error

- Make sure you have internet connection
- Check that Firebase CDN links are accessible
- Verify all three Firebase scripts are loaded in HTML

### "Auth mode: LocalStorage" in Console

- Your Firebase config might not be set up correctly
- Check `js/firebase-config.js` for correct credentials
- Ensure apiKey, projectId, etc. are not placeholder values

### "Permission denied" Errors in Firestore

- Check your Firestore security rules
- Make sure the user is authenticated
- Verify the user is only accessing their own data

### Google Login Button Doesn't Work

- Make sure Google sign-in method is enabled in Firebase Console
- Check that you've selected a support email
- Try in an incognito window (to rule out browser extensions)

## Optional Enhancements

### Add Password Reset

Add this to your login page:

```javascript
async function resetPassword(email) {
  try {
    await firebase.auth().sendPasswordResetEmail(email);
    alert('Password reset email sent!');
  } catch (error) {
    alert(error.message);
  }
}
```

### Add Email Verification

```javascript
async function sendVerificationEmail() {
  const user = firebase.auth().currentUser;
  await user.sendEmailVerification();
}
```

### Enable Offline Support

Firestore supports offline data persistence:

```javascript
firebase.firestore().enablePersistence()
  .catch((err) => {
    console.log('Persistence error:', err);
  });
```

## Cost Considerations

Firebase has a generous free tier:

**Free Tier Includes:**
- 50,000 document reads/day
- 20,000 document writes/day
- 20,000 document deletes/day
- 1GB storage
- 10GB/month network egress

For personal use or small applications, you'll likely stay within the free tier.

## Security Best Practices

1. **Never commit `firebase-config.js` with real credentials to public repos**
2. **Use environment variables** for sensitive config in production
3. **Enable App Check** for additional security (in Firebase Console)
4. **Monitor usage** in Firebase Console to detect unusual activity
5. **Keep security rules strict** - only allow authenticated users to access their own data

## Support

If you encounter issues:

1. Check the [Firebase Documentation](https://firebase.google.com/docs)
2. Visit [Stack Overflow](https://stackoverflow.com/questions/tagged/firebase)
3. Check the browser console for error messages
4. Review Firebase Console for authentication and database errors

## Local Testing Without Firebase

The app works perfectly without Firebase using localStorage:

1. Don't configure `firebase-config.js` (leave placeholders)
2. The app will automatically use localStorage
3. All features work the same, just stored locally

This is perfect for development and testing!

---

**That's it!** Your Momentum Habit Tracker now has secure cloud-based authentication and storage. 🎉
