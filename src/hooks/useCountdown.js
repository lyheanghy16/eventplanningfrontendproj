import { useEffect, useState } from 'react';

/**
 * Ticking countdown to an event's start.
 * Returns { status: 'upcoming' | 'live' | 'ended', days, hours, minutes, seconds, totalMs }.
 */
export default function useCountdown(start, end) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const startMs = new Date(start).getTime();
  const endMs = end ? new Date(end).getTime() : startMs;
  const status = now < startMs ? 'upcoming' : now <= endMs ? 'live' : 'ended';
  const totalMs = Math.max(startMs - now, 0);
  const totalSeconds = Math.floor(totalMs / 1000);

  return {
    status,
    totalMs,
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
}
