/**
 * ThemeToggle: button for switching between the saved light and dark themes.
 * Used in Navbar; ThemeContext owns the active theme and persistence.
 */
import { useTheme } from '../context/ThemeContext';

/** Reads ThemeContext and exposes the current dark-mode state through aria-pressed. */
export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const dark = theme === 'dark';
  return (
    <button
      type="button"
      className="icon-btn icon-btn--bordered"
      onClick={toggleTheme}
      aria-pressed={dark}
      aria-label="Dark mode"
      title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <span aria-hidden="true">{dark ? '🌙' : '☀️'}</span>
    </button>
  );
}
