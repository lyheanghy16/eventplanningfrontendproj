import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { useEvents } from '../context/EventContext';
import { useToast } from '../context/ToastContext';
import { eventShape, userShape } from '../propTypes';
import {
  MAX_PLUS_ONES, RSVP_LABELS, findRsvpByEmail, getEventStats, getWaitlistPosition, seatsOf,
} from '../utils/eventHelpers';
import { isValidEmail } from '../utils/validators';
import FormField from './FormField';

/** Field-level validation including capacity rules. Exported for tests. */
export function validateRsvp(values, { event, stats, existing }) {
  const errors = {};
  if (!values.name.trim()) errors.name = 'Please enter your name.';
  else if (values.name.trim().length > 80) errors.name = 'Name must be 80 characters or fewer.';

  if (!values.email.trim()) errors.email = 'Please enter your email.';
  else if (!isValidEmail(values.email)) errors.email = 'Enter a valid email address.';

  if (values.status !== 'declined') {
    const plus = Number(values.plusOnes);
    if (values.plusOnes === '' || !Number.isInteger(plus) || plus < 0 || plus > MAX_PLUS_ONES) {
      errors.plusOnes = `Plus-ones must be a whole number from 0 to ${MAX_PLUS_ONES}.`;
    } else if (values.status === 'going' && event.capacity > 0) {
      const seats = 1 + plus;
      if (seats > event.capacity) {
        errors.plusOnes = `Your party of ${seats} is larger than this event's capacity (${event.capacity}).`;
      } else if (existing && existing.status === 'going' && !existing.waitlisted) {
        // Existing seat-holders can only grow into seats that are actually free.
        const others = stats.seatsTaken - seatsOf(existing);
        if (others + seats > event.capacity) {
          errors.plusOnes = `Only ${event.capacity - others} seat(s) are available for your party.`;
        }
      }
    }
  }
  return errors;
}

/**
 * RSVP form: Going / Maybe / Can't go + name, email and plus-ones.
 * Enforces capacity (extra "Going" RSVPs are waitlisted) and lets people update or cancel.
 */
export default function RSVPForm({ event, user = null, defaultEmail = '', onSaved, onRemoved }) {
  const { rsvps, submitRsvp, removeRsvp } = useEvents();
  const toast = useToast();

  const eventRsvps = useMemo(() => rsvps.filter((r) => r.eventId === event.id), [rsvps, event.id]);
  const stats = useMemo(() => getEventStats(event, eventRsvps), [event, eventRsvps]);

  const [values, setValues] = useState(() => {
    const email = user?.email || defaultEmail || '';
    const prior = findRsvpByEmail(eventRsvps, email);
    return {
      name: prior?.name || user?.name || '',
      email: prior?.email || email,
      status: prior?.status || 'going',
      plusOnes: String(prior?.plusOnes ?? 0),
    };
  });
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // The RSVP this email already has for the event (submitting updates it).
  const existing = findRsvpByEmail(eventRsvps, values.email);
  const errors = useMemo(() => validateRsvp(values, { event, stats, existing }), [values, event, stats, existing]);
  const shown = (name) => (submitted || touched[name] ? errors[name] : undefined);

  const seatsRequested = values.status === 'going' ? 1 + (Number(values.plusOnes) || 0) : 0;
  const alreadySeated = existing && existing.status === 'going' && !existing.waitlisted;
  const willWaitlist =
    values.status === 'going' && event.capacity > 0 && !alreadySeated && seatsRequested > stats.seatsLeft;

  const set = (name) => (e) => {
    setFeedback(null);
    setValues((v) => ({ ...v, [name]: e.target.value }));
  };
  const blur = (name) => () => setTouched((t) => ({ ...t, [name]: true }));

  function handleSubmit(e) {
    e.preventDefault();
    setSubmitted(true);
    if (Object.keys(errors).length > 0) return;

    const saved = submitRsvp({
      eventId: event.id,
      userId: user?.id ?? null,
      name: values.name,
      email: values.email,
      status: values.status,
      plusOnes: values.plusOnes,
    });

    let message;
    if (saved.status === 'going' && saved.waitlisted) {
      // Position is computed from the stats the reducer just produced (our local stats are one render behind).
      const position = stats.waitlist.filter((r) => r.id !== saved.id).length + 1;
      message = `The event is full - you're on the waitlist (#${position}). We'll seat you automatically if space opens up.`;
      toast.info("You've been added to the waitlist");
    } else if (saved.status === 'going') {
      message = "You're going! See you there.";
      toast.success('RSVP saved - you are going');
    } else if (saved.status === 'maybe') {
      message = "Marked as maybe. Update your RSVP any time.";
      toast.success('RSVP saved - maybe');
    } else {
      message = "Thanks for letting us know you can't make it.";
      toast.success('RSVP saved');
    }
    setFeedback({ message, tone: saved.waitlisted ? 'warn' : 'success' });
    onSaved?.(saved);
  }

  function handleCancel() {
    if (!existing) return;
    removeRsvp(existing.id);
    setFeedback({ message: 'Your RSVP was cancelled.', tone: 'neutral' });
    toast.success('RSVP cancelled');
    onRemoved?.(existing);
  }

  const waitlistPosition = existing?.waitlisted ? getWaitlistPosition(stats, existing.id) : 0;

  return (
    <form onSubmit={handleSubmit} noValidate className="rsvp-form" aria-label="RSVP">
      <p className="capacity-line">
        {event.capacity > 0
          ? stats.isFull
            ? `Full - ${stats.waitlist.length} on the waitlist`
            : `${stats.seatsLeft} of ${event.capacity} seats left`
          : 'Unlimited capacity'}
      </p>

      {existing && (
        <p className="notice notice--info">
          {existing.waitlisted
            ? `You're on the waitlist (#${waitlistPosition}).`
            : `Current RSVP: ${RSVP_LABELS[existing.status]}${existing.plusOnes ? ` (+${existing.plusOnes})` : ''}.`}{' '}
          Submit again to update it.
        </p>
      )}

      <fieldset className="field">
        <legend>Will you come?</legend>
        <div className="rsvp-options">
          {Object.entries(RSVP_LABELS).map(([value, label]) => (
            <label key={value} className={`rsvp-option ${values.status === value ? 'is-active' : ''}`}>
              <input type="radio" name={`rsvp-status-${event.id}`} value={value} checked={values.status === value} onChange={set('status')} />
              {label}
            </label>
          ))}
        </div>
      </fieldset>

      <FormField label="Your name" required error={shown('name')}>
        {(p) => <input {...p} type="text" autoComplete="name" value={values.name} onChange={set('name')} onBlur={blur('name')} />}
      </FormField>
      <FormField label="Email" required error={shown('email')}>
        {(p) => <input {...p} type="email" autoComplete="email" value={values.email} onChange={set('email')} onBlur={blur('email')} />}
      </FormField>

      {values.status !== 'declined' && (
        <FormField label="Plus-ones" error={shown('plusOnes')} hint={`Guests you're bringing (0–${MAX_PLUS_ONES}).`}>
          {(p) => <input {...p} type="number" min="0" max={MAX_PLUS_ONES} step="1" value={values.plusOnes} onChange={set('plusOnes')} onBlur={blur('plusOnes')} />}
        </FormField>
      )}

      {willWaitlist && (
        <p className="notice notice--warn" role="status">
          {stats.seatsLeft === 0
            ? "This event is full. You'll be added to the waitlist."
            : `Only ${stats.seatsLeft} seat(s) left for a party of ${seatsRequested}. You'll be added to the waitlist.`}
        </p>
      )}

      {feedback && (
        <p className={`notice notice--${feedback.tone}`} role="status">{feedback.message}</p>
      )}

      <div className="form-actions form-actions--start">
        <button type="submit" className="btn btn--primary">
          {existing ? 'Update RSVP' : willWaitlist ? 'Join waitlist' : 'Send RSVP'}
        </button>
        {existing && (
          <button type="button" className="btn btn--ghost" onClick={handleCancel}>Cancel RSVP</button>
        )}
      </div>
    </form>
  );
}

RSVPForm.propTypes = {
  event: eventShape.isRequired,
  user: userShape,
  defaultEmail: PropTypes.string,
  onSaved: PropTypes.func,
  onRemoved: PropTypes.func,
};

