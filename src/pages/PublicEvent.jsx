import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import Badge from '../components/Badge';
import Countdown from '../components/Countdown';
import CopyLinkButton from '../components/CopyLinkButton';
import EmptyState from '../components/EmptyState';
import RSVPForm from '../components/RSVPForm';
import { PageSkeleton } from '../components/Skeleton';
import { useAuth } from '../context/AuthContext';
import { useEvents } from '../context/EventContext';
import useDocumentTitle from '../hooks/useDocumentTitle';
import { formatEventRange } from '../utils/dateHelpers';
import { downloadICS, slugify } from '../utils/icsExport';
import { ROLES, getCoverStyle, getEventStats, getLocationLabel, getRole, isEventPast } from '../utils/eventHelpers';

/**
 * Public guest view at /event/:id - the page behind every share link.
 * Shows only guest-safe information: no attendee emails, tasks or comments.
 * Anyone (signed in or not) can RSVP by entering a name and email.
 */
export default function PublicEvent() {
  const { id } = useParams();
  const { status, events, rsvps, users } = useEvents();
  const { currentUser } = useAuth();
  const event = events.find((e) => e.id === id);
  useDocumentTitle(event?.title);

  const stats = useMemo(() => (event ? getEventStats(event, rsvps) : null), [event, rsvps]);

  if (status === 'loading') return <PageSkeleton />;
  if (!event) {
    return (
      <div className="page page--narrow">
        <EmptyState icon="🧭" title="This event isn't available" action={<Link to="/" className="btn btn--primary">Go to Gather</Link>}>
          The link may be wrong, or the host has removed the event.
        </EmptyState>
      </div>
    );
  }

  const host = users.find((u) => u.id === event.hostId);
  const past = isEventPast(event);
  const role = getRole(event, currentUser?.id);

  return (
    <div className="page page--narrow">
      {role !== ROLES.GUEST && (
        <p className="notice notice--info">
          You&apos;re the {role === ROLES.HOST ? 'host' : 'co-host'} of this event. This is what guests see.{' '}
          <Link to={`/events/${event.id}`}>Open the event workspace</Link>
        </p>
      )}

      <div className="hero" style={getCoverStyle(event)}>
        <div className="hero-overlay">
          <div className="badge-row">
            {event.visibility === 'private' && <Badge>🔒 Private - invitation link</Badge>}
            {past && <Badge>Past event</Badge>}
            {stats.isFull && !past && <Badge tone="warn">Full - waitlist open</Badge>}
          </div>
          <h1>{event.title}</h1>
          <p>Hosted by {host?.name || 'the organiser'}</p>
        </div>
      </div>

      <div className="action-bar">
        <CopyLinkButton eventId={event.id} label="Copy link" className="btn" />
        <button type="button" className="btn" onClick={() => downloadICS([event], `${slugify(event.title)}.ics`)}>
          Add to calendar
        </button>
      </div>

      <div className="two-col">
        <section aria-labelledby="pub-about">
          <h2 id="pub-about">Details</h2>
          {!past && <Countdown start={event.start} end={event.end} />}
          <dl className="detail-list">
            <div><dt>When</dt><dd>{formatEventRange(event.start, event.end)}</dd></div>
            <div>
              <dt>Where</dt>
              <dd>
                {getLocationLabel(event)}
                {event.locationType === 'virtual' && event.link && (
                  <> – <a href={event.link} target="_blank" rel="noreferrer noopener">Join link</a></>
                )}
              </dd>
            </div>
            <div>
              <dt>Going</dt>
              <dd>
                {stats.seatsTaken}{stats.capacity > 0 ? ` of ${stats.capacity}` : ''}
              </dd>
            </div>
          </dl>
          {event.description && <p className="description">{event.description}</p>}
        </section>

        <section aria-labelledby="pub-rsvp" className="card">
          <h2 id="pub-rsvp">RSVP</h2>
          {past ? (
            <p className="muted">This event has ended, so RSVPs are closed.</p>
          ) : (
            <RSVPForm key={currentUser?.id || 'anon'} event={event} user={currentUser} />
          )}
        </section>
      </div>
    </div>
  );
}
