import { useMemo } from 'react';
import PropTypes from 'prop-types';
import { eventShape } from '../propTypes';
import {
  addDays, eventOverlapsDay, formatLongDate, formatRelativeDay, formatTime, isSameDay, startOfDay,
} from '../utils/dateHelpers';
import { getLocationLabel } from '../utils/eventHelpers';
import EmptyState from './EmptyState';

/** Chronological list of events grouped by day for the next `days` days. */
export default function Agenda({ start, days = 30, events, onSelectEvent }) {
  const groups = useMemo(() => {
    const first = startOfDay(start);
    const result = [];
    for (let i = 0; i < days; i += 1) {
      const day = addDays(first, i);
      const dayEvents = events
        .filter((e) => eventOverlapsDay(e, day))
        .sort((a, b) => new Date(a.start) - new Date(b.start));
      if (dayEvents.length > 0) result.push({ day, events: dayEvents });
    }
    return result;
  }, [start, days, events]);

  if (groups.length === 0) {
    return (
      <EmptyState icon="🗓️" title="Nothing scheduled">
        There are no events in this period. Try another range or create an event from the dashboard.
      </EmptyState>
    );
  }

  return (
    <div className="agenda">
      {groups.map(({ day, events: dayEvents }) => (
        <section key={day.toISOString()} className="agenda-day" aria-labelledby={`agenda-${day.getTime()}`}>
          <h3 id={`agenda-${day.getTime()}`} className="agenda-heading">
            {formatLongDate(day)} <span className="muted">· {formatRelativeDay(day)}</span>
          </h3>
          <ul className="agenda-list">
            {dayEvents.map((event) => (
              <li key={event.id}>
                <button
                  type="button"
                  className="agenda-item"
                  style={{ '--ev-color': event.color }}
                  onClick={() => onSelectEvent(event)}
                >
                  <span className="agenda-time">
                    {isSameDay(event.start, event.end) || isSameDay(event.start, day)
                      ? formatTime(event.start)
                      : 'All day'}
                    <small>– {formatTime(event.end)}</small>
                  </span>
                  <span className="agenda-main">
                    <strong>{event.title}</strong>
                    <span className="muted">{getLocationLabel(event)}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

Agenda.propTypes = {
  start: PropTypes.instanceOf(Date).isRequired,
  days: PropTypes.number,
  events: PropTypes.arrayOf(eventShape).isRequired,
  onSelectEvent: PropTypes.func.isRequired,
};

