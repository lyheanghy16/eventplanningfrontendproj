/**
 * Domain helpers: roles & permissions, RSVP/capacity maths, visibility rules.
 * Everything here is pure so it can be shared by reducers, components and tests.
 */
import { parseDateKey, startOfDay, formatRelativeDay, formatShortDate } from './dateHelpers';

/* -------------------------------- constants ------------------------------- */

export const ROLES = { HOST: 'host', COHOST: 'cohost', GUEST: 'guest' };
export const ROLE_LABELS = { host: 'Host', cohost: 'Co-host', guest: 'Guest' };

export const RSVP_LABELS = { going: 'Going', maybe: 'Maybe', declined: "Can't go" };
export const MAX_PLUS_ONES = 5;

export const TASK_STATUSES = [
  { id: 'todo', label: 'To do' },
  { id: 'doing', label: 'In progress' },
  { id: 'done', label: 'Done' },
];
export const TASK_PRIORITIES = [
  { id: 'high', label: 'High' },
  { id: 'medium', label: 'Medium' },
  { id: 'low', label: 'Low' },
];
const PRIORITY_RANK = { high: 0, medium: 1, low: 2 };

/* ------------------------- roles and permissions -------------------------- */

const PERMISSIONS = {
  host: [
    'event:edit', 'event:delete', 'event:duplicate', 'event:manageCohosts',
    'attendees:view', 'attendees:remove',
    'task:view', 'task:create', 'task:edit', 'task:delete',
    'comment:moderate',
  ],
  cohost: [
    'event:edit', 'event:duplicate',
    'attendees:view', 'attendees:remove',
    'task:view', 'task:create', 'task:edit', 'task:delete',
    'comment:moderate',
  ],
  guest: [],
};

/** Role of a user for one event. Signed-out visitors are always guests. */
export function getRole(event, userId) {
  if (!event || !userId) return ROLES.GUEST;
  if (event.hostId === userId) return ROLES.HOST;
  if ((event.coHostIds || []).includes(userId)) return ROLES.COHOST;
  return ROLES.GUEST;
}

export function can(role, permission) {
  return (PERMISSIONS[role] || []).includes(permission);
}

/** Members (host/co-host) can manage tasks; assignees may always update their own task's status. */
export function canChangeTaskStatus(role, task, userId) {
  return can(role, 'task:edit') || (!!userId && task.assigneeId === userId);
}

export function canDeleteComment(role, comment, userId) {
  return can(role, 'comment:moderate') || (!!userId && comment.userId === userId);
}

/* --------------------------------- RSVPs ---------------------------------- */

export const seatsOf = (rsvp) => 1 + (Number(rsvp.plusOnes) || 0);

/**
 * Recomputes which "going" RSVPs hold a seat and which are waitlisted.
 * RSVPs are processed first-come-first-served (by createdAt); a party that does not
 * fit is waitlisted and a later, smaller party may still be seated. Capacity 0 = unlimited.
 * Called whenever an RSVP or the event's capacity changes, so waitlisted guests are
 * promoted automatically when seats open up.
 */
export function rebalanceWaitlist(rsvps, event) {
  if (!event) return rsvps;
  const capacity = Number(event.capacity) || 0;
  const going = rsvps
    .filter((r) => r.eventId === event.id && r.status === 'going')
    .sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)));

  const waitlisted = new Map();
  let used = 0;
  going.forEach((r) => {
    const seats = seatsOf(r);
    if (capacity === 0 || used + seats <= capacity) {
      used += seats;
      waitlisted.set(r.id, false);
    } else {
      waitlisted.set(r.id, true);
    }
  });

  return rsvps.map((r) =>
    r.eventId === event.id ? { ...r, waitlisted: r.status === 'going' ? waitlisted.get(r.id) : false } : r,
  );
}

/** Counts and capacity numbers for one event. */
export function getEventStats(event, rsvps) {
  const list = rsvps.filter((r) => r.eventId === event.id);
  const byDate = (a, b) => String(a.createdAt).localeCompare(String(b.createdAt));
  const going = list.filter((r) => r.status === 'going' && !r.waitlisted).sort(byDate);
  const waitlist = list.filter((r) => r.status === 'going' && r.waitlisted).sort(byDate);
  const maybe = list.filter((r) => r.status === 'maybe');
  const declined = list.filter((r) => r.status === 'declined');
  const seatsTaken = going.reduce((sum, r) => sum + seatsOf(r), 0);
  const capacity = Number(event.capacity) || 0;
  return {
    going,
    waitlist,
    maybe,
    declined,
    seatsTaken,
    capacity,
    seatsLeft: capacity > 0 ? Math.max(0, capacity - seatsTaken) : Infinity,
    isFull: capacity > 0 && seatsTaken >= capacity,
    total: list.length,
  };
}

export function findRsvpByEmail(rsvps, email) {
  const key = String(email || '').trim().toLowerCase();
  return key ? rsvps.find((r) => r.email === key) : undefined;
}

/** The RSVP belonging to a signed-in user (matched by user id or email). */
export function getUserRsvp(event, user, rsvps) {
  if (!user) return undefined;
  return rsvps.find(
    (r) => r.eventId === event.id && (r.userId === user.id || r.email === String(user.email).toLowerCase()),
  );
}

export function getWaitlistPosition(stats, rsvpId) {
  const index = stats.waitlist.findIndex((r) => r.id === rsvpId);
  return index === -1 ? 0 : index + 1;
}

/* ------------------------------- visibility ------------------------------- */

/**
 * Public events are listed for everyone. Private events are "unlisted": they only show up
 * in lists/calendars for the host, co-hosts and people who RSVP'd. Anyone holding the
 * share link can still open the guest page (/event/:id) - the link acts as the invitation.
 */
export function canSeeEvent(event, user, rsvps) {
  if (event.visibility !== 'private') return true;
  if (!user) return false;
  if (getRole(event, user.id) !== ROLES.GUEST) return true;
  return !!getUserRsvp(event, user, rsvps);
}

/* --------------------------------- misc ----------------------------------- */

export const isEventPast = (event, now = Date.now()) => new Date(event.end).getTime() < now;

export function buildEventUrl(eventId) {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  return `${origin}/event/${eventId}`;
}

export function getLocationLabel(event) {
  if (event.locationType === 'virtual') return 'Online event';
  return event.location || 'Location to be announced';
}

/** Inline style for a cover: solid colour, optionally with a (sanitised) background image. */
export function getCoverStyle(event) {
  const style = { backgroundColor: event.color || '#4f46e5' };
  if (event.image) {
    const safe = encodeURI(event.image).replace(/['"()]/g, (c) => `%${c.charCodeAt(0).toString(16)}`);
    style.backgroundImage = `url("${safe}")`;
  }
  return style;
}

/* --------------------------------- tasks ---------------------------------- */

export function isTaskOverdue(task, now = new Date()) {
  return task.status !== 'done' && !!task.dueDate && parseDateKey(task.dueDate) < startOfDay(now);
}

export function formatDue(task) {
  if (!task.dueDate) return 'No due date';
  const date = parseDateKey(task.dueDate);
  return `${formatShortDate(date)} (${formatRelativeDay(date)})`;
}

/** Open tasks first, then by due date, then by priority. */
export function compareTasks(a, b) {
  const doneDiff = Number(a.status === 'done') - Number(b.status === 'done');
  if (doneDiff) return doneDiff;
  const dueA = a.dueDate || '9999-12-31';
  const dueB = b.dueDate || '9999-12-31';
  if (dueA !== dueB) return dueA.localeCompare(dueB);
  return PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
}
