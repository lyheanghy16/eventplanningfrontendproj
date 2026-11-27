/**
 * Dashboard: searches and filters events visible to the active account.
 * Routed at /dashboard; uses AuthContext and EventContext.
 */
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import EmptyState from '../components/EmptyState';
import EventCard from '../components/EventCard';
import SegmentedControl from '../components/SegmentedControl';
import { SkeletonGrid } from '../components/Skeleton';
import { useAuth } from '../context/AuthContext';
import { useEvents } from '../context/EventContext';
import useDocumentTitle from '../hooks/useDocumentTitle';
import {
  ROLES,
  canSeeEvent,
  getEventStats,
  getRole,
  getUserRsvp,
  isEventPast,
} from '../utils/eventHelpers';

const FILTERS = [
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'past', label: 'Past' },
  { value: 'hosting', label: 'Hosting' },
  { value: 'attending', label: 'Attending' },
  { value: 'all', label: 'All' },
];

/**
 * Page-level query and filter state reset when the active account changes.
 * Event ownership, RSVP, and role data are derived from currentUser and EventContext.
 */
export default function Dashboard() {
  useDocumentTitle('Dashboard');

  const { status, error, events, rsvps } = useEvents();
  const { currentUser } = useAuth();

  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('upcoming');

  // Reset account-specific dashboard state when the user changes.
  useEffect(() => {
    setQuery('');
    setFilter('upcoming');
  }, [currentUser?.id]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();

    return events
      .filter((event) => canSeeEvent(event, currentUser, rsvps))
      .map((event) => {
        const role = getRole(event, currentUser?.id);
        const rsvp = getUserRsvp(event, currentUser, rsvps);

        return {
          event,
          role,
          rsvp,
          stats: getEventStats(event, rsvps),
        };
      })
      .filter(({ event, role, rsvp }) => {
        // POLISHED: Safely combine searchable event information.
        const haystack = [
          event.title,
          event.description,
          event.location,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        if (q && !haystack.includes(q)) return false;

        const past = isEventPast(event);

        switch (filter) {
          case 'upcoming':
            return !past;
          case 'past':
            return past;
          case 'hosting':
            return role !== ROLES.GUEST;
          case 'attending':
            return !!rsvp && rsvp.status !== 'declined' && role === ROLES.GUEST;
          default:
            return true;
        }
      })
      .sort((a, b) => {
        const diff = new Date(a.event.start) - new Date(b.event.start);
        return filter === 'past' ? -diff : diff;
      });
  }, [events, rsvps, currentUser, query, filter]);

  const hasPersonalEvents = rows.some(
    ({ role, rsvp }) => role !== ROLES.GUEST || !!rsvp,
  );

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Events</h1>
          <p className="muted">
            {currentUser
              ? `Welcome back, ${currentUser.name?.split(' ')[0] || 'there'}.`
              : 'Browsing as a public guest.'}
          </p>
        </div>

        {currentUser && (
          <Link to="/events/new" className="btn btn--primary">
            + New event
          </Link>
        )}
      </div>

      <div className="toolbar">
        <div className="search">
          <label htmlFor="event-search" className="sr-only">
            Search events
          </label>
          <input
            id="event-search"
            type="search"
            placeholder="Search events by title, description, or location…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <SegmentedControl
          label="Filter events"
          options={FILTERS}
          value={filter}
          onChange={setFilter}
        />
      </div>

      {status === 'loading' && <SkeletonGrid />}

      {status === 'error' && (
        <EmptyState icon="⚠️" title="Couldn't load events">
          {error}
        </EmptyState>
      )}

      {status === 'ready' && rows.length === 0 && (
        <EmptyState
          icon={query ? '🔍' : '🎈'}
          title={query ? 'No events match your search' : 'No events here yet'}
          action={
            !query && currentUser ? (
              <Link to="/events/new" className="btn btn--primary">
                Create an event
              </Link>
            ) : query ? (
              <button
                type="button"
                className="btn"
                onClick={() => setQuery('')}
              >
                Clear search
              </button>
            ) : null
          }
        >
          {query
            ? 'Try different keywords or another filter.'
            : filter === 'hosting'
              ? "You're not hosting any events."
              : filter === 'attending'
                ? "You haven't RSVP'd to any events."
                : 'Nothing in this view.'}
        </EmptyState>
      )}

      {status === 'ready' && rows.length > 0 && !hasPersonalEvents && !query && (
        <EmptyState
          icon="🎈"
          title="Create your first event"
          action={
            <Link to="/events/new" className="btn btn--primary">
              Create an event
            </Link>
          }
        >
          You do not have any events yet. Start a plan and invite people to gather.
        </EmptyState>
      )}

      {status === 'ready' && rows.length > 0 && (hasPersonalEvents || query) && (
        <>
          <p className="sr-only" role="status">
            {rows.length} events shown
          </p>

          <div className="card-grid">
            {rows.map(({ event, role, rsvp, stats }) => (
              <EventCard
                key={event.id}
                event={event}
                role={role}
                stats={stats}
                rsvp={rsvp}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}