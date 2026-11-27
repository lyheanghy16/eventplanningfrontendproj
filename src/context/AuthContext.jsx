/**
 * AuthContext: shared users, active account, session restoration, and multi-account actions.
 * AuthProvider wraps App; pages and account controls consume it through useAuth().
 */
import {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState,
} from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { useEvents } from './EventContext';
import { useToast } from './ToastContext';

const AuthContext = createContext(null);
// gather_users stores user profiles plus per-user password salt/hash records.
const USERS_KEY = 'gather_users';
// gather_session stores the active user ID and remember preference in the chosen storage.
const SESSION_KEY = 'gather_session';
// gather_accounts stores only the signed-in user IDs, never credentials.
const ACCOUNTS_KEY = 'gather_accounts';
// gather_active_account stores { userId } in localStorage or sessionStorage.
const ACTIVE_KEY = 'gather_active_account';
// gather_data_version stores the numeric auth-data schema version for migrations.
const VERSION_KEY = 'gather_data_version';
const DATA_VERSION = 2;
const DEMO_PASSWORD = 'admin';
const DEMO_EMAIL = 'dev@gather.app';

function readJson(storage, key) {
  try {
    const raw = storage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    // A malformed or unavailable key should not crash account restoration; log it for diagnosis.
    console.error(`Unable to read ${key} from browser storage.`, error);
    return null;
  }
}

function writeJson(storage, key, value) {
  try {
    storage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Unable to save ${key} to browser storage.`, error);
    throw new Error('Browser storage is unavailable. Please check your browser settings.');
  }
}

function randomHex(bytes = 16) {
  const values = new Uint8Array(bytes);
  if (window.crypto?.getRandomValues) window.crypto.getRandomValues(values);
  else values.forEach((_, index) => { values[index] = Math.floor(Math.random() * 256); });
  return Array.from(values, (value) => value.toString(16).padStart(2, '0')).join('');
}

function hasSecureCrypto() {
  return !!window.isSecureContext && !!window.crypto?.subtle;
}

async function hashPassword(password, salt) {
  if (!hasSecureCrypto()) {
    const error = new Error('Secure context required. Open Gather over HTTPS or localhost to use password login.');
    error.code = 'SECURE_CONTEXT_REQUIRED';
    throw error;
  }
  // Salt each account's password hash so equal passwords do not produce equal stored digests.
  const encoder = new TextEncoder();
  const input = await window.crypto.subtle.digest('SHA-256', encoder.encode(`${salt}:${password}`));
  return Array.from(new Uint8Array(input), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function initials(name) {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  return (parts[0]?.[0] || '') + (parts.length > 1 ? parts.at(-1)?.[0] || '' : '');
}

function avatarColor() {
  const colors = ['#4f46e5', '#0284c7', '#059669', '#d97706', '#dc2626', '#db2777', '#7c3aed'];
  return colors[Math.floor(Math.random() * colors.length)];
}

async function repairDemoUsers(storedUsers, demoUsers, storedVersion) {
  const users = [...storedUsers];
  const migrate = Number(storedVersion) < DATA_VERSION;
  let hashesReady = hasSecureCrypto();

  for (const demo of demoUsers) {
    const index = users.findIndex((user) => user.id === demo.id || user.email?.toLowerCase() === demo.email.toLowerCase());
    const existing = index === -1 ? {} : users[index];
    const salt = migrate || !existing.salt ? randomHex() : existing.salt;
    let passwordHash = existing.passwordHash;
    if (hasSecureCrypto()) {
      passwordHash = await hashPassword(DEMO_PASSWORD, salt);
    } else {
      hashesReady = false;
      if (!existing.salt || !passwordHash || migrate) {
        console.error(`Cannot hash the demo password for ${demo.email}: secure context required.`);
        passwordHash = '';
      }
    }

    const repaired = {
      ...existing,
      // Seeded demo profiles override stale stored flags on every app load.
      ...demo,
      avatarInitials: initials(demo.name).toUpperCase(),
      salt,
      passwordHash,
    };
    if (index === -1) users.push(repaired);
    else users[index] = repaired;
  }

  return { users, hashesReady };
}

/**
 * Provides account/session state to the app.
 * Props: children is the router subtree; provider effects restore users and synchronize profiles.
 */
export function AuthProvider({ children }) {
  const navigate = useNavigate();
  const toast = useToast();
  const { status: eventsStatus, users: eventUsers, syncUsers } = useEvents();
  const demoUsersRef = useRef(eventUsers);
  demoUsersRef.current = eventUsers;
  // `users` includes profile and password metadata; `accountIds` contains only IDs persisted in gather_accounts.
  const [users, setUsers] = useState([]);
  const [accountIds, setAccountIds] = useState([]);
  // The selected profile drives permissions and all account-specific page data.
  const [currentUser, setCurrentUser] = useState(null);
  // Keeps route guards from redirecting before event and auth data have both restored.
  const [loading, setLoading] = useState(true);

  const persistSignedAccounts = useCallback((ids) => {
    setAccountIds(ids);
    writeJson(window.localStorage, ACCOUNTS_KEY, ids);
  }, []);

  const persistActive = useCallback((user, remember = true) => {
    const session = { userId: user.id, remember: !!remember };
    window.localStorage.removeItem(ACTIVE_KEY);
    window.sessionStorage.removeItem(ACTIVE_KEY);
    window.localStorage.removeItem(SESSION_KEY);
    window.sessionStorage.removeItem(SESSION_KEY);
    const storage = remember ? window.localStorage : window.sessionStorage;
    writeJson(storage, ACTIVE_KEY, { userId: user.id });
    writeJson(storage, SESSION_KEY, session);
  }, []);

  const activateUser = useCallback((user, remember = true) => {
    setCurrentUser(user);
    persistActive(user, remember);
  }, [persistActive]);

  /** Reseeds demo profiles and repairs their salted hashes; writes users and schema version to localStorage. */
  const ensureDemoUsers = useCallback(async () => {
    const storedUsers = readJson(window.localStorage, USERS_KEY);
    const existing = Array.isArray(storedUsers) ? storedUsers : [];
    const storedVersion = readJson(window.localStorage, VERSION_KEY);
    const repaired = await repairDemoUsers(existing, demoUsersRef.current, storedVersion);
    writeJson(window.localStorage, USERS_KEY, repaired.users);
    if (repaired.hashesReady) {
      writeJson(window.localStorage, VERSION_KEY, DATA_VERSION);
    }
    return repaired.users;
  }, []);

  // After eventsStatus/ensureDemoUsers change, migrate seeds and restore the active ID from session storage.
  useEffect(() => {
    if (eventsStatus !== 'ready') return undefined;
    let cancelled = false;

    async function restore() {
      try {
        const storedUsers = await ensureDemoUsers();
        const accountsValue = readJson(window.localStorage, ACCOUNTS_KEY);
        const ids = Array.isArray(accountsValue)
          ? [...new Set(accountsValue.filter((id) => storedUsers.some((user) => user.id === id)))]
          : [];
        const localActive = readJson(window.localStorage, ACTIVE_KEY);
        const sessionActive = readJson(window.sessionStorage, ACTIVE_KEY);
        const localSession = readJson(window.localStorage, SESSION_KEY);
        const session = readJson(window.sessionStorage, SESSION_KEY);
        const activeId = session?.userId || sessionActive?.userId || localSession?.userId ||
          (typeof localActive === 'string' ? localActive : localActive?.userId);
        const hasSession = !!(session?.userId || localSession?.userId);
        const validId = hasSession && ids.includes(activeId) ? activeId : null;
        const active = storedUsers.find((user) => user.id === validId) || null;

        if (!cancelled) {
          setUsers(storedUsers);
          setAccountIds(ids);
          setCurrentUser(active);
        }
      } catch (error) {
        console.error('Unable to restore Gather authentication state.', error);
        if (!cancelled) {
          setUsers([]);
          setAccountIds([]);
          setCurrentUser(null);
          toast.error(error.message || 'Unable to restore your account data.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    restore();
    return () => { cancelled = true; };
  }, [eventsStatus, ensureDemoUsers, toast]);

  // When loading/users/syncUsers changes, mirror safe profile fields into EventContext.
  useEffect(() => {
    if (!loading && users.length > 0) {
      syncUsers(users.map(({ id, name, email, avatarColor: color, avatarInitials }) => ({
        id, name, email, avatarColor: color, avatarInitials,
      })));
    }
  }, [loading, users, syncUsers]);

  /**
   * Creates and activates a user from { name, email, password }.
   * Writes the hashed user and signed-in ID to localStorage, then stores a remembered session.
   */
  const signup = useCallback(async ({ name, email, password }) => {
    const cleanEmail = email.trim().toLowerCase();
    if (users.some((user) => user.email.toLowerCase() === cleanEmail)) throw new Error('EMAIL_EXISTS');
    const id = `u_${(window.crypto?.randomUUID?.() || `${Date.now()}${randomHex(4)}`).replace(/-/g, '')}`;
    const salt = randomHex();
    const user = {
      id,
      name: name.trim(),
      email: cleanEmail,
      isDemo: false,
      avatarInitials: initials(name).toUpperCase(),
      avatarColor: avatarColor(),
      salt,
      passwordHash: await hashPassword(password, salt),
    };
    const nextUsers = [...users, user];
    writeJson(window.localStorage, USERS_KEY, nextUsers);
    writeJson(window.localStorage, VERSION_KEY, DATA_VERSION);
    setUsers(nextUsers);
    persistSignedAccounts([...new Set([...accountIds, user.id])]);
    activateUser(user, true);
    return user;
  }, [users, accountIds, persistSignedAccounts, activateUser]);

  /**
   * Verifies { email, password, remember }, activates that account, and adds its ID to gather_accounts.
   * Persists the active session in localStorage when remembered, otherwise in sessionStorage.
   */
  const login = useCallback(async ({ email, password, remember = true }) => {
    const cleanEmail = email.trim().toLowerCase();
    const user = users.find((item) => item.email.toLowerCase() === cleanEmail);
    if (!user) throw new Error('INVALID_CREDENTIALS');
    const passwordHash = await hashPassword(password, user.salt);
    if (passwordHash !== user.passwordHash) throw new Error('INVALID_CREDENTIALS');

    persistSignedAccounts([...new Set([...accountIds, user.id])]);
    activateUser(user, remember);
    return user;
  }, [users, accountIds, persistSignedAccounts, activateUser]);

  /**
   * Activates Dev Patel without password comparison, repairs demo seeds, and navigates to /dashboard.
   * Writes account/session records and shows success or error toast feedback.
   */
  const loginAsDemo = useCallback(async () => {
    try {
      const currentDemoUsers = await ensureDemoUsers();
      const demo = currentDemoUsers.find((user) => user.id === 'u_dev' || user.email === DEMO_EMAIL);
      if (!demo) throw new Error('The Dev Patel demo account could not be created.');

      const otherIds = readJson(window.localStorage, ACCOUNTS_KEY);
      const ids = Array.isArray(otherIds)
        ? otherIds.filter((id) => id !== demo.id && currentDemoUsers.some((user) => user.id === id))
        : [];
      const nextIds = [...ids, demo.id];
      writeJson(window.localStorage, ACCOUNTS_KEY, nextIds);
      writeJson(window.localStorage, VERSION_KEY, DATA_VERSION);
      setUsers(currentDemoUsers);
      setAccountIds(nextIds);
      setCurrentUser(demo);
      persistActive(demo, true);
      setLoading(false);
      toast.success('Signed in to the demo as Dev Patel');
      navigate('/dashboard', { replace: true });
    } catch (error) {
      console.error('Demo sign-in failed.', error);
      toast.error(error.message || 'Unable to sign in to the demo.');
    }
  }, [ensureDemoUsers, persistActive, toast, navigate]);

  /** Switches to a signed-in user ID, preserving the current remember-me storage mode. */
  const switchAccount = useCallback((userId) => {
    const user = users.find((item) => item.id === userId);
    if (!user || !accountIds.includes(userId)) return false;
    const session = readJson(window.sessionStorage, SESSION_KEY) || readJson(window.localStorage, SESSION_KEY);
    activateUser(user, session?.remember !== false);
    return true;
  }, [users, accountIds, activateUser]);

  /**
   * Removes a user ID from the local signed-in account list; if active, activates a remaining account.
   * Updates localStorage/session state but does not delete the user's profile.
   */
  const removeAccount = useCallback((userId) => {
    const nextIds = accountIds.filter((id) => id !== userId);
    persistSignedAccounts(nextIds);
    if (currentUser?.id === userId) {
      const fallback = users.find((user) => nextIds.includes(user.id)) || null;
      if (fallback) activateUser(fallback, true);
      else {
        setCurrentUser(null);
        window.localStorage.removeItem(ACTIVE_KEY);
        window.sessionStorage.removeItem(ACTIVE_KEY);
        window.localStorage.removeItem(SESSION_KEY);
        window.sessionStorage.removeItem(SESSION_KEY);
      }
    }
  }, [accountIds, currentUser, users, persistSignedAccounts, activateUser]);

  /** Signs out only the active user and activates another stored account when available. */
  const logout = useCallback(() => {
    const nextIds = accountIds.filter((id) => id !== currentUser?.id);
    persistSignedAccounts(nextIds);
    const fallback = users.find((user) => nextIds.includes(user.id)) || null;
    if (fallback) activateUser(fallback, true);
    else {
      setCurrentUser(null);
      window.localStorage.removeItem(ACTIVE_KEY);
      window.localStorage.removeItem(SESSION_KEY);
      window.sessionStorage.removeItem(ACTIVE_KEY);
      window.sessionStorage.removeItem(SESSION_KEY);
    }
  }, [accountIds, currentUser, users, persistSignedAccounts, activateUser]);

  /** Clears every signed-in ID and session from localStorage/sessionStorage. */
  const logoutAll = useCallback(() => {
    persistSignedAccounts([]);
    setCurrentUser(null);
    window.localStorage.removeItem(ACTIVE_KEY);
    window.localStorage.removeItem(SESSION_KEY);
    window.sessionStorage.removeItem(ACTIVE_KEY);
    window.sessionStorage.removeItem(SESSION_KEY);
  }, [persistSignedAccounts]);

  /** Opens the login flow in add-account mode without signing out the active user. */
  const addAccount = useCallback(() => navigate('/login?add=1'), [navigate]);
  const accounts = useMemo(
    () => accountIds.map((id) => users.find((user) => user.id === id)).filter(Boolean),
    [accountIds, users],
  );
  // Demo mode follows the active profile, so account switches update the banner immediately.
  const isDemoMode = currentUser?.isDemo === true;
  const value = useMemo(() => ({
    currentUser, users, accounts, signup, login, loginAsDemo, switchAccount,
    addAccount, removeAccount, logout, logoutAll,
    isAuthenticated: !!currentUser, isDemoMode, loading,
  }), [
    currentUser, users, accounts, signup, login, loginAsDemo, switchAccount,
    addAccount, removeAccount, logout, logoutAll, isDemoMode, loading,
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

AuthProvider.propTypes = { children: PropTypes.node.isRequired };

/** Returns the auth provider's current user, account list, status, and account actions. */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>');
  return context;
}
