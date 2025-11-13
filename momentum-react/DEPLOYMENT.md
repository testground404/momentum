# Momentum Habit Tracker - Deployment Guide

This guide covers building and deploying the React-based Momentum Habit Tracker application.

## Prerequisites

- Node.js 18+ and npm
- Firebase account (for Firebase Hosting or Firebase services)
- Git repository access

## Build Configuration

The application is configured with:
- **Vite** for fast builds and optimized bundling
- **PWA support** with offline capabilities
- **Code splitting** for optimal loading performance
- **TypeScript** for type safety

## Building for Production

### 1. Install Dependencies

```bash
npm install
```

### 2. Run Type Checking

```bash
npx tsc -b
```

### 3. Build Production Bundle

```bash
npm run build
```

This command:
- Compiles TypeScript to JavaScript
- Bundles and optimizes code with Vite
- Generates PWA service workers
- Creates optimized chunks for faster loading
- Outputs to `dist/` directory

### 4. Preview Production Build Locally

```bash
npm run preview
```

Visit http://localhost:4173 to test the production build locally.

## Build Output

The build generates optimized chunks:
- **react-vendor** (~44KB): React core libraries
- **firebase** (~343KB): Firebase SDK
- **ui-vendor** (~106KB): UI components (@headlessui/react, clsx)
- **query** (~40KB): TanStack Query and Virtual
- **state** (~0.65KB): Zustand state management
- **Page chunks** (2-4KB each): Lazy-loaded pages
- **PWA files**: Service worker (sw.js) and manifest

Total bundle size: ~861KB (precached)

## Deployment Options

### Option 1: Firebase Hosting (Recommended)

#### Setup
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase (if not already done)
firebase init hosting
```

Configure `firebase.json`:
```json
{
  "hosting": {
    "public": "dist",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "**/*.@(js|css)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "public, max-age=31536000, immutable"
          }
        ]
      },
      {
        "source": "sw.js",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "no-cache"
          }
        ]
      }
    ]
  }
}
```

#### Deploy
```bash
# Build and deploy
npm run build
firebase deploy --only hosting

# Or deploy to specific project
firebase deploy --only hosting --project your-project-id
```

### Option 2: Vercel

#### Setup
```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login
```

#### Deploy
```bash
# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

Vercel configuration (`vercel.json`):
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

### Option 3: Netlify

#### Setup
Create `netlify.toml`:
```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/*.js"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "/*.css"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "/sw.js"
  [headers.values]
    Cache-Control = "no-cache"
```

#### Deploy
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Deploy
netlify deploy --prod --dir=dist
```

### Option 4: Static Hosting (AWS S3, GitHub Pages, etc.)

1. Build the application:
   ```bash
   npm run build
   ```

2. Upload the `dist/` directory contents to your hosting provider

3. Configure redirects:
   - All routes should redirect to `index.html` for client-side routing
   - Set appropriate cache headers for static assets

## Data Migration

If migrating from the vanilla JavaScript version:

### 1. Export Old Data

Before deploying, export existing habit data from the old app:
```javascript
// Run in browser console on OLD app
const data = localStorage.getItem('momentum-habits');
console.log(data);
// Copy the output
```

### 2. Import to New App

After deploying the React app and logging in:
```javascript
// Run in browser console on NEW app
// The migration script is available globally
migrateLocalStorageToFirebase(userId);
```

Or manually import:
```javascript
// After logging in, get your user ID
const user = auth.currentUser;
const userId = user.uid;

// Run migration
migrateLocalStorageToFirebase(userId);
```

### 3. Backup and Verify

```javascript
// Export current data as backup
exportHabitsToJSON();

// Check migrated data in Firebase Console
// Go to Firestore Database → habits collection
```

## Environment Variables

Create `.env.production` for production environment:

```env
# Firebase Config
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Optional: Analytics
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

**Important**: Never commit `.env` files with real credentials to version control!

## Post-Deployment Checklist

- [ ] Test all pages load correctly
- [ ] Verify authentication flow (login/logout)
- [ ] Test habit CRUD operations
- [ ] Verify data syncs with Firebase
- [ ] Test PWA installation (Add to Home Screen)
- [ ] Check offline functionality
- [ ] Test on mobile devices
- [ ] Verify analytics (if configured)
- [ ] Test data migration (if applicable)
- [ ] Monitor Firebase usage and quotas

## PWA Features

The app includes PWA capabilities:

### Installation
Users can install the app:
- Chrome: "Add to Home Screen" or "Install" button
- Safari: Share → "Add to Home Screen"
- Edge: Settings → "Install Momentum"

### Offline Support
- Service worker caches static assets
- App works offline with last synced data
- Automatic updates when online

### Cache Strategy
- **Static assets**: Cache-first with 1-year expiration
- **Google Fonts**: Cache-first with 1-year expiration
- **Firebase Storage**: Cache-first with 30-day expiration
- **API calls**: Network-first (default)

## Performance Optimization

The build includes several optimizations:

1. **Code Splitting**: Pages and modals are lazy-loaded
2. **Tree Shaking**: Unused code is removed
3. **Minification**: JavaScript and CSS are minified
4. **Manual Chunks**: Vendors are split for better caching
5. **Asset Optimization**: Images and fonts are optimized
6. **Preloading**: Critical resources are preloaded

## Monitoring and Analytics

### Firebase Analytics Setup

Add to `src/services/firebase.ts`:
```typescript
import { getAnalytics } from 'firebase/analytics';

export const analytics = getAnalytics(app);
```

### Error Tracking

Consider adding:
- Sentry for error tracking
- LogRocket for session replay
- Firebase Performance Monitoring

## Troubleshooting

### Build Failures

**TypeScript errors**:
```bash
npx tsc -b --force
```

**Missing dependencies**:
```bash
rm -rf node_modules package-lock.json
npm install
```

**Cache issues**:
```bash
rm -rf dist node_modules/.vite
npm run build
```

### Deployment Issues

**404 on page refresh**:
- Configure SPA redirects (all routes → index.html)

**Assets not loading**:
- Check base URL in vite.config.ts
- Verify asset paths are relative

**PWA not updating**:
- Clear service worker cache
- Update version in manifest
- Force refresh (Ctrl+Shift+R)

## Continuous Deployment

### GitHub Actions Example

Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to Firebase

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Deploy to Firebase
        uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
          channelId: live
          projectId: your-project-id
```

## Security Considerations

1. **API Keys**: Use environment variables, never hardcode
2. **Firebase Rules**: Restrict Firestore access to authenticated users
3. **CORS**: Configure Firebase to allow your domain only
4. **HTTPS**: Always deploy with HTTPS enabled
5. **CSP**: Consider adding Content Security Policy headers

## Scaling

As your app grows:
- Monitor Firebase quotas and billing
- Consider Firebase Functions for backend logic
- Implement rate limiting for API calls
- Use Firebase Performance Monitoring
- Optimize Firestore queries and indexes

## Support

For issues or questions:
- Check the README.md for development setup
- Review the migration guide above
- Open an issue on GitHub
- Contact the development team

---

**Last Updated**: 2025-11-13
**Version**: 1.0.0
