/**
 * NotFound: fallback page for unmatched URLs with a dashboard navigation action.
 * Routed by App's catch-all route.
 */
import { Link } from 'react-router-dom';
import EmptyState from '../components/EmptyState';
import useDocumentTitle from '../hooks/useDocumentTitle';

/** Sets a page title and renders the shared not-found empty state. */
export default function NotFound() {
  useDocumentTitle('Page not found');
  return (
    <div className="page">
      <EmptyState icon="🧭" title="Page not found" action={<Link to="/dashboard" className="btn btn--primary">Back to dashboard</Link>}>
        The page you are looking for doesn&apos;t exist.
      </EmptyState>
    </div>
  );
}
