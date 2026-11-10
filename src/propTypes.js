/** Shared PropTypes shapes, so components describe data the same way everywhere. */
import PropTypes from 'prop-types';

export const userShape = PropTypes.shape({
  id: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  email: PropTypes.string,
  avatarColor: PropTypes.string,
});

export const eventShape = PropTypes.shape({
  id: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  color: PropTypes.string,
  image: PropTypes.string,
  start: PropTypes.string.isRequired,
  end: PropTypes.string.isRequired,
  locationType: PropTypes.oneOf(['in-person', 'virtual']),
  location: PropTypes.string,
  link: PropTypes.string,
  capacity: PropTypes.number,
  visibility: PropTypes.oneOf(['public', 'private']),
  hostId: PropTypes.string,
  coHostIds: PropTypes.arrayOf(PropTypes.string),
});

export const rsvpShape = PropTypes.shape({
  id: PropTypes.string.isRequired,
  eventId: PropTypes.string.isRequired,
  userId: PropTypes.string,
  name: PropTypes.string.isRequired,
  email: PropTypes.string.isRequired,
  status: PropTypes.oneOf(['going', 'maybe', 'declined']).isRequired,
  plusOnes: PropTypes.number,
  waitlisted: PropTypes.bool,
  createdAt: PropTypes.string,
});

export const taskShape = PropTypes.shape({
  id: PropTypes.string.isRequired,
  eventId: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  assigneeId: PropTypes.string,
  dueDate: PropTypes.string,
  priority: PropTypes.oneOf(['high', 'medium', 'low']),
  status: PropTypes.oneOf(['todo', 'doing', 'done']),
});

export const commentShape = PropTypes.shape({
  id: PropTypes.string.isRequired,
  eventId: PropTypes.string.isRequired,
  userId: PropTypes.string.isRequired,
  text: PropTypes.string.isRequired,
  createdAt: PropTypes.string.isRequired,
});

export const statsShape = PropTypes.shape({
  going: PropTypes.arrayOf(rsvpShape),
  waitlist: PropTypes.arrayOf(rsvpShape),
  maybe: PropTypes.arrayOf(rsvpShape),
  declined: PropTypes.arrayOf(rsvpShape),
  seatsTaken: PropTypes.number,
  capacity: PropTypes.number,
  seatsLeft: PropTypes.number,
  isFull: PropTypes.bool,
});
