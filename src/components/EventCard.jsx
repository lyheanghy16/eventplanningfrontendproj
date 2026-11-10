import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import { eventShape, rsvpShape, statsShape } from '../propTypes';
import { formatEventRange, formatMonthShort } from '../utils/dateHelpers';
import { ROLE_LABELS, ROLES, getCoverStyle, getLocationLabel, isEventPast } from '../utils/eventHelpers';
import Badge from './Badge';
import CopyLinkButton from './CopyLinkButton';

/** Summary card used on the dashboard. The whole card is clickable via the title link. */
export default function EventCard({ event, role, stats, rsvp }) {
  const past = isEventPast(event);
  const start = new Date(event.start);

  let rsvpBadge = null;
  if (rsvp) {
    if (rsvp.status === 'going' && rsvp.waitlisted) rsvpBadge = <Badge tone="warn">Waitlisted</Badge>;
    else if (rsvp.status === 'going') rsvpBadge = <Badge tone="success">You&apos;re going</Badge>;
    else if (rsvp.status === 'maybe') rsvpBadge = <Badge tone="primary">Maybe</Badge>;
  }

  return (
    <article className={`event-card ${past ? 'is-past' : ''}`} style={{ '--ev-color': event.color }}>
      <div className="event-cover" style={getCoverStyle(event)} aria-hidden="true">
        <span className="date-chip">
          <span>{formatMonthShort(start)}</span>
          <strong>{start.getDate()}</strong>
        </span>
      </div>

      <div className="event-card-body">
        <div className="badge-row">
          {role !== ROLES.GUEST && <Badge tone="primary">{ROLE_LABELS[role]}</Badge>}
          {event.visibility === 'private' && <Badge>🔒 Private</Badge>}
          {past && <Badge>Past</Badge>}
          {stats.isFull && !past && <Badge tone="warn">Full</Badge>}
          {rsvpBadge}
        </div>

        <h3 className="event-card-title">
          <Link to={`/events/${event.id}`} className="stretched-link">{event.title}</Link>
        </h3>

        <p className="event-meta"><span aria-hidden="true">🗓</span> {formatEventRange(event.start, event.end)}</p>
        <p className="event-meta"><span aria-hidden="true">📍</span> {getLocationLabel(event)}</p>
        <p className="event-meta">
          <span aria-hidden="true">👥</span> {stats.seatsTaken} going
          {stats.capacity > 0 && ` of ${stats.capacity}`}
          {stats.waitlist.length > 0 && ` · ${stats.waitlist.length} on waitlist`}
        </p>
      </div>

      <div className="event-card-footer">
        <CopyLinkButton eventId={event.id} />
      </div>
    </article>
  );
}

EventCard.propTypes = {
  event: eventShape.isRequired,
  role: PropTypes.oneOf(['host', 'cohost', 'guest']).isRequired,
  stats: statsShape.isRequired,
  rsvp: rsvpShape,
};
