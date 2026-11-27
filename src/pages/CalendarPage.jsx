/**
 * CalendarPage: displays permitted events in month, week, or agenda views with .ics export.
 * Routed at /calendar; currentUser controls private-event visibility.
 */
import { useMemo, useState } from 'react';
import Agenda from '../components/Agenda';
import CalendarMonth from '../components/CalendarMonth';
import CalendarWeek from '../components/CalendarWeek';
import EventDetailsModal from '../components/EventDetailsModal';
import SegmentedControl from '../components/SegmentedControl';
import { SkeletonGrid } from '../components/Skeleton';
import { useAuth } from '../context/AuthContext';
import { useEvents } from '../context/EventContext';
import { useToast } from '../context/ToastContext';
import useDocumentTitle from '../hooks/useDocumentTitle';
import useLocalStorage from '../hooks/useLocalStorage';
import {
  addDays, addMonths, formatMonthYear, formatWeekRange, startOfDay, startOfWeek,
} from '../utils/dateHelpers';
import { canSeeEvent, getEventStats } from '../utils/eventHelpers';
import { downloadICS } from '../utils/icsExport';

const VIEWS = [
  { value: 'month', label: 'Month' },
  { value: 'week', label: 'Week' },
  { value: 'agenda', label: 'Agenda' },
];

/**
 * Reads events/auth/toast contexts; local view, date anchor, and selected event drive the calendar UI.
 * The chosen view persists under `gather:calendarView` so it survives a reload.
 */
export default function CalendarPage() {
  useDocumentTitle('Calendar');
  const toast = useToast();
  const { status, events, rsvps } = useEvents();
  const { currentUser } = useAuth();

  // `gather:calendarView` stores the selected month/week/agenda view as a JSON string.
  const [view, setView] = useLocalStorage('gather:calendarView', 'month');
  // Anchor is the date navigated by calendar controls; selected opens the quick-look dialog.
  const [anchor, setAnchor] = useState(() => startOfDay(new Date()));
  const [selected, setSelected] = useState(null);

  // Only events the viewer is allowed to see (private events are hidden from strangers).
  const visibleEvents = useMemo(
    () => events.filter((e) => canSeeEvent(e, currentUser, rsvps)),
    [events, currentUser, rsvps],
  );

  function shift(direction) {
    setAnchor((current) => {
      if (view === 'month') return addMonths(current, direction);
      if (view === 'week') return addDays(current, 7 * direction);
      return addDays(current, 30 * direction);
    });
  }

  const title =
    view === 'month' ? formatMonthYear(anchor)
      : view === 'week' ? formatWeekRange(anchor)
        : `Next 30 days from ${formatWeekRange(anchor).split(' – ')[0]}`;

  function handleExport() {
    if (visibleEvents.length === 0) {
      toast.info('There are no events to export.');
      return;
    }
    downloadICS(visibleEvents, 'gather-calendar.ics');
    toast.success(`Exported ${visibleEvents.length} event${visibleEvents.length === 1 ? '' : 's'}`);
  }

  function openWeekFor(day) {
    setAnchor(startOfDay(day));
    setView('week');
  }

  const selectedStats = selected ? getEventStats(selected, rsvps) : null;

  return (
    <div className="page">
      <div className="page-head">
        <h1>Calendar</h1>
        <button type="button" className="btn" onClick={handleExport}>⬇ Export .ics</button>
      </div>

      <div className="toolbar toolbar--spread">
        <div className="cal-nav">
          <button type="button" className="btn btn--sm" onClick={() => shift(-1)} aria-label={`Previous ${view === 'agenda' ? '30 days' : view}`}>←</button>
          <button type="button" className="btn btn--sm" onClick={() => setAnchor(startOfDay(new Date()))}>Today</button>
          <button type="button" className="btn btn--sm" onClick={() => shift(1)} aria-label={`Next ${view === 'agenda' ? '30 days' : view}`}>→</button>
          <h2 className="cal-title" aria-live="polite">{title}</h2>
        </div>
        <SegmentedControl label="Calendar view" options={VIEWS} value={view} onChange={setView} />
      </div>

      {status === 'loading' ? (
        <SkeletonGrid count={3} />
      ) : (
        <>
          {view === 'month' && (
            <CalendarMonth anchor={anchor} events={visibleEvents} onSelectEvent={setSelected} onSelectDay={openWeekFor} />
          )}
          {view === 'week' && (
            <CalendarWeek anchor={startOfWeek(anchor)} events={visibleEvents} onSelectEvent={setSelected} />
          )}
          {view === 'agenda' && (
            <Agenda start={anchor} days={30} events={visibleEvents} onSelectEvent={setSelected} />
          )}
        </>
      )}

      {selected && (
        <EventDetailsModal event={selected} stats={selectedStats} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
