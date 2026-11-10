/**
 * Toast notifications. `useToast()` returns { success, error, info, dismiss }.
 * Toasts render in an aria-live region so screen readers announce them.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { generateId } from '../utils/idGenerator';

const ToastContext = createContext(null);
const ICONS = { success: '✓', error: '!', info: 'i' };

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());

  const dismiss = useCallback((id) => {
    clearTimeout(timers.current.get(id));
    timers.current.delete(id);
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (message, type = 'info', timeout = 4000) => {
      const id = generateId('toast');
      setToasts((list) => [...list.slice(-3), { id, message, type }]);
      if (timeout > 0) timers.current.set(id, setTimeout(() => dismiss(id), timeout));
      return id;
    },
    [dismiss],
  );

  useEffect(() => {
    const active = timers.current;
    return () => active.forEach((timer) => clearTimeout(timer));
  }, []);

  const api = useMemo(
    () => ({
      success: (message) => push(message, 'success'),
      error: (message) => push(message, 'error', 6000),
      info: (message) => push(message, 'info'),
      dismiss,
    }),
    [push, dismiss],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="toast-region" aria-live="polite" aria-label="Notifications">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`toast toast--${toast.type}`}
            role={toast.type === 'error' ? 'alert' : 'status'}
          >
            <span className="toast-icon" aria-hidden="true">{ICONS[toast.type]}</span>
            <p>{toast.message}</p>
            <button
              type="button"
              className="icon-btn"
              aria-label="Dismiss notification"
              onClick={() => dismiss(toast.id)}
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

ToastProvider.propTypes = { children: PropTypes.node.isRequired };

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}
