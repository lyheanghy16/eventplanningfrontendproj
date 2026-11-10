import { useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { eventShape } from '../propTypes';
import { fromInputDateTime, toInputDateTime } from '../utils/dateHelpers';
import { isValidUrl } from '../utils/validators';
import FormField from './FormField';

const COLORS = ['#4f46e5', '#0284c7', '#059669', '#d97706', '#dc2626', '#db2777', '#7c3aed', '#0d9488'];

function defaultValues() {
  const start = new Date();
  start.setDate(start.getDate() + 1);
  start.setHours(18, 0, 0, 0);
  const end = new Date(start.getTime() + 2 * 3600000);
  return {
    title: '',
    description: '',
    color: COLORS[0],
    image: '',
    start: toInputDateTime(start),
    end: toInputDateTime(end),
    locationType: 'in-person',
    location: '',
    link: '',
    capacity: '0',
    visibility: 'public',
  };
}

function valuesFromEvent(event) {
  return {
    title: event.title,
    description: event.description || '',
    color: event.color || COLORS[0],
    image: event.image || '',
    start: toInputDateTime(event.start),
    end: toInputDateTime(event.end),
    locationType: event.locationType || 'in-person',
    location: event.location || '',
    link: event.link || '',
    capacity: String(event.capacity ?? 0),
    visibility: event.visibility || 'public',
  };
}

/** Returns { fieldName: message } for every invalid field. Exported for tests. */
export function validateEvent(v) {
  const errors = {};
  if (!v.title.trim()) errors.title = 'Title is required.';
  else if (v.title.trim().length > 100) errors.title = 'Title must be 100 characters or fewer.';

  if (v.description.length > 2000) errors.description = 'Description must be 2,000 characters or fewer.';

  if (!v.start) errors.start = 'Start date and time are required.';
  if (!v.end) errors.end = 'End date and time are required.';
  else if (v.start && new Date(v.end) <= new Date(v.start)) errors.end = 'End time must be after the start time.';

  if (v.locationType === 'in-person') {
    if (!v.location.trim()) errors.location = 'Please enter a location.';
  } else if (!v.link.trim()) {
    errors.link = 'Please enter a meeting link.';
  } else if (!isValidUrl(v.link)) {
    errors.link = 'Enter a valid URL starting with http:// or https://.';
  }

  if (v.image.trim() && !isValidUrl(v.image)) errors.image = 'Enter a valid image URL (http:// or https://).';

  const capacity = Number(v.capacity);
  if (v.capacity.trim() === '' || !Number.isInteger(capacity) || capacity < 0 || capacity > 10000) {
    errors.capacity = 'Capacity must be a whole number from 0 to 10,000 (0 = unlimited).';
  }
  return errors;
}

/** Create / edit form for an event, with inline validation. */
export default function EventForm({ event, submitLabel, onSubmit, onCancel }) {
  const [values, setValues] = useState(() => (event ? valuesFromEvent(event) : defaultValues()));
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const formRef = useRef(null);

  const errors = useMemo(() => validateEvent(values), [values]);
  const shown = (name) => (submitted || touched[name] ? errors[name] : undefined);

  const set = (name) => (e) => setValues((v) => ({ ...v, [name]: e.target.value }));
  const blur = (name) => () => setTouched((t) => ({ ...t, [name]: true }));

  // Moving the start keeps the event's duration, so you rarely need to touch "end".
  function handleStart(e) {
    const value = e.target.value;
    setValues((prev) => {
      const next = { ...prev, start: value };
      const duration = new Date(prev.end) - new Date(prev.start);
      if (value && duration > 0) next.end = toInputDateTime(new Date(new Date(value).getTime() + duration));
      return next;
    });
  }

  function handleSubmit(e) {
    e.preventDefault();
    setSubmitted(true);
    if (Object.keys(errors).length > 0) {
      // Move focus to the first invalid field once errors have rendered.
      requestAnimationFrame(() => formRef.current?.querySelector('[aria-invalid="true"]')?.focus());
      return;
    }
    onSubmit({
      title: values.title.trim(),
      description: values.description.trim(),
      color: values.color,
      image: values.image.trim(),
      start: fromInputDateTime(values.start),
      end: fromInputDateTime(values.end),
      locationType: values.locationType,
      location: values.locationType === 'in-person' ? values.location.trim() : '',
      link: values.locationType === 'virtual' ? values.link.trim() : '',
      capacity: Number(values.capacity),
      visibility: values.visibility,
    });
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} noValidate className="form-grid">
      <FormField label="Title" required error={shown('title')} className="span-2">
        {(p) => (
          <input {...p} type="text" maxLength={120} value={values.title} onChange={set('title')} onBlur={blur('title')} placeholder="e.g. Summer rooftop party" />
        )}
      </FormField>

      <FormField label="Description" error={shown('description')} hint={`${values.description.length}/2000`} className="span-2">
        {(p) => (
          <textarea {...p} rows={4} value={values.description} onChange={set('description')} onBlur={blur('description')} placeholder="What should guests know?" />
        )}
      </FormField>

      <fieldset className="field span-2">
        <legend>Cover colour</legend>
        <div className="swatches">
          {COLORS.map((color) => (
            <label key={color} className="swatch" style={{ backgroundColor: color }}>
              <input
                type="radio"
                name="cover-color"
                value={color}
                checked={values.color === color}
                onChange={set('color')}
                aria-label={`Colour ${color}`}
              />
              <span aria-hidden="true">✓</span>
            </label>
          ))}
        </div>
      </fieldset>

      <FormField label="Cover image URL (optional)" error={shown('image')} hint="Shown on top of the colour." className="span-2">
        {(p) => (
          <input {...p} type="url" inputMode="url" value={values.image} onChange={set('image')} onBlur={blur('image')} placeholder="https://…" />
        )}
      </FormField>

      <FormField label="Starts" required error={shown('start')}>
        {(p) => <input {...p} type="datetime-local" value={values.start} onChange={handleStart} onBlur={blur('start')} />}
      </FormField>
      <FormField label="Ends" required error={shown('end')}>
        {(p) => <input {...p} type="datetime-local" value={values.end} onChange={set('end')} onBlur={blur('end')} />}
      </FormField>

      <fieldset className="field span-2">
        <legend>Where is it?</legend>
        <div className="radio-row">
          {[['in-person', 'In person'], ['virtual', 'Virtual']].map(([value, label]) => (
            <label key={value} className="radio">
              <input type="radio" name="location-type" value={value} checked={values.locationType === value} onChange={set('locationType')} />
              {label}
            </label>
          ))}
        </div>
      </fieldset>

      {values.locationType === 'in-person' ? (
        <FormField label="Location" required error={shown('location')} className="span-2">
          {(p) => <input {...p} type="text" value={values.location} onChange={set('location')} onBlur={blur('location')} placeholder="Venue name and address" />}
        </FormField>
      ) : (
        <FormField label="Meeting link" required error={shown('link')} className="span-2">
          {(p) => <input {...p} type="url" inputMode="url" value={values.link} onChange={set('link')} onBlur={blur('link')} placeholder="https://meet.example.com/…" />}
        </FormField>
      )}

      <FormField label="Capacity" required error={shown('capacity')} hint="Maximum attendees including plus-ones. 0 = unlimited. Extra RSVPs join a waitlist.">
        {(p) => <input {...p} type="number" min="0" max="10000" step="1" value={values.capacity} onChange={set('capacity')} onBlur={blur('capacity')} />}
      </FormField>

      <FormField label="Visibility" hint="Private events are unlisted - only people with the link, the host and co-hosts see them.">
        {(p) => (
          <select {...p} value={values.visibility} onChange={set('visibility')}>
            <option value="public">Public</option>
            <option value="private">Private</option>
          </select>
        )}
      </FormField>

      <div className="form-actions span-2">
        <button type="button" className="btn" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn btn--primary">{submitLabel}</button>
      </div>
    </form>
  );
}

EventForm.propTypes = {
  event: eventShape,
  submitLabel: PropTypes.string.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};
