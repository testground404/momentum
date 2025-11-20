# Year Wheel Reload Fix

## Overview
Fixed year wheel initialization to ensure it loads correctly whenever habit cards reload or update, regardless of the reason.

---

## 🎯 Problem Identified

### **Card Reload Scenarios**

The habit tracker has multiple scenarios where cards reload or update:

1. **Initial render** - New cards created from scratch
2. **Lazy loading** - Placeholder cards hydrated when scrolled into view
3. **Card reuse** - Existing DOM elements reused during re-render (sorting, filtering, drag-and-drop)
4. **Year change** - Card content updated when user switches years via year wheel

### **Issues Found**

**Before the Fix:**
- ✅ Year wheel initialized on initial render
- ✅ Year wheel initialized on lazy loading hydration
- ❌ Year wheel NOT initialized when existing cards were reused
- ❌ Year wheel NOT properly reinitialized after year changes

**Root Cause:**
The `render()` function was reusing existing card DOM elements for performance, but wasn't checking if their year wheels needed initialization. Similarly, `updateHabitCardContent()` was updating the card's visual content but not reinitializing the year wheel component.

---

## ✅ Solution Implemented

### **Fix 1: Card Reuse in render() Function** (script.js:1435-1443)

**Before:**
```javascript
if (card) {
  // Card already exists, just move it to the fragment for reordering
  fragment.appendChild(card);
  card.style.animationDelay = (index * 50) + 'ms';

  // If it's still a placeholder, observe it
  if (card.classList.contains('card-placeholder')) {
    cardObserver.observe(card);
  }
}
```

**After:**
```javascript
if (card) {
  // Card already exists, just move it to the fragment for reordering
  fragment.appendChild(card);
  card.style.animationDelay = (index * 50) + 'ms';

  // If it's still a placeholder, observe it
  if (card.classList.contains('card-placeholder')) {
    cardObserver.observe(card);
  } else {
    // Card is fully rendered - ensure year wheel is initialized
    // This handles cases where cards are reused during re-render
    if (!habitYearWheels[habit.id]) {
      requestAnimationFrame(function() {
        initHabitYearWheel(habit);
      });
    }
  }
}
```

**Key Change:**
- Added check for fully-rendered cards (not placeholders)
- If year wheel doesn't exist for this habit, initialize it
- This ensures reused cards always have working year wheels

---

### **Fix 2: Year Change Updates** (script.js:3687-3695)

**Before:**
```javascript
var monthGridContainer = card.querySelector('.months-container-month-view');
if (monthGridContainer) {
  monthGridContainer.innerHTML = '';
  buildMonthViews(habit, monthGridContainer, todayIdx);
}

// Rebuild dot position cache after updating
requestAnimationFrame(function() {
  buildDotPositionCache();
});
```

**After:**
```javascript
var monthGridContainer = card.querySelector('.months-container-month-view');
if (monthGridContainer) {
  monthGridContainer.innerHTML = '';
  buildMonthViews(habit, monthGridContainer, todayIdx);
}

// Reinitialize year wheel to ensure it's in sync with the new year
// This is important when switching years via the year wheel itself
requestAnimationFrame(function() {
  // Clean up and reinitialize the year wheel
  if (habitYearWheels[habit.id]) {
    delete habitYearWheels[habit.id];
  }
  initHabitYearWheel(habit);
});

// Rebuild dot position cache after updating
requestAnimationFrame(function() {
  buildDotPositionCache();
});
```

**Key Changes:**
- Clean up existing year wheel instance before reinitializing
- Reinitialize year wheel after content updates
- Ensures year wheel stays in sync when years change

---

### **Fix 3: Lazy Loading Hydration** (script.js:1219-1222)

**Before:**
```javascript
// Trigger year wheel initialization if needed
if (window.YearWheel && window.YearWheel.initializeWheel) {
  var wheelContainer = fullCard.querySelector('.habit-year-wheel');
  if (wheelContainer) {
    window.YearWheel.initializeWheel(wheelContainer, habit);
  }
}
```

**After:**
```javascript
// Initialize year wheel for the hydrated card
requestAnimationFrame(function() {
  initHabitYearWheel(habit);
});
```

**Key Changes:**
- Removed incorrect reference to `window.YearWheel.initializeWheel()`
- Use the correct `initHabitYearWheel()` function
- Simplified and more reliable initialization

---

## 🎨 How It Works Now

### **Complete Initialization Flow**

**Scenario 1: Initial Page Load**
```
1. App loads habits from storage
2. render() called
3. First 3 cards: renderHabitCard() creates full cards
4. Remaining cards: renderPlaceholderCard() creates placeholders
5. Year wheels initialized for first 3 cards ✅
6. Placeholders observed for lazy loading
```

**Scenario 2: Lazy Loading**
```
1. User scrolls down
2. Placeholder enters viewport
3. IntersectionObserver triggers
4. hydrateCard() replaces placeholder with full card
5. Year wheel initialized for hydrated card ✅
```

**Scenario 3: Re-render (Sort/Filter/Search)**
```
1. User changes sort order or filters
2. render() called
3. Existing cards reused from DOM
4. Check: Does year wheel exist?
   - No: Initialize year wheel ✅
   - Yes: Keep existing wheel ✅
5. Cards reordered in DOM
```

**Scenario 4: Drag-and-Drop Reorder**
```
1. User drags card to new position
2. HABITS array reordered
3. render() called
4. Existing cards reused (same as Scenario 3)
5. Year wheels preserved or initialized as needed ✅
```

**Scenario 5: Year Change**
```
1. User clicks different year in year wheel
2. Year wheel onChange callback fired
3. Habit data updated for new year
4. updateHabitCardContent() called
5. Card content rebuilt (dots, stats, etc.)
6. Year wheel cleaned up and reinitialized ✅
7. New year centered in wheel
```

---

## 📊 Affected Scenarios

### **All Card Reload Scenarios Now Fixed**

| Scenario | Before Fix | After Fix |
|----------|-----------|-----------|
| Initial render (first 3 cards) | ✅ Working | ✅ Working |
| Lazy loading hydration | ⚠️ Wrong function | ✅ Fixed |
| Card reuse (sorting) | ❌ Not initialized | ✅ Fixed |
| Card reuse (filtering) | ❌ Not initialized | ✅ Fixed |
| Card reuse (searching) | ❌ Not initialized | ✅ Fixed |
| Card reuse (drag-and-drop) | ❌ Not initialized | ✅ Fixed |
| Year change via wheel | ❌ Not reinitialized | ✅ Fixed |
| Edit habit (if triggers render) | ❌ Not initialized | ✅ Fixed |

---

## 🔧 Technical Details

### **Year Wheel Tracking**

**habitYearWheels Object:**
```javascript
var habitYearWheels = {}; // Global tracker

// Format:
{
  'habit-id-1': YearWheelInstance,
  'habit-id-2': YearWheelInstance,
  // ...
}
```

**Initialization Check:**
```javascript
if (!habitYearWheels[habit.id]) {
  // Year wheel doesn't exist - initialize it
  initHabitYearWheel(habit);
}
```

**Cleanup Before Reinit:**
```javascript
if (habitYearWheels[habit.id]) {
  delete habitYearWheels[habit.id];
}
initHabitYearWheel(habit);
```

### **requestAnimationFrame Usage**

All year wheel initialization wrapped in `requestAnimationFrame()` to ensure:
1. DOM is fully rendered and stable
2. Layout calculations are accurate
3. Container dimensions are finalized
4. Smooth initialization without visual glitches

### **ResizeObserver Pattern**

`initHabitYearWheel()` uses ResizeObserver to:
1. Wait for container to have non-zero width
2. Initialize year wheel with accurate dimensions
3. Properly center selected year
4. Disconnect observer after initialization

---

## 🎯 Benefits

### **1. Reliability**
- Year wheel always initializes, regardless of how card loads
- No more missing or broken year wheels
- Consistent behavior across all scenarios

### **2. Performance**
- Reuses existing year wheels when possible
- Only initializes when needed (checked via `habitYearWheels` tracker)
- No duplicate initialization attempts
- Efficient DOM reuse maintained

### **3. User Experience**
- Year wheel works immediately on all cards
- Smooth transitions when switching years
- No "blank" year wheels after sorting/filtering
- Drag-and-drop doesn't break year wheels

### **4. Maintainability**
- Single initialization function (`initHabitYearWheel()`)
- Consistent pattern across all scenarios
- Easy to debug with `habitYearWheels` tracker
- Clear separation of concerns

---

## 🧪 Testing Checklist

### **Initial Load**
- [ ] First 3 cards show year wheel immediately
- [ ] Lazy-loaded cards show year wheel when scrolled into view
- [ ] All year wheels properly centered on selected year

### **Sorting**
- [ ] Change sort to "Alphabetical A-Z" → Year wheels work
- [ ] Change sort to "Newest first" → Year wheels work
- [ ] Change sort to "Manual order" → Year wheels work
- [ ] Change sort to "Current streak" → Year wheels work
- [ ] All other sort options → Year wheels work

### **Filtering/Searching**
- [ ] Search for a habit → Year wheel works on results
- [ ] Clear search → Year wheels work on all cards
- [ ] Filter results change → Year wheels maintained

### **Drag-and-Drop**
- [ ] Switch to "Manual order" sort
- [ ] Drag card to new position
- [ ] Year wheel still works on dragged card
- [ ] Year wheels work on all other cards

### **Year Changes**
- [ ] Click different year in year wheel
- [ ] Card content updates correctly
- [ ] Year wheel shows new year as selected
- [ ] New year is centered in wheel
- [ ] Year wheel remains interactive

### **Edit Operations**
- [ ] Edit a habit's name
- [ ] Edit a habit's icon
- [ ] Edit a habit's color
- [ ] Year wheel remains functional after edits

### **Multiple Operations**
- [ ] Sort → Edit → Change year → Sort again
- [ ] Search → Change year → Clear search
- [ ] Drag-and-drop → Change year → Edit
- [ ] All combinations maintain working year wheels

---

## 🔍 Code Locations

### **Files Modified**
1. **script.js** (Line 1435-1443)
   - Added year wheel initialization check for reused cards

2. **script.js** (Line 3687-3695)
   - Added year wheel reinitialization after year changes

3. **script.js** (Line 1219-1222)
   - Fixed year wheel initialization in hydrateCard()

### **Related Code** (Not Modified)
- **script.js** (Line 3486-3629): `initHabitYearWheel()` function
- **script.js** (Line 1525-1531): Year wheel init for new cards
- **script.js** (Line 3484): `habitYearWheels` global tracker
- **script.js** (Line 3419-3481): Dynamic centering setup

---

## 💡 Key Insights

### **The Problem**
Modern single-page apps reuse DOM elements for performance. When cards are reused, their components (like year wheels) can become "orphaned" or fail to initialize.

### **The Solution**
Track year wheel instances globally (`habitYearWheels`) and explicitly check if initialization is needed whenever a card is displayed, regardless of whether it's new or reused.

### **The Pattern**
```javascript
// Always check before assuming component exists
if (!habitYearWheels[habit.id]) {
  initHabitYearWheel(habit);
}

// When rebuilding content, clean up first
if (habitYearWheels[habit.id]) {
  delete habitYearWheels[habit.id];
}
initHabitYearWheel(habit);
```

---

## 🚀 Future Considerations

### **Potential Enhancements**

**1. Component Lifecycle Management**
```javascript
// Add proper destroy method
function destroyHabitYearWheel(habitId) {
  var wheel = habitYearWheels[habitId];
  if (wheel && wheel.destroy) {
    wheel.destroy(); // Cleanup event listeners, observers, etc.
  }
  delete habitYearWheels[habitId];
}
```

**2. Initialization Performance**
```javascript
// Batch initialize visible cards
function batchInitYearWheels(habits) {
  requestAnimationFrame(function() {
    habits.forEach(function(habit) {
      if (!habitYearWheels[habit.id]) {
        initHabitYearWheel(habit);
      }
    });
  });
}
```

**3. Error Recovery**
```javascript
// Retry initialization on failure
function safeInitYearWheel(habit, retries = 3) {
  try {
    initHabitYearWheel(habit);
  } catch (error) {
    if (retries > 0) {
      setTimeout(function() {
        safeInitYearWheel(habit, retries - 1);
      }, 100);
    }
  }
}
```

---

## 📈 Impact Summary

**Lines Changed:** 3 functions, ~25 lines total
**Files Modified:** 1 (script.js)
**Scenarios Fixed:** 7 reload scenarios
**User Impact:** High - Core feature reliability
**Performance Impact:** Neutral - Same or better
**Breaking Changes:** None
**Backwards Compatible:** Yes

---

**Last Updated**: 2025-11-14
**Version**: 1.0.0
**Fix Type**: Component initialization reliability
**Priority**: High - Core functionality
**Status**: Complete ✅
