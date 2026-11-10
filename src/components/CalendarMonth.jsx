import { useMemo } from 'react';
import PropTypes from 'prop-types';
import { eventShape } from '../propTypes';
import {
  eventOverlapsDay, formatLongDate, formatMonthYear, formatTime, getMonthMatrix, getWeekdayLabels,
  isSameMonth, isToday, toDateKey,
} from '../utils/dateHelpers';

const MAX_VISIBLE = 3;

/**
 * Month grid built from scratch. Uses a real <table> so assistive tech gets row/column
 * semantics, and every event is a <button> reachable with Tab.
 */
export default function CalendarMonth({ anchor, events, onSelectEvent, onSelectDay }) {
  const weeks = useMemo(() => getMonthMatrix(anchor), [anchor]);
  const weekdays = useMemo(() => getWeekdayLabels(0, 'short'), []);
  const longWeekdays = useMemo(() => getWeekdayLabels(0, 'long'), []);

  // Pre-compute each visible day's events (sorted by start time).
  const byDay = useMemo(() => {
    const map = new Map();
    weeks.flat().forEach((day) => {
      map.set(
        toDateKey(day),
        events
          .filter((e) => eventOverlapsDay(e, day))
          .sort((a, b) => new Date(a.start) - new Date(b.start)),
      );
    });
    return map;
  }, [weeks, events]);

  return (
    <div className="cal-month-wrap">
      <table className="cal-month">
        <caption className="sr-only">{formatMonthYear(anchor)}</caption>
        <thead>
          <tr>
            {weekdays.map((label, i) => (
              <th key={label} scope="col">
                <span aria-hidden="true">{label}</span>
                <span className="sr-only">{longWeekdays[i]}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {weeks.map((week) => (
            <tr key={toDateKey(week[0])}>
              {week.map((day) => {
                const dayEvents = byDay.get(toDateKey(day)) || [];
                const visible = dayEvents.slice(0, MAX_VISIBLE);
                const extra = dayEvents.length - visible.length;
                const classes = [
                  'cal-cell',
                  !isSameMonth(day, anchor) && 'is-outside',
                  isToday(day) && 'is-today',
                ].filter(Boolean).join(' ');

                return (
                  <td key={toDateKey(day)} className={classes}>
                    <button
                      type="button"
                      className="cal-daynum"
                      aria-label={`${formatLongDate(day)}, ${dayEvents.length} event${dayEvents.length === 1 ? '' : 's'}. Open week view`}
                      onClick={() => onSelectDay(day)}
                    >
                      {day.getDate()}
                    </button>
                    <ul className="cal-events">
                      {visible.map((event) => (
                        <li key={event.id}>
                          <button
                            type="button"
                            className="cal-chip"
                            style={{ '--ev-color': event.color }}
                            onClick={() => onSelectEvent(event)}
                            aria-label={`${event.title}, ${formatTime(event.start)}`}
                          >
                            <span className="cal-chip-time" aria-hidden="true">{formatTime(event.start)}</span>
                            <span className="cal-chip-title" aria-hidden="true">{event.title}</span>
                          </button>
                        </li>
                      ))}
                      {extra > 0 && (
                        <li>
                          <button type="button" className="cal-more" onClick={() => onSelectDay(day)}>
                            +{extra} more
                          </button>
                        </li>
                      )}
                    </ul>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

CalendarMonth.propTypes = {
  anchor: PropTypes.instanceOf(Date).isRequired,
  events: PropTypes.arrayOf(eventShape).isRequired,
  onSelectEvent: PropTypes.func.isRequired,
  onSelectDay: PropTypes.func.isRequired,
};
