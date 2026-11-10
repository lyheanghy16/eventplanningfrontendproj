import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import EmptyState from '../components/EmptyState';
import EventCard from '../components/EventCard';
import EventForm from '../components/EventForm';
import Modal from '../components/Modal';
import SegmentedControl from '../components/SegmentedControl';
import { SkeletonGrid } from '../components/Skeleton';
import { useAuth } from '../context/AuthContext';
import { useEvents } from '../context/EventContext';
import { useToast } from '../context/ToastContext';
import useDocumentTitle from '../hooks/useDocumentTitle';
import {
  ROLES, canSeeEvent, getEventStats, getRole, getUserRsvp, isEventPast,
} from '../utils/eventHelpers';

const FILTERS = [
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'past', label: 'Past' },
  { value: 'hosting', label: 'Hosting' },
  { value: 'attending', label: 'Attending' },
  { value: 'all', label: 'All' },
];

/** Home: search + filter your events and create new ones. */
export default function Dashboard() {
  useDocumentTitle('Dashboard');
  const navigate = useNavigate();
  const toast = useToast();
  const { status, error, events, rsvps, createEvent } = useEvents();
  const { currentUser } = useAuth();

  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('upcoming');
  const [creating, setCreating] = useState(false);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return events
      .filter((event) => canSeeEvent(event, currentUser, rsvps))
      .map((event) => {
        const role = getRole(event, currentUser?.id);
        const rsvp = getUserRsvp(event, currentUser, rsvps);
        return { event, role, rsvp, stats: getEventStats(event, rsvps) };
      })
      .filter(({ event, role, rsvp }) => {
        if (q) {
          const haystack = `${event.title} ${event.description} ${event.location}`.toLowerCase();
          if (!haystack.includes(q)) return false;
        }
        const past = isEventPast(event);
        switch (filter) {
          case 'upcoming': return !past;
          case 'past': return past;
          case 'hosting': return role !== ROLES.GUEST;
          // "Attending" = you RSVP'd going/maybe and you're not running it yourself.
          case 'attending': return !!rsvp && rsvp.status !== 'declined' && role === ROLES.GUEST;
          default: return true;
        }
      })
      .sort((a, b) => {
        const diff = new Date(a.event.start) - new Date(b.event.start);
        return filter === 'past' ? -diff : diff; // newest first for past events
      });
  }, [events, rsvps, currentUser, query, filter]);

  function handleCreate(values) {
    const created = createEvent(values, currentUser.id);
    setCreating(false);
    toast.success(`"${created.title}" created`);
    navigate(`/events/${created.id}`);
  }

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Events</h1>
          <p className="muted">
            {currentUser ? `Welcome back, ${currentUser.name.split(' ')[0]}.` : 'Browsing as a public guest.'}
          </p>
        </div>
        {currentUser && (
          <button type="button" className="btn btn--primary" onClick={() => setCreating(true)}>
            + New event
          </button>
        )}
      </div>

      <div className="toolbar">
        <div className="search">
          <label htmlFor="event-search" className="sr-only">Search events</label>
          <input
            id="event-search"
            type="search"
            placeholder="Search by title, description or place…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <SegmentedControl label="Filter events" options={FILTERS} value={filter} onChange={setFilter} />
      </div>

      {status === 'loading' && <SkeletonGrid />}

      {status === 'error' && (
        <EmptyState icon="⚠️" title="Couldn't load events">{error}</EmptyState>
      )}

      {status === 'ready' && rows.length === 0 && (
        <EmptyState
          icon={query ? '🔍' : '🎈'}
          title={query ? 'No events match your search' : 'No events here yet'}
          action={
            !query && currentUser ? (
              <button type="button" className="btn btn--primary" onClick={() => setCreating(true)}>Create an event</button>
            ) : query ? (
              <button type="button" className="btn" onClick={() => setQuery('')}>Clear search</button>
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

      {status === 'ready' && rows.length > 0 && (
        <>
          <p className="sr-only" role="status">{rows.length} events shown</p>
          <div className="card-grid">
            {rows.map(({ event, role, rsvp, stats }) => (
              <EventCard key={event.id} event={event} role={role} stats={stats} rsvp={rsvp} />
            ))}
          </div>
        </>
      )}

      {creating && (
        <Modal title="Create event" onClose={() => setCreating(false)} size="lg">
          <EventForm submitLabel="Create event" onSubmit={handleCreate} onCancel={() => setCreating(false)} />
        </Modal>
      )}
    </div>
  );
}
