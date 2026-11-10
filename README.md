# Gather – Event Planning Portal

React 18 + Vite + React Router 6, JavaScript/JSX only, plain CSS, localStorage persistence.

## Run
```bash
npm install
npm run dev        # http://localhost:5173
npm run build && npm run preview   # production build
```
Requires Node 18+. Deep links like `/event/evt_launch` work in dev/preview (SPA fallback); on static hosting configure a rewrite to `index.html`.

## Try it
- Use the **user switcher** (header) to act as Ava (host of 2 events), Ben (co-host), Chloe (guest) – or pick *Sign out* to see the public guest view.
- Public guest page: `/event/evt_react` (capacity 6, already full → RSVP lands on the **waitlist**; remove/decline someone as host and the waitlist auto-promotes).
- Management view: `/events/:id` (hosts/co-hosts) with Overview, Attendees, Tasks (list + drag-and-drop Kanban), Comments.
- Calendar (month/week/agenda, **Export .ics**), My Tasks (overdue highlighted), dark-mode toggle.
- Footer/dev tip: clear `localStorage` key `gather:db:v1` to reset demo data.

## Structure
```
src/
  components/  EventCard, EventForm, RSVPForm, CalendarMonth, CalendarWeek, Agenda, TaskBoard,
               TaskItem, TaskList, TaskForm, CommentThread, AttendeeList, Modal, Tabs, Countdown…
  pages/       Dashboard, EventDetail, CalendarPage, MyTasks, PublicEvent, NotFound
  context/     EventContext (useReducer), AuthContext (mock user switcher), ThemeContext, ToastContext
  hooks/       useLocalStorage, useCountdown, useDocumentTitle
  utils/       dateHelpers, icsExport, idGenerator, eventHelpers (roles, capacity/waitlist), validators
  services/    api.js  ← the only data-layer module (localStorage today)
  data/        seed.js (5 events, users, RSVPs, tasks, comments)
```

## Swapping in a real API
`src/services/api.js` exposes `loadDatabase`, `saveDatabase`, `resetDatabase`, `subscribeToDatabase`
(all promise-based). Re-implement them with `fetch`/WebSocket – or replace snapshot saving with per-action
endpoints driven by the reducer actions – and nothing else changes.

## Roles (enforced in the UI; a backend must re-check)
| | Host | Co-host | Guest |
|---|---|---|---|
| Edit / duplicate event | ✔ | ✔ | ✖ |
| Delete event, manage co-hosts | ✔ | ✖ | ✖ |
| View/remove attendees | ✔ | ✔ | ✖ |
| Create/edit/delete tasks | ✔ | ✔ | ✖ (can update status of tasks assigned to them) |
| Moderate comments | ✔ | ✔ | own only |
| RSVP, comment, view public page | ✔ | ✔ | ✔ |

Private events are unlisted: visible on the dashboard only to host/co-hosts/invitees; anyone with the link can open the guest page.
