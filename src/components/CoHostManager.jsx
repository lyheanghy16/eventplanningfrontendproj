/**
 * CoHostManager: host-facing checklist for assigning co-host permissions.
 * Used in EventDetail; it edits local selection and submits selected user IDs via onSave.
 */
import { useState } from 'react';
import PropTypes from 'prop-types';
import { eventShape, userShape } from '../propTypes';
import Avatar from './Avatar';

/**
 * Props: event supplies current host/co-host IDs, users are selectable accounts, and onSave persists the IDs.
 * Local selected state tracks edits until the host saves them.
 */
export default function CoHostManager({ event, users, onSave }) {
  // Keep edits local until Save is pressed; the event prop supplies the initial selection.
  const [selected, setSelected] = useState(event.coHostIds || []);
  const candidates = users.filter((u) => u.id !== event.hostId);

  const unchanged =
    selected.length === (event.coHostIds || []).length &&
    selected.every((id) => (event.coHostIds || []).includes(id));

  function toggle(id) {
    setSelected((list) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]));
  }

  return (
    <fieldset className="cohost-manager">
      <legend>Co-hosts</legend>
      <p className="muted small">
        Co-hosts can edit the event, manage tasks and attendees, and moderate comments. Only the host can delete the event.
      </p>
      <ul className="check-list">
        {candidates.map((user) => (
          <li key={user.id}>
            <label className="check">
              <input type="checkbox" checked={selected.includes(user.id)} onChange={() => toggle(user.id)} />
              <Avatar name={user.name} color={user.avatarColor} size={24} />
              {user.name}
            </label>
          </li>
        ))}
      </ul>
      <button type="button" className="btn btn--sm" disabled={unchanged} onClick={() => onSave(selected)}>
        Save co-hosts
      </button>
    </fieldset>
  );
}

CoHostManager.propTypes = {
  event: eventShape.isRequired,
  users: PropTypes.arrayOf(userShape).isRequired,
  onSave: PropTypes.func.isRequired,
};
