/**
 * App: declares Gather's public, protected, and fallback routes plus the shared page shell.
 * Mounted by main.jsx inside the router and application providers.
 */
import { useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import CalendarPage from './pages/CalendarPage';
import Dashboard from './pages/Dashboard';
import EventDetail from './pages/EventDetail';
import MyTasks from './pages/MyTasks';
import NotFound from './pages/NotFound';
import PublicEvent from './pages/PublicEvent';
import WelcomePage from './pages/WelcomePage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import NewEventPage from './pages/NewEventPage';
import ProtectedRoute from './components/ProtectedRoute';
import PublicOnlyRoute from './components/PublicOnlyRoute';
import DemoBanner from './components/DemoBanner';
import { useAuth } from './context/AuthContext';

/** Moves focus to <main> and scrolls to top on navigation (screen-reader & keyboard friendly). */
function RouteAnnouncer() {
  const { pathname } = useLocation();
  // On pathname changes, return focus to main content and reset scroll for the new route.
  useEffect(() => {
    window.scrollTo(0, 0);
    document.getElementById('main')?.focus({ preventScroll: true });
  }, [pathname]);
  return null;
}

/**
 * Routes
 *   /              Welcome
 *   /dashboard     Dashboard (search, filters, create)
 *   /events/:id    Event workspace (role-aware: attendees, tasks, comments, edit)
 *   /event/:id     Public guest page - the shareable URL
 *   /calendar      Month / week / agenda
 *   /tasks         My Tasks across all events
 */
export default function App() {
  const { isDemoMode } = useAuth();

  return (
    <>
      <a href="#main" className="skip-link">Skip to content</a>
      {/* Keep the demo notice in normal flow above the sticky navbar. */}
      <DemoBanner />
      <Navbar />
      <RouteAnnouncer />
      <main id="main" tabIndex={-1}>
        <Routes>
          {/* Public landing page; available to every visitor. */}
          <Route path="/" element={<WelcomePage />} />
          {/* Legacy welcome URL redirects to the canonical landing page. */}
          <Route path="/welcome" element={<Navigate to="/" replace />} />
          {/* Public login page; account-add mode is allowed by PublicOnlyRoute. */}
          <Route path="/login" element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
          {/* Public sign-up page; authenticated visitors are redirected by PublicOnlyRoute. */}
          <Route path="/signup" element={<PublicOnlyRoute><SignupPage /></PublicOnlyRoute>} />
          {/* Protected event dashboard. */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          {/* Protected new-event form. */}
          <Route path="/events/new" element={<ProtectedRoute><NewEventPage /></ProtectedRoute>} />
          {/* Protected event-management workspace. */}
          <Route path="/events/:id" element={<ProtectedRoute><EventDetail /></ProtectedRoute>} />
          {/* Shareable guest-facing event view; does not require authentication. */}
          <Route path="/event/:id" element={<PublicEvent />} />
          {/* Protected event calendar. */}
          <Route path="/calendar" element={<ProtectedRoute><CalendarPage /></ProtectedRoute>} />
          {/* Protected tasks assigned to the active account. */}
          <Route path="/tasks" element={<ProtectedRoute><MyTasks /></ProtectedRoute>} />
          {/* Keep unmatched URLs on the existing not-found page. */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <footer className="site-footer">
        Gather
        {isDemoMode && <p>Demo data is stored in your browser&apos;s localStorage.</p>}
      </footer>
    </>
  );
}
