/**
 * WelcomePage: public landing page with feature highlights and account entry actions.
 * Rendered at /; logged-in visitors can continue to the dashboard or switch accounts.
 */
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AccountSwitcher from '../components/AccountSwitcher';
import DemoBadge from '../components/DemoBadge';
import useDocumentTitle from '../hooks/useDocumentTitle';

/** AuthContext determines whether visitors see sign-up/demo actions or continue/switch actions. */
export default function WelcomePage() {
  useDocumentTitle('Welcome to Gather');
  const { loginAsDemo, isAuthenticated, currentUser, isDemoMode, loading } = useAuth();

  const features = [
    ['🎟️', 'RSVPs and waitlists', 'Track going, maybe and declined responses with automatic waitlist promotion.'],
    ['🗓️', 'Calendar views', 'Switch between month, week and agenda views, then export events as .ics.'],
    ['✅', 'Shared task lists', 'Assign work to co-hosts and keep launch plans moving together.'],
    ['🔒', 'Private events', 'Keep planning private while sharing a public link with selected guests.'],
  ];

  return (
    <div className="welcome-page">
      <section className="welcome-hero">
        <span className="welcome-logo" aria-hidden="true">🎉</span>
        <h1>Plan events. Share tasks. Gather people.</h1>
        <p>One place to organize guests, schedules and every detail that makes an event memorable.</p>
        <div className="welcome-actions">
          {isAuthenticated ? (
            <>
              <Link className="btn btn--primary" to="/dashboard">
                Continue as {currentUser.name}{isDemoMode && <DemoBadge />}
              </Link>
              <AccountSwitcher triggerLabel="Switch account" compact />
            </>
          ) : (
            <>
              <Link className="btn btn--primary" to="/signup">Sign up</Link>
              <Link className="btn" to="/login">Log in</Link>
              <button className="btn btn--ghost" type="button" onClick={loginAsDemo} disabled={loading}>Try the demo</button>
            </>
          )}
        </div>
      </section>
      <section className="welcome-features" aria-label="Gather features">
        {features.map(([icon, title, text]) => (
          <article className="feature-card" key={title}>
            <span aria-hidden="true">{icon}</span>
            <h2>{title}</h2>
            <p>{text}</p>
          </article>
        ))}
      </section>
      <footer className="welcome-footer">Gather · Your next event starts here.</footer>
    </div>
  );
}
