import { useEffect, useState } from 'react';

/**
 * useState that persists to localStorage (JSON encoded).
 * Safe when storage is unavailable or contains invalid JSON.
 * Used by ThemeContext and CalendarPage for browser-local preferences.
 */
export default function useLocalStorage(key, initialValue) {
  // `key` names a JSON-encoded localStorage value; invalid or unavailable reads fall back to initialValue.
  const [value, setValue] = useState(() => {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw !== null) return JSON.parse(raw);
    } catch {
      // Storage may be disabled or contain invalid JSON; keep the caller's initial state.
    }
    return typeof initialValue === 'function' ? initialValue() : initialValue;
  });

  // Write each value/key change to localStorage; unavailable storage leaves React state usable in memory.
  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* ignore quota / privacy-mode errors */
    }
  }, [key, value]);

  return [value, setValue];
}
