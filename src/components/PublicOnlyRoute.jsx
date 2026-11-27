/**
 * PublicOnlyRoute: redirects authenticated visitors away from login/signup pages.
 * Used by App; the add-account query allows an active user to open the login form.
 */
import PropTypes from 'prop-types';
import { Navigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Props: children is the public auth page. AuthContext controls the loading screen and
 * authenticated redirect; `?add=1` intentionally keeps the account-add flow available.
 */
export default function PublicOnlyRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const [searchParams] = useSearchParams();
  if (loading) {
    return (
      <div className="auth-loading" role="status" aria-live="polite">
        <span className="spinner" aria-hidden="true" /> Loading…
      </div>
    );
  }
  if (searchParams.get('add') === '1') return children;
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children;
}

PublicOnlyRoute.propTypes = { children: PropTypes.node.isRequired };
