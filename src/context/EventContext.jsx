/**
 * EventContext - single source of truth for users, events, RSVPs, tasks and comments.
 *
 * - State changes go through a pure reducer (`eventReducer`, exported for tests).
 * - Ids/timestamps are created in the action creators, never in the reducer.
 * - Persistence is delegated to src/services/api.js (localStorage today, REST tomorrow).
 * - Changes made in other tabs are pushed in via subscribeToDatabase, so a host's
 *   attendee list updates live while guests RSVP in another tab.
 */
import {
  createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef,
} from 'react';
import PropTypes from 'prop-types';
import { loadDatabase, saveDatabase, resetDatabase, subscribeToDatabase } from '../services/api';
import { generateId } from '../utils/idGenerator';
import { DAY_MS, addDays, parseDateKey, toDateKey } from '../utils/dateHelpers';
import { rebalanceWaitlist, seatsOf } from '../utils/eventHelpers';

const EventContext = createContext(null);

export const initialState = {
  status: 'loading', // 'loading' | 'ready' | 'error'
  error: null,
  users: [],
  events: [],
  rsvps: [],
  tasks: [],
  comments: [],
};

/** Pure reducer: (state, action) -> state. */
export function eventReducer(state, action) {
  switch (action.type) {
    case 'HYDRATE':
      return { ...initialState, ...action.payload, status: 'ready', error: null };

    case 'LOAD_ERROR':
      return { ...state, status: 'error', error: action.error };

    /* ------------------------------- events ------------------------------- */
    case 'EVENT_ADD':
      return {
        ...state,
        events: [...state.events, action.payload.event],
        tasks: [...state.tasks, ...(action.payload.tasks || [])],
      };

    case 'EVENT_UPDATE': {
      const events = state.events.map((e) =>
        e.id === action.payload.id ? { ...e, ...action.payload.changes } : e,
      );
      const updated = events.find((e) => e.id === action.payload.id);
      // Capacity may have changed -> seat/waitlist assignments may change too.
      return { ...state, events, rsvps: rebalanceWaitlist(state.rsvps, updated) };
    }

    case 'EVENT_DELETE': {
      const id = action.payload.id;
      return {
        ...state,
        events: state.events.filter((e) => e.id !== id),
        rsvps: state.rsvps.filter((r) => r.eventId !== id),
        tasks: state.tasks.filter((t) => t.eventId !== id),
        comments: state.comments.filter((c) => c.eventId !== id),
      };
    }

    /* -------------------------------- RSVPs ------------------------------- */
    case 'RSVP_SUBMIT': {
      const incoming = { ...action.payload.rsvp, email: action.payload.rsvp.email.trim().toLowerCase() };
      // One RSVP per email per event: submitting again updates the existing one.
      const existing = state.rsvps.find(
        (r) => r.eventId === incoming.eventId && r.email === incoming.email,
      );
      let rsvps;
      if (existing) {
        const becameGoing = incoming.status === 'going' && existing.status !== 'going';
        const partyGrew =
          incoming.status === 'going' &&
          existing.status === 'going' &&
          !existing.waitlisted &&
          seatsOf(incoming) > seatsOf(existing);
        const merged = {
          ...existing,
          ...incoming,
          id: existing.id,
          // Joining (or growing a party) puts you at the back of the queue.
          createdAt: becameGoing || partyGrew ? incoming.createdAt : existing.createdAt,
        };
        rsvps = state.rsvps.map((r) => (r.id === existing.id ? merged : r));
      } else {
        rsvps = [...state.rsvps, incoming];
      }
      const event = state.events.find((e) => e.id === incoming.eventId);
      return { ...state, rsvps: rebalanceWaitlist(rsvps, event) };
    }

    case 'RSVP_REMOVE': {
      const target = state.rsvps.find((r) => r.id === action.payload.id);
      if (!target) return state;
      const event = state.events.find((e) => e.id === target.eventId);
      // Removing a seat-holder promotes the next waitlisted guest(s).
      return {
        ...state,
        rsvps: rebalanceWaitlist(state.rsvps.filter((r) => r.id !== target.id), event),
      };
    }

    /* -------------------------------- tasks ------------------------------- */
    case 'TASK_ADD':
      return { ...state, tasks: [...state.tasks, action.payload.task] };
    case 'TASK_UPDATE':
      return {
        ...state,
        tasks: state.tasks.map((t) =>
          t.id === action.payload.id ? { ...t, ...action.payload.changes } : t,
        ),
      };
    case 'TASK_DELETE':
      return { ...state, tasks: state.tasks.filter((t) => t.id !== action.payload.id) };

    /* ------------------------------ comments ------------------------------ */
    case 'COMMENT_ADD':
      return { ...state, comments: [...state.comments, action.payload.comment] };
    case 'COMMENT_DELETE':
      return { ...state, comments: state.comments.filter((c) => c.id !== action.payload.id) };

    default:
      return state;
  }
}

/** The slice of state that is persisted. */
const snapshot = (s) => ({
  users: s.users,
  events: s.events,
  rsvps: s.rsvps,
  tasks: s.tasks,
  comments: s.comments,
});

export function EventProvider({ children }) {
  const [state, dispatch] = useReducer(eventReducer, initialState);
  const stateRef = useRef(state);
  stateRef.current = state;
  const skipNextSave = useRef(true); // don't write back data we just loaded / received

  /* Initial load + live updates from other tabs. */
  useEffect(() => {
    let cancelled = false;
    loadDatabase()
      .then((db) => {
        if (!cancelled) dispatch({ type: 'HYDRATE', payload: db });
      })
      .catch((err) => {
        if (!cancelled) dispatch({ type: 'LOAD_ERROR', error: err?.message || 'Failed to load data' });
      });
    const unsubscribe = subscribeToDatabase((db) => {
      skipNextSave.current = true;
      dispatch({ type: 'HYDRATE', payload: db });
    });
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  /* Persist on every change after the first load. */
  useEffect(() => {
    if (state.status !== 'ready') return;
    if (skipNextSave.current) {
      skipNextSave.current = false;
      return;
    }
    saveDatabase(snapshot(state)).catch(() => {});
  }, [state]);

  /* ---------------------------- action creators --------------------------- */
  const actions = useMemo(() => {
    const now = () => new Date().toISOString();

    return {
      createEvent(values, hostId) {
        const event = { ...values, id: generateId('evt'), hostId, coHostIds: [], createdAt: now() };
        dispatch({ type: 'EVENT_ADD', payload: { event } });
        return event;
      },

      updateEvent(id, changes) {
        dispatch({ type: 'EVENT_UPDATE', payload: { id, changes } });
      },

      deleteEvent(id) {
        dispatch({ type: 'EVENT_DELETE', payload: { id } });
      },

      /** Copies an event (shifted one week) and its tasks (reset to "To do"). The caller becomes host. */
      duplicateEvent(id, hostId) {
        const { events, tasks } = stateRef.current;
        const source = events.find((e) => e.id === id);
        if (!source) return null;
        const week = 7 * DAY_MS;
        const event = {
          ...source,
          id: generateId('evt'),
          title: `Copy of ${source.title}`,
          start: new Date(new Date(source.start).getTime() + week).toISOString(),
          end: new Date(new Date(source.end).getTime() + week).toISOString(),
          hostId,
          coHostIds: [],
          createdAt: now(),
        };
        const copiedTasks = tasks
          .filter((t) => t.eventId === id)
          .map((t) => ({
            ...t,
            id: generateId('task'),
            eventId: event.id,
            status: 'todo',
            dueDate: t.dueDate ? toDateKey(addDays(parseDateKey(t.dueDate), 7)) : '',
            createdAt: now(),
          }));
        dispatch({ type: 'EVENT_ADD', payload: { event, tasks: copiedTasks } });
        return event;
      },

      /**
       * Creates or updates the RSVP for (event, email). Returns the stored RSVP so the caller
       * can tell whether the guest was seated or waitlisted.
       */
      submitRsvp({ eventId, userId = null, name, email, status, plusOnes = 0 }) {
        const rsvp = {
          id: generateId('rsvp'),
          eventId,
          userId,
          name: name.trim(),
          email: email.trim().toLowerCase(),
          status,
          plusOnes: status === 'declined' ? 0 : Number(plusOnes) || 0,
          waitlisted: false,
          createdAt: now(),
        };
        const action = { type: 'RSVP_SUBMIT', payload: { rsvp } };
        // Run the reducer ahead of time to learn the outcome (seated vs waitlisted).
        const preview = eventReducer(stateRef.current, action);
        dispatch(action);
        return preview.rsvps.find((r) => r.eventId === eventId && r.email === rsvp.email);
      },

      removeRsvp(id) {
        dispatch({ type: 'RSVP_REMOVE', payload: { id } });
      },

      addTask(eventId, values) {
        const task = { ...values, id: generateId('task'), eventId, createdAt: now() };
        dispatch({ type: 'TASK_ADD', payload: { task } });
        return task;
      },
      updateTask(id, changes) {
        dispatch({ type: 'TASK_UPDATE', payload: { id, changes } });
      },
      deleteTask(id) {
        dispatch({ type: 'TASK_DELETE', payload: { id } });
      },

      addComment(eventId, userId, text) {
        const comment = { id: generateId('cmt'), eventId, userId, text: text.trim(), createdAt: now() };
        dispatch({ type: 'COMMENT_ADD', payload: { comment } });
        return comment;
      },
      deleteComment(id) {
        dispatch({ type: 'COMMENT_DELETE', payload: { id } });
      },

      /** Restores the demo data. */
      async resetData() {
        skipNextSave.current = true;
        const db = await resetDatabase();
        dispatch({ type: 'HYDRATE', payload: db });
      },
    };
  }, []);

  const value = useMemo(() => ({ ...state, ...actions }), [state, actions]);
  return <EventContext.Provider value={value}>{children}</EventContext.Provider>;
}

EventProvider.propTypes = { children: PropTypes.node.isRequired };

export function useEvents() {
  const ctx = useContext(EventContext);
  if (!ctx) throw new Error('useEvents must be used inside <EventProvider>');
  return ctx;
}
