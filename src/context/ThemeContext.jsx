/** Light/dark theme; Navbar and ThemeToggle consume it, and explicit choices are remembered. */
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

/** Provides the resolved theme and toggleTheme action to descendants; children is the app subtree. */
export function ThemeProvider({ children }) {
  // gather:theme stores the user's explicit theme choice; null follows the operating-system preference.
  const [stored, setStored] = useLocalStorage('gather:theme', null);
  const theme = stored || systemTheme();

  // When theme changes, update the root attribute used by the light/dark CSS variables.
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

/** Returns the active theme and its persistence-aware toggle action. */
export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>');
  return ctx;
}
