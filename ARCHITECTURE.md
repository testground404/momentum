# Momentum - Modular Architecture

## Overview

The codebase has been refactored to use ES6 modules for better code organization, maintainability, and reusability.

## Module Structure

```
momentum/
├── js/
│   ├── models/
│   │   └── Habit.js           # Habit data model and business logic
│   ├── services/
│   │   ├── Auth.js            # Authentication service (ES module)
│   │   └── Storage.js         # Data persistence service (ES module)
│   ├── utils/
│   │   ├── ColorUtils.js      # Color manipulation utilities
│   │   ├── DateUtils.js       # Date formatting and parsing
│   │   ├── GeneralUtils.js    # General utility functions
│   │   └── ModalUtils.js      # Modal dialogs (confirm/alert)
│   ├── year-wheel.js          # Year selector component
│   ├── login.js               # Login page logic
│   └── firebase-config.js     # Firebase configuration
├── script.js                  # Main application logic (ES module)
├── app.html                   # Application entry point
└── index.html                 # Login page
```

## Modules

### `js/models/Habit.js`
**Purpose:** Habit data model and business logic

**Exports:**
- `defaultFrequency()` - Default frequency configuration
- `newHabit()` - Create a new habit
- `normalizeHabit()` - Validate and normalize habit data
- `rolloverIfNeeded()` - Handle year transitions
- `applyFrequencyToHabit()` - Apply frequency rules to off-days
- `formatFrequency()` - Format frequency for display
- `calcStats()` - Calculate habit statistics
- `getHabitStats()` - Memoized stats with dirty flag tracking
- `getCompletionRate()` - Calculate completion percentage
- `completionSortValue()` - Get completion rate for sorting

### `js/utils/ColorUtils.js`
**Purpose:** Color manipulation and accessibility

**Exports:**
- `hexToRgb()` - Convert hex to RGB string
- `hexToRgbObj()` - Convert hex to RGB object
- `luminance()` - Calculate color luminance
- `contrast()` - Calculate contrast ratio between colors
- `mix()` - Mix two colors
- `clampColorToMode()` - Ensure color has sufficient contrast

### `js/utils/DateUtils.js`
**Purpose:** Date formatting, parsing, and calculations

**Important:** All date calculations use UTC to avoid timezone-related bugs. This ensures that dates like "January 1st" represent the same calendar day for all users regardless of their timezone.

**Exports:**
- `CURRENTYEAR` - Current year constant
- `isLeap()` - Check if year is leap year
- `daysInYear()` - Get number of days in year
- `startOfYear()` - Get start date of year (UTC)
- `dayIndexForYear()` - Get current day index (UTC calculations)
- `fmt()` - Format date for display
- `toDateInputValue()` - Convert Date to ISO string (UTC)
- `parseDateValue()` - Parse date from string (creates UTC dates)
- `clampDateToYearBounds()` - Clamp date to year boundaries (UTC)
- `sanitizeStartDateValue()` - Validate and sanitize start dates
- `defaultStartDateForYear()` - Get default start date
- `getHabitStartDate()` - Get habit's start date (UTC)
- `getHabitStartIndex()` - Get habit's starting day index (UTC)
- `formatStartDateLabel()` - Format start date label
- Date conversion utilities (toDisplayDateValue, parseDisplayDateValue, etc.)

### `js/utils/GeneralUtils.js`
**Purpose:** General utility functions

**Exports:**
- `debounce()` - Debounce function calls
- `uid()` - Generate unique identifiers

### `js/utils/ModalUtils.js`
**Purpose:** Custom modal dialogs for user confirmation and alerts

**Exports:**
- `showConfirm(title, message)` - Show confirmation dialog, returns Promise<boolean>
- `showAlert(title, message)` - Show alert dialog, returns Promise<void>

### `js/year-wheel.js`
**Purpose:** Year selector UI component

**Exports:**
- `YearWheel` - Year wheel selector class

### Service Modules (ES Modules)

**`js/services/Auth.js`** and **`js/services/Storage.js`** - ES6 modules using Firebase Modular SDK
- Converted from IIFE pattern to ES modules
- Use Firebase SDK v10 modular imports for tree-shaking
- Export individual functions instead of global objects
- Exposed via `window.Auth` and `window.Storage` in script.js for backward compatibility with inline HTML scripts

**`js/login.js`** - Login page module
- Handles authentication UI for the login page
- Imports Auth service functions
- Manages login, signup, and Google authentication flows

## Loading Order

### app.html
1. **script.js** (ES module) - Loads all dependencies via imports:
   - Firebase SDK v10 (modular, from CDN)
   - firebase-config.js
   - Auth.js and Storage.js services
   - All utility modules
   - YearWheel and Habit models
2. Authentication check (inline module script) - Waits for script.js to expose Auth

### index.html
1. **login.js** (ES module) - Imports Auth service and handles login page

## Benefits of Modularization

### 1. **Improved Code Organization**
- Related functionality is grouped into logical modules
- Easier to locate and modify specific features
- Clear separation of concerns

### 2. **Better Maintainability**
- Smaller, focused files are easier to understand
- Changes to one module don't affect others
- Reduced code duplication

### 3. **Enhanced Reusability**
- Utility functions can be imported where needed
- Models can be used across different parts of the app
- Components are self-contained

### 4. **Modern JavaScript**
- Uses ES6 module syntax
- Benefits from tree-shaking (dead code elimination)
- Enables better IDE support and autocomplete

### 5. **Easier Testing**
- Individual modules can be tested in isolation
- Mock dependencies more easily
- Better unit test coverage

## Migration Notes

### What Changed
- `script.js` converted to ES module
- Utility functions extracted to separate modules (ColorUtils, DateUtils, GeneralUtils, ModalUtils)
- Habit logic extracted to dedicated model
- Auth and Storage converted to ES modules in `js/services/`
- Login logic extracted to `js/login.js` module
- YearWheel converted to ES module export
- Removed legacy files: `js/auth.js`, `js/storage.js`, `js/utils.js`
- Reduced script.js from 3430 lines to ~3100 lines

### What Stayed the Same
- Auth and Storage exposed as global objects on window for backward compatibility
- All functionality preserved
- UI and event handling logic unchanged
- Backward compatible with existing data

## Important Implementation Details

### Timezone Handling

**Problem:** JavaScript's `Date` constructor uses local timezone, which causes bugs where:
- Users in different timezones see different "today" dots
- Day-of-week calculations vary by timezone (January 1st could be Sunday in one timezone, Saturday in another)
- Traveling users see data inconsistencies

**Solution:** All date operations use UTC to ensure consistency:
- Internal dates are created with `Date.UTC()` instead of `new Date(year, month, day)`
- Date component extraction uses UTC methods (`getUTCFullYear()`, `getUTCMonth()`, `getUTCDate()`)
- Only display/formatting functions use local timezone for user-friendly output
- This ensures January 1st represents the same calendar day for all users worldwide

**Affected Modules:**
- `DateUtils.js` - All date creation and calculation functions
- `Habit.js` - `applyFrequencyToHabit()` function for day-of-week calculations

### Firebase SDK Upgrade (v9 Compat → v10 Modular)

**Problem:** Using Firebase compat SDK (v9.22.0) which:
- Includes all Firebase features in the bundle (no tree-shaking)
- Results in larger bundle sizes (~300KB+ even if only using auth)
- Uses outdated API patterns
- Prevents optimal code splitting

**Solution:** Migrated to Firebase Modular SDK v10.7.1:
- **Tree-shaking enabled** - Only imports what you use
- **Smaller bundle size** - Can reduce Firebase bundle by 60-80%
- **Modern ES modules** - Better integration with build tools
- **Future-proof** - Compat SDK will be deprecated

**Changes Made:**

1. **firebase-config.js** - Converted to ES module:
   ```javascript
   import { initializeApp } from 'firebase/app';
   import { getAuth, GoogleAuthProvider } from 'firebase/auth';
   import { getFirestore } from 'firebase/firestore';
   ```

2. **Auth.js** - Modular SDK migration:
   - `createUserWithEmailAndPassword(auth, email, password)` instead of `auth.createUserWithEmailAndPassword(email, password)`
   - `signInWithEmailAndPassword(auth, email, password)`
   - `signInWithPopup(auth, provider)`
   - `signOut(auth)`
   - `deleteUser(user)`
   - `onAuthStateChanged(auth, callback)`

3. **Storage.js** - Modular Firestore migration:
   - `collection(db, 'users')` instead of `db.collection('users')`
   - `doc(db, 'users', userId, 'habits', habitId)`
   - `setDoc(docRef, data, { merge: true })`
   - `getDoc(docRef)` / `getDocs(collectionRef)`
   - `writeBatch(db)`

4. **HTML Files** - Removed compat SDK scripts:
   - No more `firebase-app-compat.js`, `firebase-auth-compat.js`, `firebase-firestore-compat.js`
   - Firebase now loaded via ES module imports in JavaScript files
   - CDN imports from `https://www.gstatic.com/firebasejs/10.7.1/`

**Benefits:**
- Reduced bundle size (only loads auth + firestore, not all Firebase services)
- Faster page load times
- Better code splitting with bundlers
- More efficient tree-shaking
- Modern JavaScript patterns

## Future Improvements

### Recommended Next Steps

1. **Remove Tailwind CDN** (High Priority)
   - Generate static CSS with Tailwind CLI
   - Or remove Tailwind entirely and use CSS variables
   - Eliminates runtime CSS generation overhead

2. ~~**Upgrade Firebase SDK**~~ ✅ **COMPLETED**
   - ~~Migrate from compat to modular SDK~~
   - ~~Enable tree-shaking for smaller bundle~~
   - ~~Convert Auth and Storage to ES modules~~

3. **Extract UI Components** (Medium Priority)
   - Create CardRenderer.js for habit card rendering
   - Create IconPicker.js for icon picker UI
   - Create Modal.js for modal management

4. **Add Build Process** (Medium Priority)
   - Bundle modules for production
   - Minification and optimization
   - Source maps for debugging

5. **TypeScript Migration** (Low Priority)
   - Add type safety
   - Better IDE support
   - Catch errors at compile time

## Browser Support

ES6 modules are supported in all modern browsers:
- Chrome 61+
- Firefox 60+
- Safari 11+
- Edge 16+

For older browser support, consider adding a build step with Babel.
