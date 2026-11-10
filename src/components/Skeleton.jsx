import PropTypes from 'prop-types';

/** Loading placeholders. Hidden from assistive tech; the wrapper announces "Loading". */
export function EventCardSkeleton() {
  return (
    <div className="event-card skeleton-card" aria-hidden="true">
      <div className="skeleton skeleton-cover" />
      <div className="event-card-body">
        <div className="skeleton skeleton-line" style={{ width: '40%' }} />
        <div className="skeleton skeleton-line skeleton-line--lg" style={{ width: '85%' }} />
        <div className="skeleton skeleton-line" style={{ width: '65%' }} />
        <div className="skeleton skeleton-line" style={{ width: '50%' }} />
      </div>
    </div>
  );
}

export function SkeletonGrid({ count = 6 }) {
  return (
    <div className="card-grid" role="status" aria-label="Loading events">
      {Array.from({ length: count }, (_, i) => (
        <EventCardSkeleton key={i} />
      ))}
    </div>
  );
}

SkeletonGrid.propTypes = { count: PropTypes.number };

export function PageSkeleton() {
  return (
    <div className="page" role="status" aria-label="Loading">
      <div className="skeleton skeleton-cover skeleton-cover--tall" />
      <div className="skeleton skeleton-line skeleton-line--lg" style={{ width: '45%', marginTop: 16 }} />
      <div className="skeleton skeleton-line" style={{ width: '70%' }} />
      <div className="skeleton skeleton-line" style={{ width: '60%' }} />
    </div>
  );
}
