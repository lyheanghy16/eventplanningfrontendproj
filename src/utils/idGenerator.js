/**
 * Generates a short, URL-safe unique id with a readable prefix, e.g. "evt_3f9a1c0b7d".
 * Uses crypto.randomUUID when available and falls back to Math.random.
 * Swap this out for server-generated ids when a real API is added.
 */
export function generateId(prefix = 'id') {
  let random;
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    random = crypto.randomUUID().replace(/-/g, '').slice(0, 10);
  } else {
    random = Math.random().toString(36).slice(2, 12).padEnd(10, '0');
  }
  return `${prefix}_${random}`;
}

export default generateId;
