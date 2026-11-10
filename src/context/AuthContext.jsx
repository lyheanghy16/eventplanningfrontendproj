/**
 * AuthContext - a *mock* authentication layer.
 * There are no passwords: the user switcher in the header simply picks which seeded user
 * you are "acting as" (or signs you out to experience the public guest view).
 * Replace with real auth later; consumers only rely on `currentUser`.
 */
import { createContext, useCallback, useContext, useMemo } from 'react';
import PropTypes from 'prop-types';
import useLocalStorage from '../hooks/useLocalStorage';
import { useEvents } from './EventContext';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const { users } = useEvents();
  const [userId, setUserId] = useLocalStorage('gather:currentUser', 'u_ava');

  const currentUser = useMemo(() => users.find((u) => u.id === userId) || null, [users, userId]);
  const switchUser = useCallback((id) => setUserId(id || null), [setUserId]);
  const signOut = useCallback(() => setUserId(null), [setUserId]);

  const value = useMemo(
    () => ({ currentUser, users, switchUser, signOut }),
    [currentUser, users, switchUser, signOut],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

AuthProvider.propTypes = { children: PropTypes.node.isRequired };

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
