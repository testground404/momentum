# Custom Sorting Implementation Guide

## Overview
Complete guide to implementing custom sorting for your habit tracker, including manual drag-and-drop ordering.

---

## 🎯 Current Sorting System

### **Existing Sort Options** (Already Implemented)

Your app currently has these sorting options:

1. **Newest first** (`created-newest`) - Default
2. **Oldest first** (`created-oldest`)
3. **Name A → Z** (`name-az`)
4. **Name Z → A** (`name-za`)
5. **Highest completion** (`rate-high-low`)
6. **Lowest completion** (`rate-low-high`)

**Location:** `app.html` lines 55-60, `script.js` lines 1066-1094

---

## 🚀 Implementation Options

### **Option 1: Add More Predefined Sorts (Easiest)**

Add new sorting criteria to existing system.

### **Option 2: Manual Drag-and-Drop (Most Flexible)**

Allow users to manually reorder habits by dragging.

### **Option 3: Multi-Column Sorting (Advanced)**

Sort by multiple criteria (e.g., completion rate, then name).

---

## 📝 Option 1: Adding More Sort Options

### **Step 1: Add New Sort Options**

Edit `app.html` line 54-61:

```html
<select class="input custom-select-source" id="habit-sort">
  <option value="created-newest">Newest first</option>
  <option value="created-oldest">Oldest first</option>
  <option value="name-az">Name A → Z</option>
  <option value="name-za">Name Z → A</option>
  <option value="rate-high-low">Highest completion</option>
  <option value="rate-low-high">Lowest completion</option>

  <!-- NEW: Add custom sort options -->
  <option value="custom-manual">Manual order</option>
  <option value="color">By color</option>
  <option value="streak-longest">Longest streak</option>
  <option value="streak-current">Current streak</option>
  <option value="total-high">Most completions</option>
  <option value="total-low">Least completions</option>
  <option value="start-date">By start date</option>
  <option value="last-modified">Recently modified</option>
</select>
```

### **Step 2: Implement Sort Logic**

Edit `script.js` in the `sortHabits()` function (line 1076):

```javascript
function sortHabits(list, sortKey) {
  var key = sortKey || 'created-newest';
  var arr = list.slice();
  var completionCache;
  var statsCache;

  // Pre-calculate stats if needed
  if (key.includes('streak') || key.includes('total')) {
    statsCache = new Map();
    arr.forEach(function (habit) {
      var todayIdx = dayIndexForYear(habit.year);
      var stats = calcStats(habit.dots, habit.offDays, todayIdx);
      statsCache.set(habit.id, stats);
    });
  }

  if (key === 'rate-high-low' || key === 'rate-low-high') {
    completionCache = new Map();
    arr.forEach(function (habit) {
      completionCache.set(habit.id, completionSortValue(habit));
    });
  }

  arr.sort(function (a, b) {
    switch (key) {
      // Existing sorts
      case 'name-az':
        return compareHabitNames(a, b);
      case 'name-za':
        return compareHabitNames(b, a);
      case 'created-oldest':
        return createdAtValue(a) - createdAtValue(b);
      case 'rate-high-low':
        return (completionCache.get(b.id) || 0) - (completionCache.get(a.id) || 0);
      case 'rate-low-high':
        return (completionCache.get(a.id) || 0) - (completionCache.get(b.id) || 0);

      // NEW: Custom sorts
      case 'custom-manual':
        // Use manual order stored in habit.customOrder
        return (a.customOrder || 0) - (b.customOrder || 0);

      case 'color':
        // Sort by accent color (hex value)
        return (a.accent || '').localeCompare(b.accent || '');

      case 'streak-longest':
        var statsA = statsCache.get(a.id);
        var statsB = statsCache.get(b.id);
        return (statsB.longest || 0) - (statsA.longest || 0);

      case 'streak-current':
        var statsA = statsCache.get(a.id);
        var statsB = statsCache.get(b.id);
        return (statsB.current || 0) - (statsA.current || 0);

      case 'total-high':
        var statsA = statsCache.get(a.id);
        var statsB = statsCache.get(b.id);
        return (statsB.total || 0) - (statsA.total || 0);

      case 'total-low':
        var statsA = statsCache.get(a.id);
        var statsB = statsCache.get(b.id);
        return (statsA.total || 0) - (statsB.total || 0);

      case 'start-date':
        return parseStartDate(a.startDate) - parseStartDate(b.startDate);

      case 'last-modified':
        return (b.lastModified || 0) - (a.lastModified || 0);

      case 'created-newest':
      default:
        return createdAtValue(b) - createdAtValue(a);
    }
  });

  return arr;
}

// Helper function for date parsing
function parseStartDate(dateStr) {
  if (!dateStr) return 0;
  var parts = dateStr.split('-');
  if (parts.length === 3) {
    return new Date(parts[2], parts[1] - 1, parts[0]).getTime();
  }
  return 0;
}
```

---

## 🎨 Option 2: Manual Drag-and-Drop Sorting

### **Implementation: Drag-and-Drop Reordering**

#### **Step 1: Add Drag Handle to Cards**

Edit `script.js` in `renderHabitCard()` function (around line 1230):

```javascript
// Add this after the edit button (around line 1176)
var dragHandle = document.createElement('button');
dragHandle.className = 'control-btn drag-handle';
dragHandle.setAttribute('aria-label', 'Reorder habit');
dragHandle.setAttribute('title', 'Drag to reorder');
dragHandle.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>';
dragHandle.style.cursor = 'grab';

// Show drag handle only when in manual sort mode
if (habitViewState.sortKey === 'custom-manual') {
  buttonsContainer.insertBefore(dragHandle, editBtn);
}
```

#### **Step 2: Implement Drag-and-Drop Logic**

Add this code after the `render()` function in `script.js`:

```javascript
// Drag-and-drop for manual sorting
var draggedCard = null;
var draggedHabitId = null;

function enableDragAndDrop() {
  var cards = listEl.querySelectorAll('.card');

  cards.forEach(function(card) {
    // Make card draggable only in manual sort mode
    if (habitViewState.sortKey === 'custom-manual') {
      card.setAttribute('draggable', 'true');
      card.style.cursor = 'grab';

      card.addEventListener('dragstart', handleDragStart);
      card.addEventListener('dragover', handleDragOver);
      card.addEventListener('drop', handleDrop);
      card.addEventListener('dragend', handleDragEnd);
      card.addEventListener('dragenter', handleDragEnter);
      card.addEventListener('dragleave', handleDragLeave);
    } else {
      card.removeAttribute('draggable');
      card.style.cursor = '';
    }
  });
}

function handleDragStart(e) {
  draggedCard = this;
  draggedHabitId = this.dataset.habitId;
  this.style.opacity = '0.4';
  this.style.cursor = 'grabbing';
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/html', this.innerHTML);
}

function handleDragOver(e) {
  if (e.preventDefault) {
    e.preventDefault();
  }
  e.dataTransfer.dropEffect = 'move';
  return false;
}

function handleDragEnter(e) {
  if (this !== draggedCard) {
    this.classList.add('drag-over');
  }
}

function handleDragLeave(e) {
  this.classList.remove('drag-over');
}

function handleDrop(e) {
  if (e.stopPropagation) {
    e.stopPropagation();
  }

  this.classList.remove('drag-over');

  if (draggedCard !== this) {
    // Get habit IDs
    var draggedId = draggedHabitId;
    var targetId = this.dataset.habitId;

    // Find habits in array
    var draggedIndex = HABITS.findIndex(h => h.id === draggedId);
    var targetIndex = HABITS.findIndex(h => h.id === targetId);

    if (draggedIndex !== -1 && targetIndex !== -1) {
      // Reorder array
      var draggedHabit = HABITS.splice(draggedIndex, 1)[0];
      HABITS.splice(targetIndex, 0, draggedHabit);

      // Update custom order for all habits
      HABITS.forEach(function(habit, index) {
        habit.customOrder = index;
        habit.lastModified = Date.now();
      });

      // Save and re-render
      saveHabits(HABITS);
      render();
      announce('Habit order updated');
    }
  }

  return false;
}

function handleDragEnd(e) {
  this.style.opacity = '1';
  this.style.cursor = 'grab';

  var cards = listEl.querySelectorAll('.card');
  cards.forEach(function(card) {
    card.classList.remove('drag-over');
  });
}

// Call this at the end of render() function
enableDragAndDrop();
```

#### **Step 3: Add Drag-and-Drop Styles**

Add to `styles.css`:

```css
/* Drag and drop for manual sorting */
.card[draggable="true"] {
  transition: opacity 0.2s ease;
}

.card.drag-over {
  border-top: 3px solid var(--primary);
  padding-top: calc(22px - 3px); /* Compensate for border */
}

.drag-handle {
  opacity: 0.5;
  transition: opacity 0.2s ease;
}

.drag-handle:hover {
  opacity: 1;
}

/* Visual feedback during drag */
.card:active[draggable="true"] {
  cursor: grabbing !important;
}
```

---

## 🎯 Option 3: Multi-Level Sorting

### **Implementation: Sort by Multiple Criteria**

```javascript
function sortHabitsMultiLevel(list, primaryKey, secondaryKey) {
  var arr = list.slice();

  arr.sort(function(a, b) {
    // Try primary sort first
    var primaryResult = compareByCriteria(a, b, primaryKey);

    // If equal, use secondary sort
    if (primaryResult === 0 && secondaryKey) {
      return compareByCriteria(a, b, secondaryKey);
    }

    return primaryResult;
  });

  return arr;
}

function compareByCriteria(a, b, criteria) {
  switch(criteria) {
    case 'name':
      return compareHabitNames(a, b);
    case 'completion':
      return completionSortValue(b) - completionSortValue(a);
    case 'created':
      return createdAtValue(b) - createdAtValue(a);
    // Add more criteria as needed
    default:
      return 0;
  }
}

// Usage:
var sorted = sortHabitsMultiLevel(HABITS, 'completion', 'name');
// Sorts by completion rate first, then by name
```

---

## 💾 Persisting Custom Sort Order

### **Save Custom Order to Storage**

```javascript
// In storage.js, ensure customOrder is saved
function saveHabits(habits) {
  // customOrder property will be saved automatically
  // since we're saving entire habit objects

  // Optional: Save sort preference
  localStorage.setItem('habit_sort_preference', habitViewState.sortKey);
}

// Load sort preference on init
var savedSort = localStorage.getItem('habit_sort_preference');
if (savedSort) {
  habitViewState.sortKey = savedSort;
  if (sortSelect) sortSelect.value = savedSort;
}
```

---

## 🎨 UI Enhancements

### **1. Sort Indicator**

Show current sort in UI:

```javascript
function updateSortIndicator() {
  var sortLabel = document.querySelector('.sort-label');
  if (sortLabel) {
    var option = sortSelect.querySelector('option:checked');
    sortLabel.textContent = option ? option.textContent : 'Sort';
  }
}
```

### **2. Drag Preview**

Improve drag visual feedback:

```javascript
function handleDragStart(e) {
  // ... existing code ...

  // Create custom drag image
  var dragImage = this.cloneNode(true);
  dragImage.style.width = this.offsetWidth + 'px';
  dragImage.style.opacity = '0.8';
  dragImage.style.transform = 'rotate(2deg)';
  document.body.appendChild(dragImage);
  e.dataTransfer.setDragImage(dragImage, 0, 0);

  setTimeout(() => document.body.removeChild(dragImage), 0);
}
```

### **3. Undo Sort Change**

Add undo functionality:

```javascript
var previousHabitsOrder = null;

function savePreviousOrder() {
  previousHabitsOrder = HABITS.map(h => h.id);
}

function undoSortChange() {
  if (!previousHabitsOrder) return;

  var newOrder = [];
  previousHabitsOrder.forEach(function(id) {
    var habit = HABITS.find(h => h.id === id);
    if (habit) newOrder.push(habit);
  });

  HABITS = newOrder;
  render();
  announce('Sort order restored');
}
```

---

## 📊 Advanced Sorting Features

### **1. Grouped Sorting**

Group habits by category, then sort within groups:

```javascript
function sortWithGroups(list, groupBy, sortBy) {
  // Group habits
  var groups = {};
  list.forEach(function(habit) {
    var groupKey = habit[groupBy] || 'Other';
    if (!groups[groupKey]) groups[groupKey] = [];
    groups[groupKey].push(habit);
  });

  // Sort each group
  Object.keys(groups).forEach(function(key) {
    groups[key] = sortHabits(groups[key], sortBy);
  });

  // Flatten back to array
  var result = [];
  Object.keys(groups).sort().forEach(function(key) {
    result = result.concat(groups[key]);
  });

  return result;
}

// Usage:
var sorted = sortWithGroups(HABITS, 'category', 'name-az');
```

### **2. Smart Sorting**

AI-suggested sort based on usage patterns:

```javascript
function smartSort(list) {
  var now = new Date();
  var hour = now.getHours();

  // Morning: Show habits with morning frequency
  if (hour < 12) {
    return sortByFrequency(list, ['morning', 'daily']);
  }

  // Evening: Show habits not yet completed today
  return list.filter(h => !h.dots[dayIndexForYear(h.year)])
             .concat(list.filter(h => h.dots[dayIndexForYear(h.year)]));
}
```

### **3. Favorite/Pinned Habits**

Pin important habits to top:

```javascript
function sortWithPinned(list, sortKey) {
  var pinned = list.filter(h => h.pinned);
  var unpinned = list.filter(h => !h.pinned);

  return sortHabits(pinned, sortKey)
         .concat(sortHabits(unpinned, sortKey));
}

// Add pin toggle to card
var pinBtn = document.createElement('button');
pinBtn.className = 'control-btn pin-btn';
pinBtn.innerHTML = habit.pinned ? '📌' : '📍';
pinBtn.onclick = function() {
  habit.pinned = !habit.pinned;
  saveHabits(HABITS);
  render();
};
```

---

## 🧪 Testing Custom Sorting

### **Test Checklist**

- [ ] All predefined sorts work
- [ ] Manual sort persists after reload
- [ ] Drag-and-drop is smooth
- [ ] Search works with custom sort
- [ ] Mobile touch drag works
- [ ] Undo/redo sorting works
- [ ] Sort indicator updates

### **Performance Testing**

```javascript
console.time('Sort Performance');
var sorted = sortHabits(HABITS, 'custom-manual');
console.timeEnd('Sort Performance');
// Should be < 10ms for 100 habits
```

---

## 📱 Mobile Considerations

### **Touch-Friendly Drag**

```javascript
// Add touch event support
card.addEventListener('touchstart', handleTouchStart);
card.addEventListener('touchmove', handleTouchMove);
card.addEventListener('touchend', handleTouchEnd);

var touchStartY = 0;
var touchCard = null;

function handleTouchStart(e) {
  touchCard = this;
  touchStartY = e.touches[0].clientY;
  this.style.opacity = '0.4';
}

function handleTouchMove(e) {
  e.preventDefault();
  var touchY = e.touches[0].clientY;
  var deltaY = touchY - touchStartY;

  // Visual feedback
  touchCard.style.transform = `translateY(${deltaY}px)`;
}

function handleTouchEnd(e) {
  // Determine drop position and reorder
  // Reset styles
  touchCard.style.opacity = '1';
  touchCard.style.transform = '';
}
```

---

## 🎯 Quick Implementation (Recommended)

### **Simplest Approach: Add Manual Sort**

1. **Add option to HTML:**
```html
<option value="custom-manual">Manual order</option>
```

2. **Add case to sortHabits():**
```javascript
case 'custom-manual':
  return (a.customOrder || 0) - (b.customOrder || 0);
```

3. **Enable drag-and-drop when selected:**
```javascript
if (habitViewState.sortKey === 'custom-manual') {
  enableDragAndDrop();
}
```

4. **Update order on drop:**
```javascript
HABITS.forEach((habit, index) => {
  habit.customOrder = index;
});
saveHabits(HABITS);
```

---

## 📞 Summary

### **Current System:**
✅ 6 predefined sort options
✅ Fast sorting with caching
✅ Mobile-friendly UI

### **Enhancement Options:**
1. **Easy:** Add more predefined sorts
2. **Medium:** Implement drag-and-drop manual sorting
3. **Advanced:** Multi-level sorting, grouping, pinning

### **Recommended:**
Start with **manual drag-and-drop sorting** for maximum flexibility while keeping the system simple.

---

**Last Updated**: 2025-11-14
**Complexity**: Medium
**Estimated Time**: 2-3 hours for full drag-and-drop
**Priority**: User Experience Enhancement
