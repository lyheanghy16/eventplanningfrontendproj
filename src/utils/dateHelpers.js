// Date helpers built on native Date/Intl (no libraries). Weeks start on Sunday.
// Task due dates are stored as local "YYYY-MM-DD" keys; event times as ISO strings.

export const DAY_MS = 86400000;
const pad = (n) => String(n).padStart(2, '0');
const toDate = (d) => (d instanceof Date ? d : new Date(d));

/* ------------------------------ arithmetic ------------------------------ */

export const startOfDay = (d) => {
  const x = new Date(toDate(d));
  x.setHours(0, 0, 0, 0);
  return x;
};

export const addDays = (d, n) => {
  const x = new Date(toDate(d));
  x.setDate(x.getDate() + n);
  return x;
};

export const addMonths = (d, n) => {
  const base = toDate(d);
  const first = new Date(base.getFullYear(), base.getMonth() + n, 1);
  const last = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
  first.setDate(Math.min(base.getDate(), last)); // Jan 31 + 1 month -> Feb 28
  return first;
};

export const startOfWeek = (d, weekStartsOn = 0) => {
  const x = startOfDay(d);
  x.setDate(x.getDate() - ((x.getDay() - weekStartsOn + 7) % 7));
  return x;
};

export const isSameDay = (a, b) => {
  const x = toDate(a);
  const y = toDate(b);
  return x.getFullYear() === y.getFullYear() && x.getMonth() === y.getMonth() && x.getDate() === y.getDate();
};

export const isSameMonth = (a, b) => {
  const x = toDate(a);
  const y = toDate(b);
  return x.getFullYear() === y.getFullYear() && x.getMonth() === y.getMonth();
};

export const isToday = (d) => isSameDay(d, new Date());

/** Local date -> "YYYY-MM-DD" */
export const toDateKey = (d) => {
  const x = toDate(d);
  return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}`;
};

/** "YYYY-MM-DD" -> local Date at midnight */
export const parseDateKey = (key) => {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
};

/** True when any part of the event falls on `day` (supports multi-day events). */
export const eventOverlapsDay = (event, day) => {
  const s = startOfDay(day).getTime();
  return new Date(event.start).getTime() < s + DAY_MS && new Date(event.end).getTime() > s;
};

/** Weeks (arrays of 7 Dates) covering the month of `anchor`; always 6 rows. */
export const getMonthMatrix = (anchor) => {
  const a = toDate(anchor);
  const first = startOfWeek(new Date(a.getFullYear(), a.getMonth(), 1));
  return Array.from({ length: 6 }, (_, w) => Array.from({ length: 7 }, (_, d) => addDays(first, w * 7 + d)));
};

/** ['Sun', 'Mon', …] localized. */
export const getWeekdayLabels = (weekStartsOn = 0, width = 'short') =>
  Array.from({ length: 7 }, (_, i) =>
    new Date(2023, 0, 1 + weekStartsOn + i).toLocaleDateString(undefined, { weekday: width }),
  );

/* ------------------------------- formatting ------------------------------ */

export const formatTime = (d) => toDate(d).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
export const formatHour = (h) => new Date(2023, 0, 1, h).toLocaleTimeString(undefined, { hour: 'numeric' });
export const formatWeekday = (d) => toDate(d).toLocaleDateString(undefined, { weekday: 'short' });
export const formatMonthShort = (d) => toDate(d).toLocaleDateString(undefined, { month: 'short' });
export const formatMonthYear = (d) => toDate(d).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
export const formatShortDate = (d) => toDate(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
export const formatLongDate = (d) =>
  toDate(d).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

export const formatWeekRange = (d) => {
  const start = startOfWeek(d);
  const end = addDays(start, 6);
  return `${formatShortDate(start)} – ${end.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`;
};

/** "Thu, Nov 5 · 6:00 PM – 10:00 PM" or a two-part range for multi-day events. */
export const formatEventRange = (startIso, endIso) => {
  const day = (d) => toDate(d).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  if (isSameDay(startIso, endIso)) return `${day(startIso)} · ${formatTime(startIso)} – ${formatTime(endIso)}`;
  return `${day(startIso)}, ${formatTime(startIso)} → ${day(endIso)}, ${formatTime(endIso)}`;
};

/** "Today", "Tomorrow", "Yesterday", "in 3 days", "2 days ago" (calendar-day based). */
export const formatRelativeDay = (d) => {
  const diff = Math.round((startOfDay(d) - startOfDay(new Date())) / DAY_MS);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff === -1) return 'Yesterday';
  return diff > 0 ? `in ${diff} days` : `${-diff} days ago`;
};

/** "5 minutes ago", "3 hours ago", "2 days ago". */
export const formatTimeAgo = (iso) => {
  const sec = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (sec < 45) return 'just now';
  if (sec < 3600) return `${Math.round(sec / 60)} min ago`;
  if (sec < 86400) return `${Math.round(sec / 3600)} h ago`;
  if (sec < 86400 * 30) return `${Math.round(sec / 86400)} d ago`;
  return formatShortDate(iso);
};

/* ------------------------ <input type="datetime-local"> ------------------ */

export const toInputDateTime = (d) => {
  const x = toDate(d);
  return `${toDateKey(x)}T${pad(x.getHours())}:${pad(x.getMinutes())}`;
};

export const fromInputDateTime = (value) => new Date(value).toISOString();
