import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import { eventShape, statsShape } from '../propTypes';
import { formatEventRange } from '../utils/dateHelpers';
import { downloadICS, slugify } from '../utils/icsExport';
import { getCoverStyle, getLocationLabel } from '../utils/eventHelpers';
import Badge from './Badge';
import CopyLinkButton from './CopyLinkButton';
import Modal from './Modal';

/** Quick-look dialog opened from the calendar views. */
export default function EventDetailsModal({ event, stats, onClose }) {
  return (
    <Modal title={event.title} onClose={onClose}>
      <div className="details-cover" style={getCoverStyle(event)} aria-hidden="true" />
      <div className="badge-row">
        <Badge>{event.visibility === 'private' ? '🔒 Private' : 'Public'}</Badge>
        {stats.isFull && <Badge tone="warn">Full</Badge>}
      </div>

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
            {stats.waitlist.length > 0 && ` · ${stats.waitlist.length} waitlisted`}
          </dd>
        </div>
      </dl>

      {event.description && <p className="clamp-text">{event.description}</p>}

      <div className="form-actions form-actions--start">
        <Link to={`/events/${event.id}`} className="btn btn--primary" onClick={onClose}>Open event</Link>
        <CopyLinkButton eventId={event.id} className="btn" />
        <button type="button" className="btn" onClick={() => downloadICS([event], `${slugify(event.title)}.ics`)}>
          Add to calendar (.ics)
        </button>
      </div>
    </Modal>
  );
}

EventDetailsModal.propTypes = {
  event: eventShape.isRequired,
  stats: statsShape.isRequired,
  onClose: PropTypes.func.isRequired,
};
