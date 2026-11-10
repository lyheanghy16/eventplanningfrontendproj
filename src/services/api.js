/**
 * Data layer. This is the ONLY module that knows where data lives (localStorage).
 *
 * The contract is deliberately small and async so a real backend can replace it:
 *   loadDatabase()            -> Promise<{ users, events, rsvps, tasks, comments }>
 *   saveDatabase(db)          -> Promise<void>
 *   resetDatabase()           -> Promise<db>
 *   subscribeToDatabase(cb)   -> unsubscribe()   (push updates from other tabs / a server)
 *
 * To go "real": implement these with fetch()/WebSocket calls (or replace the snapshot
 * save with per-action endpoints such as POST /events, POST /events/:id/rsvps) and keep
 * EventContext unchanged.
 */
import { buildSeed } from '../data/seed';

export const DB_KEY = 'gather:db:v1';

// Simulated network latency so loading states are visible (skipped in tests).
const LATENCY_MS = import.meta.env?.MODE === 'test' ? 0 : 350;
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function readRaw() {
  try {
    const raw = window.localStorage.getItem(DB_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeRaw(db) {
  window.localStorage.setItem(DB_KEY, JSON.stringify(db));
}

export async function loadDatabase() {
  await wait(LATENCY_MS);
  const existing = readRaw();
  if (existing && Array.isArray(existing.events)) return existing;
  const seeded = buildSeed();
  try {
    writeRaw(seeded);
  } catch {
    /* storage full / unavailable: the app still works in memory */
  }
  return seeded;
}

export async function saveDatabase(db) {
  writeRaw(db);
}

export async function resetDatabase() {
  const seeded = buildSeed();
  writeRaw(seeded);
  return seeded;
}

/** Calls `callback(db)` when another tab changes the data. */
export function subscribeToDatabase(callback) {
  function onStorage(event) {
    if (event.key !== DB_KEY || !event.newValue) return;
    try {
      callback(JSON.parse(event.newValue));
    } catch {
      /* ignore malformed payloads */
    }
  }
  window.addEventListener('storage', onStorage);
  return () => window.removeEventListener('storage', onStorage);
}
