import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { PrivateRoute } from './components/auth';
import { AppLayout } from './components/layout';
import { Loading } from './components/common';

// Lazy load pages for code splitting
const LoginPage = lazy(() => import('./pages/LoginPage').then(module => ({ default: module.LoginPage })));
const HabitsPage = lazy(() => import('./pages/HabitsPage').then(module => ({ default: module.HabitsPage })));
const ArchivePage = lazy(() => import('./pages/ArchivePage').then(module => ({ default: module.ArchivePage })));
const SettingsPage = lazy(() => import('./pages/SettingsPage').then(module => ({ default: module.SettingsPage })));

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<Loading fullScreen text="Loading..." />}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route
            path="/app"
            element={
              <PrivateRoute>
                <AppLayout />
              </PrivateRoute>
            }
          >
            <Route index element={<HabitsPage />} />
            <Route path="archive" element={<ArchivePage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/app" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
