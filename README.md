# Momentum - Habit Tracker

A beautiful, modular habit tracker application that helps you build and maintain positive habits.

## Features

- **Multi-Habit Tracking**: Track multiple habits simultaneously
- **Year and Month Views**: Switch between yearly overview and monthly detailed views
- **Dual Backend Support**: LocalStorage (offline) or Firebase (cloud-based)
- **Firebase Authentication**: Email/password and Google OAuth login
- **Cloud Storage**: Sync habits across devices with Firestore
- **User-Specific Data**: Each user has their own isolated habit data
- **Dark/Light Mode**: Toggle between themes for comfortable viewing
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Icon Customization**: Choose from hundreds of icons and colors for each habit
- **Statistics**: View detailed stats and completion rates

## Project Structure

```
track_down/
├── login.html          # Entry point - Login/Registration page
├── index.html          # Main application (requires authentication)
├── styles.css          # Application styles
├── script.js           # Main application logic
├── icon.png            # Application icon
├── js/                 # Modular JavaScript files
│   ├── auth.js         # Authentication module
│   ├── storage.js      # LocalStorage management module
│   └── utils.js        # Utility functions module
└── README.md           # This file
```

## Module Documentation

### Authentication Module (`js/auth.js`)

Handles user authentication, registration, and session management.

**Key Functions:**
- `Auth.register(username, password)` - Register a new user
- `Auth.login(username, password)` - Login existing user
- `Auth.logout()` - Logout current user
- `Auth.isAuthenticated()` - Check if user is logged in
- `Auth.getCurrentUser()` - Get current username
- `Auth.deleteAccount(username)` - Delete user account

**Storage:**
- Users are stored in `localStorage` with key `momentum_users`
- Sessions are stored in `localStorage` with key `momentum_session`
- Passwords are hashed (simple hash for demo - use proper encryption in production)

### Storage Module (`js/storage.js`)

Manages all localStorage operations for user-specific data.

**Key Functions:**
- `Storage.saveHabits(habits)` - Save habits for current user
- `Storage.loadHabits()` - Load habits for current user
- `Storage.saveSettings(settings)` - Save user settings
- `Storage.loadSettings()` - Load user settings
- `Storage.exportData()` - Export all user data
- `Storage.importData(data)` - Import user data
- `Storage.clearUserData()` - Clear all data for current user

**Data Isolation:**
- Each user's data is stored separately with prefix `momentum_<username>_`
- Users can only access their own data
- Deleting account removes all associated data

### Utility Module (`js/utils.js`)

Common utility functions used across the application.

**Key Functions:**
- Color utilities: `hexToRgb()`, `luminance()`, `contrast()`, `mix()`
- Date utilities: `formatDate()`, `parseDate()`, `isValidDate()`
- General utilities: `debounce()`, `generateId()`, `deepClone()`, `escapeHtml()`

## Getting Started

### First Time Setup

1. Open `login.html` in your web browser
2. Enter a username (minimum 3 characters) and password (minimum 6 characters)
3. Click "Create one" link to register a new account
4. You'll be automatically logged in and redirected to the main app

### Using the Application

1. **Add a Habit**: Click the "+" button in the header or bottom navigation
2. **Customize Icon**: Click on the icon/color picker when creating/editing habits
3. **Track Progress**: Click on dots to mark days as complete
4. **View Stats**: Click on habit name or stats to see detailed statistics
5. **Switch Views**: Toggle between year and month views using the calendar icon
6. **Dark Mode**: Toggle dark/light mode using the theme button

### Managing Your Account

- **Logout**: Click on the account menu and select "Log out"
- **Delete Account**: Click on the account menu and select "Delete account"
  - **Warning**: This action cannot be undone and will delete all your data

## Development

### Architecture

The application follows a modular architecture:

1. **Entry Point**: `login.html` - Authentication gateway
2. **Main App**: `index.html` - Protected by authentication check
3. **Modules**: Separate concerns into reusable modules
   - Authentication (auth.js)
   - Storage management (storage.js)
   - Utility functions (utils.js)

### Data Flow

```
User Login → Auth Module → Session Created
                ↓
        index.html loads → Auth Check
                ↓
        script.js loads → Storage Module
                ↓
        Load User Habits → Render UI
                ↓
        User Interactions → Save to Storage Module
```

### Security Considerations

⚠️ **Important**: This is a client-side application suitable for personal use or demonstration. For production use, consider:

1. **Server-Side Authentication**: Implement proper server-side authentication
2. **Password Encryption**: Use bcrypt or similar for password hashing
3. **HTTPS**: Always use HTTPS in production
4. **Session Management**: Implement proper session timeout and refresh tokens
5. **Data Encryption**: Encrypt sensitive data in localStorage
6. **Input Validation**: Add server-side validation for all inputs

## Browser Compatibility

- Chrome/Edge (recommended)
- Firefox
- Safari
- Modern mobile browsers

Requires:
- JavaScript enabled
- LocalStorage support
- CSS Grid and Flexbox support

## LocalStorage Usage

The application uses the following localStorage keys:

### Global (Non-User-Specific)
- `theme` - Theme preference (light/dark)
- `viewpreference` - View mode (year/month)
- `momentum_users` - User account data
- `momentum_session` - Current session

### User-Specific (Prefixed with `momentum_<username>_`)
- `habits` - User's habit data
- `settings` - User preferences and settings

## Troubleshooting

### Can't Login
- Make sure you've created an account first
- Check that your browser allows localStorage
- Try clearing browser cache and recreating account

### Data Not Saving
- Check browser console for errors
- Ensure localStorage is not full
- Verify you're logged in (check session)

### Login Page Not Appearing
- Clear browser cache
- Ensure JavaScript is enabled
- Check browser console for errors

## Contributing

To contribute to this project:

1. Create a new branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## License

This project is open source and available for personal and educational use.

## Credits

- **Design System**: Custom Bento UI inspired design
- **Icons**: Tabler Icons
- **Fonts**: Inter (Google Fonts)
- **Framework**: Vanilla JavaScript with Tailwind CSS utilities

---

**Note**: This application stores all data locally in your browser. Remember to export your data regularly if you want to keep backups.
