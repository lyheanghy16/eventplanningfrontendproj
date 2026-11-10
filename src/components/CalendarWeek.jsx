import { useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { eventShape } from '../propTypes';
import {
  addDays, eventOverlapsDay, formatHour, formatLongDate, formatTime, formatWeekday, isToday,
  startOfDay, startOfWeek, toDateKey,
} from '../utils/dateHelpers';

const HOUR_HEIGHT = 52; // px per hour
const MIN_MINUTES = 30; // minimum rendered height of an event block
const HOURS = Array.from({ length: 24 }, (_, h) => h);

/**
 * Greedy column layout so overlapping events sit side by side instead of stacking.
 * items: [{ event, startMin, endMin }] -> same items plus { lane, lanes }.
 */
function layoutEvents(items) {
  const sorted = [...items].sort((a, b) => a.startMin - b.startMin || b.endMin - a.endMin);
  const result = [];
  let cluster = [];
  let clusterEnd = -1;

  const flush = () => {
    if (cluster.length === 0) return;
    const laneEnds = [];
    cluster.forEach((item) => {
      let lane = laneEnds.findIndex((end) => end <= item.startMin);
      if (lane === -1) {
        lane = laneEnds.length;
        laneEnds.push(item.endMin);
      } else {
        laneEnds[lane] = item.endMin;
      }
      item.lane = lane; // eslint-disable-line no-param-reassign
    });
    cluster.forEach((item) => result.push({ ...item, lanes: laneEnds.length }));
    cluster = [];
  };

  sorted.forEach((item) => {
    if (item.startMin >= clusterEnd) {
      flush();
      clusterEnd = item.endMin;
    } else {
      clusterEnd = Math.max(clusterEnd, item.endMin);
    }
    cluster.push({ ...item });
  });
  flush();
  return result;
}

/** 7-day time grid. Events are positioned by time; multi-day events are clipped per day. */
export default function CalendarWeek({ anchor, events, onSelectEvent }) {
  const scrollRef = useRef(null);
  const [now, setNow] = useState(() => new Date());

  const weekStartKey = toDateKey(startOfWeek(anchor));
  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(startOfWeek(anchor), i)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [weekStartKey],
  );

  const layouts = useMemo(
    () =>
      days.map((day) => {
        const dayStart = startOfDay(day).getTime();
        const dayEnd = startOfDay(addDays(day, 1)).getTime();
        const items = events
          .filter((e) => eventOverlapsDay(e, day))
          .map((event) => {
            const s = Math.max(new Date(event.start).getTime(), dayStart);
            const e = Math.min(new Date(event.end).getTime(), dayEnd);
            const startMin = (s - dayStart) / 60000;
            const endMin = Math.max((e - dayStart) / 60000, startMin + MIN_MINUTES);
            return { event, startMin, endMin };
          });
        return layoutEvents(items);
      }),
    [days, events],
  );

  // Start scrolled to the morning, and keep the "now" line fresh.
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 7 * HOUR_HEIGHT;
  }, [weekStartKey]);
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(id);
  }, []);

  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  return (
    <div className="cal-week" ref={scrollRef}>
      <div className="cal-week-inner">
        <div className="cal-week-head">
          <div className="cal-gutter" />
          {days.map((day) => (
            <div key={toDateKey(day)} className={`cal-week-dayhead ${isToday(day) ? 'is-today' : ''}`}>
              <span>{formatWeekday(day)}</span>
              <strong>{day.getDate()}</strong>
            </div>
          ))}
        </div>

        <div className="cal-week-body" style={{ height: HOUR_HEIGHT * 24 }}>
          <div className="cal-gutter" aria-hidden="true">
            {HOURS.map((h) => (
              <div key={h} className="cal-hour-label" style={{ top: h * HOUR_HEIGHT }}>
                {h === 0 ? '' : formatHour(h)}
              </div>
            ))}
          </div>

          {days.map((day, i) => (
            <div
              key={toDateKey(day)}
              className={`cal-week-col ${isToday(day) ? 'is-today' : ''}`}
              role="group"
              aria-label={formatLongDate(day)}
            >
              {isToday(day) && <div className="cal-now" style={{ top: (nowMinutes / 60) * HOUR_HEIGHT }} aria-hidden="true" />}
              {layouts[i].map(({ event, startMin, endMin, lane, lanes }) => (
                <button
                  key={event.id}
                  type="button"
                  className="cal-block"
                  style={{
                    '--ev-color': event.color,
                    top: (startMin / 60) * HOUR_HEIGHT,
                    height: ((endMin - startMin) / 60) * HOUR_HEIGHT - 2,
                    left: `calc(${(lane / lanes) * 100}% + 2px)`,
                    width: `calc(${100 / lanes}% - 4px)`,
                  }}
                  onClick={() => onSelectEvent(event)}
                  aria-label={`${event.title}, ${formatTime(event.start)} to ${formatTime(event.end)}`}
                >
                  <strong>{event.title}</strong>
                  <span>{formatTime(event.start)}</span>
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

CalendarWeek.propTypes = {
  anchor: PropTypes.instanceOf(Date).isRequired,
  events: PropTypes.arrayOf(eventShape).isRequired,
  onSelectEvent: PropTypes.func.isRequired,
};
