// Minimal RFC 5545 (.ics) generator – enough for Google/Apple/Outlook calendars.

const pad = (n) => String(n).padStart(2, '0');

/** Date -> "20261105T180000Z" (UTC) */
const toIcsUtc = (date) =>
  `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}` +
  `T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`;

/** Escape TEXT values per RFC 5545 §3.3.11 */
const escapeText = (s = '') =>
  String(s).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');

/** Fold lines longer than 75 octets (continuation lines start with a space). */
function fold(line) {
  const enc = new TextEncoder();
  const parts = [];
  let current = '';
  let bytes = 0;
  let limit = 75;
  for (const ch of line) {
    const size = enc.encode(ch).length;
    if (bytes + size > limit) {
      parts.push(current);
      current = ' ';
      bytes = 1;
      limit = 75;
    }
    current += ch;
    bytes += size;
  }
  parts.push(current);
  return parts.join('\r\n');
}

/** Build the text of a VCALENDAR containing the given events. */
export function buildICS(events) {
  const stamp = toIcsUtc(new Date());
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Gather Event Portal//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH'];

  events.forEach((e) => {
    const where = e.locationType === 'virtual' ? e.link : e.location;
    lines.push(
      'BEGIN:VEVENT',
      `UID:${e.id}@gather.local`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${toIcsUtc(new Date(e.start))}`,
      `DTEND:${toIcsUtc(new Date(e.end))}`,
      `SUMMARY:${escapeText(e.title)}`,
      `DESCRIPTION:${escapeText(e.description)}`,
      `LOCATION:${escapeText(where)}`,
      `URL:${window.location.origin}/event/${e.id}`,
      'END:VEVENT'
    );
  });

  lines.push('END:VCALENDAR');
  return lines.map(fold).join('\r\n') + '\r\n';
}

/** Trigger a browser download of an .ics file. */
export function downloadICS(events, filename = 'events.ics') {
  const blob = new Blob([buildICS(events)], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export const slugify = (s) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'event';
