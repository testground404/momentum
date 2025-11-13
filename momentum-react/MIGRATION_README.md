# Momentum Habit Tracker - React Migration

This is the React version of the Momentum Habit Tracker, migrated from vanilla JavaScript.

## Project Structure

```
momentum-react/
├── public/               # Static assets
│   └── icon.png         # App icon
├── src/
│   ├── assets/          # Images, fonts, and other assets
│   ├── components/      # React components
│   │   ├── common/      # Reusable UI components (buttons, inputs, etc.)
│   │   ├── habits/      # Habit-specific components (HabitCard, HabitList, etc.)
│   │   ├── modals/      # Modal components (HabitModal, ConfirmModal, etc.)
│   │   └── layout/      # Layout components (Header, Sidebar, etc.)
│   ├── hooks/           # Custom React hooks
│   ├── store/           # Zustand state management stores
│   │   ├── habitStore.ts   # Habit state management
│   │   └── themeStore.ts   # Theme state management
│   ├── services/        # API and Firebase services
│   │   ├── firebase.ts        # Firebase initialization
│   │   └── habitService.ts   # Habit CRUD operations
│   ├── utils/           # Utility functions
│   │   ├── dateUtils.ts     # Date manipulation utilities
│   │   └── habitUtils.ts    # Habit filtering and sorting
│   ├── types/           # TypeScript type definitions
│   │   └── index.ts         # Core types
│   ├── styles/          # Global styles and Tailwind CSS
│   ├── App.tsx          # Main app component
│   └── main.tsx         # Entry point
├── original/            # Original vanilla JS files (for reference)
├── .env                 # Environment variables
└── package.json
```

## Tech Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Zustand** - Lightweight state management
- **React Query** - Server state management
- **Firebase** - Authentication and Firestore database
- **date-fns** - Date manipulation library
- **React Router** - Client-side routing
- **Headless UI** - Accessible UI components

## Getting Started

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Setup environment variables**
   - Copy `.env.example` to `.env`
   - Fill in your Firebase configuration

3. **Run development server**
   ```bash
   npm run dev
   ```

4. **Build for production**
   ```bash
   npm run build
   ```

## Migration Status

- [x] Phase 1: Project Setup & Infrastructure
- [ ] Phase 2: Core Components
- [ ] Phase 3: State Management
- [ ] Phase 4: Firebase Integration
- [ ] Phase 5: Feature Migration
- [ ] Phase 6: Testing & Optimization

## Key Features

- ✅ Habit creation, editing, and deletion
- ✅ Year wheel and month grid views
- ✅ Custom icon and color selection
- ✅ Search and sort functionality
- ✅ Dark/light theme support
- ✅ Firebase authentication and storage
- ✅ Performance tracking and statistics
- ✅ Responsive design

## Development Guidelines

- Use TypeScript for all new files
- Follow the existing folder structure
- Create reusable components in `components/common/`
- Use Zustand for client state, React Query for server state
- Write utility functions in the `utils/` directory
- Keep components small and focused
- Use Tailwind CSS for styling

## Original Files

The original vanilla JavaScript files are preserved in the `original/` directory for reference during migration.
