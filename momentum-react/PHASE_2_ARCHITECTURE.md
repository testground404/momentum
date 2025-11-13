# Phase 2: Core Architecture & State Management

## Overview

Phase 2 establishes the complete core architecture for the Momentum Habit Tracker React migration, including advanced state management, Firebase integration with real-time subscriptions, and comprehensive utility functions.

## Completed Components

### 1. Type System Enhancement (`src/types/index.ts`)

**Updated Type Definitions:**
- `Habit`: Enhanced with day-indexed completion tracking
  - Uses `{ [dayIndex: string]: boolean }` for efficient lookups
  - Supports notes per day with `{ [dayIndex: string]: string }`
  - Includes year-based tracking and flexible metadata

- `HabitStats`: Comprehensive statistics interface
  - Total days, completed days, completion rate
  - Current streak and longest streak tracking
  - Last completed date tracking

- `SortOption`: Expanded sorting options
  - `created-newest`, `created-oldest`
  - `name-az`, `name-za`
  - `rate-high-low`, `rate-low-high`
  - `manual` (custom ordering)

- `ModalState`: Centralized modal management
- `ColorOption` & `IconOption`: UI picker types
- `FirebaseHabit`: Firestore-specific types with Timestamp handling

### 2. Zustand State Management (`src/store/habitStore.ts`)

**Complete Store Implementation:**

**State:**
- Habits collection with full CRUD support
- View controls (year/month, current year/month)
- Search and filtering
- Sort options
- Archive toggle
- Modal state management
- Selected habit tracking

**Actions:**
- **CRUD Operations:**
  - `addHabit`, `updateHabit`, `deleteHabit`
  - `archiveHabit`, `unarchiveHabit`

- **Completion Tracking:**
  - `toggleCompletion`: Optimized day-based completion toggling
  - `setNote`: Per-day note management

- **View Controls:**
  - `setView`, `setYear`, `setMonth`
  - `setSearchQuery`, `setSortOption`
  - `setShowArchived`, `setSelectedHabit`

- **Modal Management:**
  - `openModal`, `closeModal`

**Computed Getters:**
- `getFilteredHabits()`: Returns filtered and sorted habits
- `getHabitById(id)`: Quick habit lookup
- `getHabitStats(id)`: Calculate habit statistics
- `getTotalHabits()`: Count active habits
- `getActiveHabits()`: Get non-archived habits

**Persistence:**
- Uses Zustand persist middleware
- Saves habits, view preferences, and settings to localStorage
- Partialize to only persist necessary state

### 3. Firebase Services (`src/services/habitService.ts`)

**Enhanced Service Layer:**

**Core Functions:**
- `fetchUserHabits(userId)`: One-time fetch with type conversion
- `subscribeToUserHabits(userId, callback)`: Real-time subscription
- `createHabit(habitData)`: Create with server timestamps
- `updateHabit(habitId, updates)`: Partial updates
- `deleteHabit(habitId)`: Permanent deletion
- `archiveHabit(habitId)`: Soft delete
- `unarchiveHabit(habitId)`: Restore archived habit

**Completion Management:**
- `toggleHabitCompletion(habitId, dayIndex, currentCompletions)`
- `updateHabitNote(habitId, dayIndex, note, currentNotes)`
- `updateHabitOrder(habitId, order)`: For drag-and-drop

**Features:**
- Automatic Firestore Timestamp conversion
- Type-safe data conversion
- Error handling and logging
- Optimized queries with orderBy

### 4. Utility Functions (`src/utils/habitUtils.ts`)

**Filtering & Sorting:**
- `filterHabits(habits, searchQuery, showArchived)`: Combined filtering
- `sortHabits(habits, sortOption)`: All sort options implemented

**Statistics & Analytics:**
- `calculateCompletionRate(habit)`: Percentage completion
- `calculateHabitStats(habit)`: Full stats object
- `calculateStreaks(habit)`: Current and longest streaks
- `getDaysSinceStart(habit)`: Days active calculation

**Helpers:**
- `generateHabitColor(existingHabits)`: Smart color selection
- `getHabitColorOptions()`: Predefined color palette
- `dayIndexToDate(year, dayIndex)`: Convert index to date
- `dateToDayIndex(year, dateString)`: Convert date to index
- `isCompletedOnDay(habit, dayIndex)`: Quick completion check
- `getCompletionPercentage(habit)`: Rounded percentage

### 5. React Query Hooks (`src/hooks/useHabits.ts`)

**Custom Hooks for Data Management:**

**Query Hooks:**
- `useUserHabits(userId)`: Fetch habits with caching
  - 5-minute stale time
  - Auto-refetch management
  - Loading and error states

**Mutation Hooks:**
- `useCreateHabit()`: Create with optimistic updates
- `useUpdateHabit()`: Update with immediate UI feedback
- `useDeleteHabit()`: Delete with optimistic removal
- `useArchiveHabit()`: Archive with state sync
- `useToggleCompletion()`: Fast completion toggling
- `useUpdateNote()`: Note updates with optimistic UI

**Subscription Hook:**
- `useHabitsSubscription(userId)`: Real-time Firestore sync
  - Auto-cleanup on unmount
  - Syncs directly to Zustand store

### 6. Authentication Hook (`src/hooks/useAuth.ts`)

**Complete Auth Management:**

**Features:**
- Email/password authentication
- Google sign-in support
- Real-time auth state tracking
- Error handling

**Functions:**
- `signIn(email, password)`
- `signUp(email, password)`
- `signInWithGoogle()`
- `signOut()`

**State:**
- `user`: Current user object
- `loading`: Auth initialization state
- `error`: Auth error messages

### 7. React Query Provider (`src/main.tsx`)

**Global Setup:**
- QueryClient configuration
- Optimized default options
- Retry and refetch policies

## Architecture Highlights

### State Management Strategy

```
┌─────────────────────────────────────────────────┐
│                  React Query                     │
│          (Server State / Cache Layer)            │
│  - Fetching, caching, refetching                │
│  - Optimistic updates                            │
│  - Background sync                               │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│             Firebase Firestore                   │
│          (Source of Truth / Persistence)         │
│  - Real-time subscriptions                      │
│  - Atomic updates                                │
│  - Server timestamps                             │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│                Zustand Store                     │
│            (Client State / UI State)             │
│  - Habits array (synced from Firebase)          │
│  - View preferences                              │
│  - UI state (modals, selections)                │
│  - Computed values                               │
└─────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│              React Components                    │
│  - Use hooks to access state                    │
│  - Trigger mutations                             │
│  - Render UI                                     │
└─────────────────────────────────────────────────┘
```

### Data Flow

1. **Initial Load:**
   - User authenticates → `useAuth` provides user object
   - `useHabitsSubscription` starts real-time sync
   - Firebase → Zustand store update
   - Components re-render with data

2. **User Action (e.g., Toggle Completion):**
   - Component calls `toggleCompletion` mutation
   - Optimistic update in Zustand store (instant UI feedback)
   - Firebase update triggered
   - Real-time listener receives confirmation
   - Store syncs with confirmed data

3. **Real-time Updates (from other devices):**
   - Firebase listener receives change
   - Zustand store updates automatically
   - Components re-render with new data

## Key Benefits

### Performance
- **Optimistic Updates:** Instant UI feedback
- **Smart Caching:** Reduced Firebase reads
- **Selective Persistence:** Only save essential state
- **Computed Values:** Memoized calculations

### Developer Experience
- **Type Safety:** Full TypeScript coverage
- **Separation of Concerns:** Clear architecture layers
- **Reusable Hooks:** Custom hooks for all operations
- **Error Handling:** Comprehensive error management

### Scalability
- **Modular Design:** Easy to extend
- **Real-time Sync:** Always up-to-date
- **Offline Support:** Ready for offline mode (future)
- **Testing Ready:** Mockable hooks and services

## Usage Examples

### Creating a Habit

```typescript
import { useCreateHabit } from '@/hooks/useHabits';
import { useAuth } from '@/hooks/useAuth';

function HabitForm() {
  const { user } = useAuth();
  const createHabit = useCreateHabit();

  const handleSubmit = async (data) => {
    await createHabit.mutateAsync({
      name: data.name,
      icon: data.icon,
      color: data.color,
      year: new Date().getFullYear(),
      startDate: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
      userId: user!.uid,
      completions: {},
    });
  };

  return <form onSubmit={handleSubmit}>...</form>;
}
```

### Displaying Habits with Stats

```typescript
import { useHabitStore } from '@/store/habitStore';

function HabitList() {
  const habits = useHabitStore((state) => state.getFilteredHabits());
  const getHabitStats = useHabitStore((state) => state.getHabitStats);

  return (
    <div>
      {habits.map((habit) => {
        const stats = getHabitStats(habit.id);
        return (
          <div key={habit.id}>
            <h3>{habit.name}</h3>
            <p>Completion Rate: {stats?.completionRate.toFixed(1)}%</p>
            <p>Current Streak: {stats?.currentStreak} days</p>
          </div>
        );
      })}
    </div>
  );
}
```

### Real-time Subscription

```typescript
import { useHabitsSubscription } from '@/hooks/useHabits';
import { useAuth } from '@/hooks/useAuth';

function App() {
  const { user } = useAuth();

  // This automatically keeps Zustand store in sync with Firebase
  useHabitsSubscription(user?.uid);

  return <div>...</div>;
}
```

## Next Steps: Phase 3

Phase 3 will focus on building the UI components:
- Core reusable components (Button, Input, Modal, etc.)
- Habit-specific components (HabitCard, HabitList)
- Year wheel and month grid visualizations
- Icon and color pickers
- Authentication UI

The solid architecture from Phase 2 makes Phase 3 implementation straightforward!
