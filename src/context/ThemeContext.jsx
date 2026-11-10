/** Light/dark theme. Defaults to the OS preference, then remembers the user's choice. */
import { createContext, useCallback, useContext, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import useLocalStorage from '../hooks/useLocalStorage';

const ThemeContext = createContext(null);

function systemTheme() {
  try {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  } catch {
    return 'light';
  }
}

export function ThemeProvider({ children }) {
  const [stored, setStored] = useLocalStorage('gather:theme', null);
  const theme = stored || systemTheme();

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const toggleTheme = useCallback(
    () => setStored(theme === 'dark' ? 'light' : 'dark'),
    [theme, setStored],
  );
  const value = useMemo(() => ({ theme, toggleTheme }), [theme, toggleTheme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

ThemeProvider.propTypes = { children: PropTypes.node.isRequired };

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>');
  return ctx;
}
