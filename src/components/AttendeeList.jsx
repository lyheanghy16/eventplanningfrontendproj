import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { eventShape, rsvpShape, statsShape } from '../propTypes';
import { formatTimeAgo } from '../utils/dateHelpers';
import { RSVP_LABELS } from '../utils/eventHelpers';
import Avatar from './Avatar';
import Badge from './Badge';
import EmptyState from './EmptyState';
import SegmentedControl from './SegmentedControl';

const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'going', label: 'Going' },
  { value: 'waitlist', label: 'Waitlist' },
  { value: 'maybe', label: 'Maybe' },
  { value: 'declined', label: "Can't go" },
];

/**
 * Host/co-host view of everyone who responded: live counts, capacity meter and a filterable
 * table. Updates instantly when RSVPs change here or in another tab.
 */
export default function AttendeeList({ event, stats, canRemove = false, onRemove = () => {} }) {
  const [filter, setFilter] = useState('all');

  const rows = useMemo(() => {
    const groups = {
      going: stats.going,
      waitlist: stats.waitlist,
      maybe: stats.maybe,
      declined: stats.declined,
    };
    const list = filter === 'all' ? [...stats.going, ...stats.waitlist, ...stats.maybe, ...stats.declined] : groups[filter];
    return list;
  }, [stats, filter]);

  const percent = stats.capacity > 0 ? Math.min(100, Math.round((stats.seatsTaken / stats.capacity) * 100)) : 0;

  return (
    <div>
      <div className="stat-row" aria-live="polite" aria-atomic="true">
        <div className="stat"><strong>{stats.seatsTaken}</strong><span>Going (seats)</span></div>
        <div className="stat"><strong>{stats.maybe.length}</strong><span>Maybe</span></div>
        <div className="stat"><strong>{stats.declined.length}</strong><span>Can&apos;t go</span></div>
        <div className="stat"><strong>{stats.waitlist.length}</strong><span>Waitlist</span></div>
        <span className="live-pill"><span className="live-dot" aria-hidden="true" /> Live</span>
      </div>

      {stats.capacity > 0 && (
        <div className="meter-wrap">
          <div
            className="meter"
            role="progressbar"
            aria-label="Seats filled"
            aria-valuemin={0}
            aria-valuemax={stats.capacity}
            aria-valuenow={Math.min(stats.seatsTaken, stats.capacity)}
          >
            <div className={`meter-fill ${stats.isFull ? 'is-full' : ''}`} style={{ width: `${percent}%` }} />
          </div>
          <p className="meter-label">{stats.seatsTaken} of {event.capacity} seats filled</p>
        </div>
      )}

      <SegmentedControl label="Filter attendees" options={FILTERS} value={filter} onChange={setFilter} />

      {rows.length === 0 ? (
        <EmptyState icon="🙋" title="No responses here yet">
          Share the event link to start collecting RSVPs.
        </EmptyState>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <caption className="sr-only">Attendees for {event.title}</caption>
            <thead>
              <tr>
                <th scope="col">Guest</th>
                <th scope="col">Response</th>
                <th scope="col">Party</th>
                <th scope="col">Responded</th>
                {canRemove && <th scope="col"><span className="sr-only">Actions</span></th>}
              </tr>
            </thead>
            <tbody>
              {rows.map((rsvp) => (
                <tr key={rsvp.id}>
                  <td>
                    <div className="person">
                      <Avatar name={rsvp.name} size={30} />
                      <div>
                        <strong>{rsvp.name}</strong>
                        <div className="muted small">{rsvp.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    {rsvp.status === 'going' && rsvp.waitlisted ? (
                      <Badge tone="warn">Waitlisted</Badge>
                    ) : (
                      <Badge tone={rsvp.status === 'going' ? 'success' : rsvp.status === 'maybe' ? 'primary' : 'neutral'}>
                        {RSVP_LABELS[rsvp.status]}
                      </Badge>
                    )}
                  </td>
                  <td>{rsvp.status === 'declined' ? '–' : 1 + (rsvp.plusOnes || 0)}</td>
                  <td className="muted">{formatTimeAgo(rsvp.createdAt)}</td>
                  {canRemove && (
                    <td className="cell-actions">
                      <button
                        type="button"
                        className="btn btn--ghost btn--sm"
                        aria-label={`Remove ${rsvp.name}`}
                        onClick={() => onRemove(rsvp)}
                      >
                        Remove
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

AttendeeList.propTypes = {
  event: eventShape.isRequired,
  stats: statsShape.isRequired,
  canRemove: PropTypes.bool,
  onRemove: PropTypes.func,
};


// Re-exported so pages can type-check rows if needed.
export { rsvpShape };
