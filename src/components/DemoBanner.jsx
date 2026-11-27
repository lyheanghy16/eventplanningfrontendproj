/**
 * DemoBanner: dismissible notice shown above protected pages for the active demo account.
 * Reads AuthContext, keeps dismissal for this browser session, and offers signup/exit actions.
 */
import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

// gather_demo_banner_dismissed stores "true" in sessionStorage for this browser session only.
const DISMISSED_KEY = 'gather_demo_banner_dismissed';

function isProtectedPath(pathname) {
  return pathname === '/dashboard'
    || pathname === '/calendar'
    || pathname === '/tasks'
    || pathname === '/events/new'
    || /^\/events\/[^/]+$/.test(pathname);
}

/**
 * Displays only on protected routes while the active profile is a demo account.
 * Dismissing persists for the session; switching into a demo account makes it visible again.
 */
export default function DemoBanner() {
  const { currentUser, isDemoMode, loading, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();
  const [dismissed, setDismissed] = useState(false);
  const initializedRef = useRef(false);
  const previousUserIdRef = useRef(null);

  // Restore the session dismissal once auth is ready; later demo-account switches clear it.
  useEffect(() => {
    if (loading) return;

    const userId = currentUser?.id ?? null;
    if (!initializedRef.current) {
      initializedRef.current = true;
      previousUserIdRef.current = userId;
      try {
        setDismissed(window.sessionStorage.getItem(DISMISSED_KEY) === 'true');
      } catch (error) {
        console.error('Unable to read the demo banner dismissal state.', error);
        toast.error('The demo banner preference could not be restored.');
      }
      return;
    }

    if (userId !== previousUserIdRef.current && isDemoMode) {
      try {
        window.sessionStorage.removeItem(DISMISSED_KEY);
      } catch (error) {
        console.error('Unable to reset the demo banner dismissal state.', error);
        toast.error('The demo banner preference could not be reset.');
      }
      setDismissed(false);
    }
    previousUserIdRef.current = userId;
  }, [loading, currentUser?.id, isDemoMode, toast]);

  function dismiss() {
    try {
      window.sessionStorage.setItem(DISMISSED_KEY, 'true');
    } catch (error) {
      console.error('Unable to save the demo banner dismissal state.', error);
      toast.error('The demo banner could not be dismissed for this session.');
    }
    setDismissed(true);
  }

  function exitDemo() {
    logout();
    navigate('/', { replace: true });
  }

  if (!isDemoMode || !isProtectedPath(location.pathname) || dismissed) return null;

  return (
    <aside className="demo-banner" role="status">
      <div className="demo-banner-inner">
        <p className="demo-banner-message">
          🧪 You&apos;re in demo mode. This is sample data stored in your browser only. Sign up to create your own account.
        </p>
        <div className="demo-banner-actions">
          <Link className="btn demo-banner-signup" to="/signup?add=1">Sign up</Link>
          <button className="btn demo-banner-exit" type="button" onClick={exitDemo}>Exit demo</button>
        </div>
        <button
          className="icon-btn demo-banner-close"
          type="button"
          aria-label="Dismiss demo mode notice for this session"
          onClick={dismiss}
        >
          ×
        </button>
      </div>
    </aside>
  );
}
