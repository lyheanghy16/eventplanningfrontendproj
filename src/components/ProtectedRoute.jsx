/**
 * ProtectedRoute: gates a route until session restoration completes.
 * Used by App around Dashboard, calendar, task, and event-management pages.
 */
import PropTypes from 'prop-types';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Props: children is the protected page. AuthContext supplies loading/authentication state;
 * unauthenticated visitors are sent to login with their requested location in router state.
 */
export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="auth-loading" role="status" aria-live="polite">
        <span className="spinner" aria-hidden="true" /> Restoring your session…
      </div>
    );
  }
  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location }}
      />
    );
  }
  return children;
}

ProtectedRoute.propTypes = { children: PropTypes.node.isRequired };
