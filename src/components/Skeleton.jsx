/**
 * Skeleton: lightweight loading placeholders for event cards and page content.
 * Used by Dashboard, CalendarPage, EventDetail, and MyTasks while data loads.
 */
import PropTypes from 'prop-types';

/** EventCardSkeleton renders one decorative loading card; its grid wrapper announces loading. */
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

/** SkeletonGrid renders `count` event-card placeholders while event lists load. */
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

/** PageSkeleton renders a large placeholder for a page-level event detail load. */
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
