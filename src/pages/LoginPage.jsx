/**
 * LoginPage: authenticates an account, supports remember-me, and preserves protected destinations.
 * Routed at /login; AuthContext handles login/demo activation and account switching.
 */
import { useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import useDocumentTitle from '../hooks/useDocumentTitle';

/**
 * Form state holds credentials, generic feedback, and submit progress.
 * Login redirects to the attempted route or dashboard; the demo action is handled by AuthContext.
 */
export default function LoginPage() {
  useDocumentTitle('Log in');
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const adding = searchParams.get('add') === '1';
  const { login, loginAsDemo, accounts, switchAccount, loading } = useAuth();
  // Credentials and remember preference stay in component state; only the session choice is persisted.
  const [values, setValues] = useState({ email: '', password: '', remember: true });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const set = (name) => (event) =>
    setValues((current) => ({ ...current, [name]: event.target.type === 'checkbox' ? event.target.checked : event.target.value }));

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(values);
      const requested = location.state?.from;
      navigate(requested ? `${requested.pathname}${requested.search || ''}${requested.hash || ''}` : '/dashboard', { replace: true });
    } catch (error) {
      setError(error.code === 'SECURE_CONTEXT_REQUIRED'
        ? 'Secure context required. Open Gather over HTTPS or localhost to log in.'
        : 'Incorrect email or password');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <section className="auth-card" aria-labelledby="login-title">
        <h1 id="login-title">{adding ? 'Add another account' : 'Log in to Gather'}</h1>
        {adding && accounts.length > 0 && (
          <div className="continue-list">
            <p className="muted">Continue as</p>
            {accounts.map((account) => (
              <button
                type="button"
                className="continue-account"
                key={account.id}
                onClick={() => {
                  switchAccount(account.id);
                  navigate(location.state?.from
                    ? `${location.state.from.pathname}${location.state.from.search || ''}${location.state.from.hash || ''}`
                    : '/dashboard', { replace: true });
                }}
              >
                <span><strong>{account.name}</strong><small>{account.email}</small></span>
              </button>
            ))}
          </div>
        )}
        {error && <p className="auth-error" role="alert">{error}</p>}
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="login-email">Email</label>
            <input id="login-email" type="email" autoComplete="email" value={values.email} onChange={set('email')} aria-invalid={!!error} />
          </div>
          <div className="field">
            <label htmlFor="login-password">Password</label>
            <input id="login-password" type="password" autoComplete="current-password" value={values.password} onChange={set('password')} aria-invalid={!!error} />
          </div>
          <label className="auth-check">
            <input type="checkbox" checked={values.remember} onChange={set('remember')} />
            Remember me
          </label>
          <button className="btn btn--primary auth-submit" type="submit" disabled={submitting}>
            {submitting ? <><span className="spinner spinner--sm" aria-hidden="true" /> Logging in…</> : 'Log in'}
          </button>
        </form>
        <button className="btn auth-demo" type="button" onClick={loginAsDemo} disabled={submitting || loading}>Try the demo</button>
        {adding
          ? <p className="auth-link"><Link to={location.state?.from?.pathname || '/dashboard'}>Cancel</Link></p>
          : <p className="auth-link">New here? <Link to="/signup" state={{ from: location.state?.from }}>Create an account</Link></p>}
      </section>
    </div>
  );
}
