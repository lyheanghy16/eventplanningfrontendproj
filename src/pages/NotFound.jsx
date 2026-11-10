import { Link } from 'react-router-dom';
import EmptyState from '../components/EmptyState';
import useDocumentTitle from '../hooks/useDocumentTitle';

export default function NotFound() {
  useDocumentTitle('Page not found');
  return (
    <div className="page">
      <EmptyState icon="🧭" title="Page not found" action={<Link to="/" className="btn btn--primary">Back to dashboard</Link>}>
        The page you are looking for doesn&apos;t exist.
      </EmptyState>
    </div>
  );
}
