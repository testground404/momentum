# Momentum - Modular Architecture

## Overview

The codebase has been refactored to use ES6 modules for better code organization, maintainability, and reusability.

## Module Structure

```
momentum/
├── js/
│   ├── models/
│   │   └── Habit.js           # Habit data model and business logic
│   ├── utils/
│   │   ├── ColorUtils.js      # Color manipulation utilities
│   │   ├── DateUtils.js       # Date formatting and parsing
│   │   └── GeneralUtils.js    # General utility functions
│   ├── year-wheel.js          # Year selector component
│   ├── auth.js                # Authentication (IIFE - global module)
│   ├── storage.js             # Data persistence (IIFE - global module)
│   ├── utils.js               # Legacy utilities (IIFE - global module)
│   └── firebase-config.js     # Firebase configuration
├── script.js                  # Main application logic (ES module)
└── app.html                   # Application entry point
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

**Exports:**
- `CURRENTYEAR` - Current year constant
- `isLeap()` - Check if year is leap year
- `daysInYear()` - Get number of days in year
- `startOfYear()` - Get start date of year
- `dayIndexForYear()` - Get current day index
- `fmt()` - Format date for display
- `toDateInputValue()` - Convert Date to ISO string
- `parseDateValue()` - Parse date from string
- `clampDateToYearBounds()` - Clamp date to year boundaries
- `sanitizeStartDateValue()` - Validate and sanitize start dates
- `defaultStartDateForYear()` - Get default start date
- `getHabitStartDate()` - Get habit's start date
- `getHabitStartIndex()` - Get habit's starting day index
- `formatStartDateLabel()` - Format start date label
- Date conversion utilities (toDisplayDateValue, parseDisplayDateValue, etc.)

### `js/utils/GeneralUtils.js`
**Purpose:** General utility functions

**Exports:**
- `debounce()` - Debounce function calls
- `uid()` - Generate unique identifiers

### `js/year-wheel.js`
**Purpose:** Year selector UI component

**Exports:**
- `YearWheel` - Year wheel selector class

### Global Modules (IIFE Pattern)

The following modules use the IIFE (Immediately Invoked Function Expression) pattern and are loaded as global objects. They remain as traditional scripts due to Firebase dependencies:

- **`js/auth.js`** - Authentication module (global `Auth` object)
- **`js/storage.js`** - Storage module (global `Storage` object)
- **`js/utils.js`** - Legacy utilities (global utilities)

## Loading Order

The modules are loaded in the following order in `app.html`:

1. Firebase SDK (compat mode)
2. Firebase configuration
3. Global modules (auth.js, utils.js, storage.js)
4. Authentication check (inline script)
5. Main application (script.js as ES module)

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
- Utility functions extracted to separate modules
- Habit logic extracted to dedicated model
- YearWheel converted to ES module export
- Reduced script.js from 3430 lines to ~3100 lines

### What Stayed the Same
- Auth and Storage remain as global IIFE modules (Firebase compatibility)
- All functionality preserved
- UI and event handling logic unchanged
- Backward compatible with existing data

## Future Improvements

### Recommended Next Steps

1. **Remove Tailwind CDN** (High Priority)
   - Generate static CSS with Tailwind CLI
   - Or remove Tailwind entirely and use CSS variables
   - Eliminates runtime CSS generation overhead

2. **Upgrade Firebase SDK** (High Priority)
   - Migrate from compat to modular SDK
   - Enable tree-shaking for smaller bundle
   - Convert Auth and Storage to ES modules

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
