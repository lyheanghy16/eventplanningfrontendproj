/**
 * SignupPage: validates account details, creates a user, and returns to a requested route.
 * Routed at /signup; AuthContext stores the new account and ToastContext confirms success.
 */
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import useDocumentTitle from '../hooks/useDocumentTitle';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Local form/error/visibility/progress state keeps credentials transient while editing.
 * On success signup persists the account, then this page redirects and announces the welcome.
 */
export default function SignupPage() {
  useDocumentTitle('Sign up');
  const navigate = useNavigate();
  const location = useLocation();
  const { signup, users } = useAuth();
  const toast = useToast();
  // Keep account fields and validation UI local; AuthContext persists only the resulting user/hash.
  const [values, setValues] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const set = (name) => (event) => setValues((current) => ({ ...current, [name]: event.target.value }));

  function validate() {
    const next = {};
    if (!values.name.trim()) next.name = 'Full name is required.';
    if (!values.email.trim()) next.email = 'Email is required.';
    else if (!emailPattern.test(values.email.trim())) next.email = 'Enter a valid email address.';
    else if (users.some((user) => user.email.toLowerCase() === values.email.trim().toLowerCase())) next.email = 'This email is already registered.';
    if (!values.password) next.password = 'Password is required.';
    else if (values.password.length < 8) next.password = 'Password must be at least 8 characters.';
    if (!values.confirmPassword) next.confirmPassword = 'Please confirm your password.';
    else if (values.password !== values.confirmPassword) next.confirmPassword = 'Passwords do not match.';
    return next;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const next = validate();
    setErrors(next);
    if (Object.keys(next).length) return;
    setSubmitting(true);
    try {
      const user = await signup(values);
      toast.success(`Welcome to Gather, ${user.name.split(/\s+/)[0]}!`);
      navigate(location.state?.from
        ? `${location.state.from.pathname}${location.state.from.search || ''}${location.state.from.hash || ''}`
        : '/dashboard', { replace: true });
    } catch (error) {
      setErrors(error.message === 'EMAIL_EXISTS'
        ? { email: 'This email is already registered.' }
        : { form: error.code === 'SECURE_CONTEXT_REQUIRED'
          ? 'Secure context required. Open Gather over HTTPS or localhost to create an account.'
          : error.message || 'Could not create your account. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <section className="auth-card" aria-labelledby="signup-title">
        <h1 id="signup-title">Create your account</h1>
        {errors.form && <p className="auth-error" role="alert">{errors.form}</p>}
        <form onSubmit={handleSubmit} noValidate>
          {[
            ['name', 'Full name', 'text', 'name'],
            ['email', 'Email', 'email', 'email'],
          ].map(([field, label, type, autoComplete]) => (
            <div className="field" key={field}>
              <label htmlFor={`signup-${field}`}>{label}</label>
              <input
                id={`signup-${field}`}
                type={type}
                autoComplete={autoComplete}
                value={values[field]}
                onChange={set(field)}
                aria-invalid={!!errors[field]}
                aria-describedby={errors[field] ? `signup-${field}-error` : undefined}
              />
              {errors[field] && <p className="field-error" id={`signup-${field}-error`}>{errors[field]}</p>}
            </div>
          ))}
          {[
            ['password', 'Password'],
            ['confirmPassword', 'Confirm password'],
          ].map(([field, label]) => (
            <div className="field" key={field}>
              <label htmlFor={`signup-${field}`}>{label}</label>
              <div className="password-input">
                <input
                  id={`signup-${field}`}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={field === 'password' ? 'new-password' : 'new-password'}
                  value={values[field]}
                  onChange={set(field)}
                  aria-invalid={!!errors[field]}
                  aria-describedby={errors[field] ? `signup-${field}-error` : undefined}
                />
                {field === 'password' && (
                  <button type="button" className="password-toggle" onClick={() => setShowPassword((shown) => !shown)}>
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                )}
              </div>
              {errors[field] && <p className="field-error" id={`signup-${field}-error`}>{errors[field]}</p>}
            </div>
          ))}
          <button className="btn btn--primary auth-submit" type="submit" disabled={submitting}>
            {submitting ? <><span className="spinner spinner--sm" aria-hidden="true" /> Creating account…</> : 'Sign up'}
          </button>
        </form>
        <p className="auth-link">Already have an account? <Link to="/login" state={{ from: location.state?.from }}>Log in</Link></p>
      </section>
    </div>
  );
}
